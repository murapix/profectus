import type { OptionsFunc, Replace } from "features/feature";
import { findFeatures } from "features/feature";
import { Layer } from "game/layers";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import {
    Requirements,
    createVisibilityRequirement,
    displayRequirements,
    payRequirements,
    requirementsMet
} from "game/requirements";
import { isFunction } from "util/common";
import { processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, VueFeature, VueFeatureOptions, render, vueFeatureMixin } from "util/vue";
import type { MaybeRef, MaybeRefOrGetter, Ref } from "vue";
import { computed, unref } from "vue";
import Clickable from "./Clickable.vue";

/** A symbol used to identify {@link Upgrade} features. */
export const UpgradeType = Symbol("Upgrade");

/**
 * An object that configures a {@link Upgrade}.
 */
export interface UpgradeOptions extends VueFeatureOptions {
    /** The display to use for this upgrade. */
    display?:
        | MaybeRefOrGetter<Renderable>
        | {
              /** A header to appear at the top of the display. */
              title?: MaybeRefOrGetter<Renderable>;
              /** The main text that appears in the display. */
              description: MaybeRefOrGetter<Renderable>;
              /** A description of the current effect of the achievement. Useful when the effect changes dynamically. */
              effectDisplay?: MaybeRefOrGetter<Renderable>;
          };
    /** The requirements to purchase this upgrade. */
    requirements: Requirements;
    /** A function that is called when the upgrade is purchased. */
    onPurchase?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link UpgradeOptions} to create an {@link Upgrade}.
 */
export interface BaseUpgrade extends VueFeature {
    /** Whether or not this upgrade has been purchased. */
    bought: Persistent<boolean>;
    /** Whether or not the upgrade can currently be purchased. */
    canPurchase: Ref<boolean>;
    /** Purchase the upgrade */
    purchase: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof UpgradeType;
}

/** An object that represents a feature that can be purchased a single time. */
export type Upgrade = Replace<
    Replace<UpgradeOptions, BaseUpgrade>,
    {
        display?:
            | MaybeRef<Renderable>
            | {
                  /** A header to appear at the top of the display. */
                  title?: MaybeRef<Renderable>;
                  /** The main text that appears in the display. */
                  description: MaybeRef<Renderable>;
                  /** A description of the current effect of the achievement. Useful when the effect changes dynamically. */
                  effectDisplay?: MaybeRef<Renderable>;
              };
    }
>;

/**
 * Lazily creates an upgrade with the given options.
 * @param optionsFunc Upgrade options.
 */
export function createUpgrade<T extends UpgradeOptions>(
    optionsFunc: OptionsFunc<T, BaseUpgrade, Upgrade>
) {
    const bought = persistent<boolean>(false, false);
    return createLazyProxy(feature => {
        const options = optionsFunc.call(feature, feature as Upgrade);
        const { requirements: _requirements, display: _display, ...props } = options;

        if (options.classes == null) {
            options.classes = computed(() => ({ bought: unref(upgrade.bought) }));
        } else {
            const classes = processGetter(options.classes);
            options.classes = computed(() => ({
                ...unref(classes),
                bought: unref(upgrade.bought)
            }));
        }
        const vueFeature = vueFeatureMixin("upgrade", options, () => (
            <Clickable
                onClick={upgrade.purchase}
                canClick={upgrade.canPurchase}
                display={upgrade.display}
            />
        ));
        const requirements = Array.isArray(_requirements) ? _requirements : [_requirements];
        if (vueFeature.visibility != null) {
            requirements.push(createVisibilityRequirement(vueFeature.visibility));
        }

        let display: MaybeRef<Renderable> | undefined = undefined;
        if (typeof _display === "object" && "description" in _display) {
            const title = processGetter(_display.title);
            const description = processGetter(_display.description);
            const effectDisplay = processGetter(_display.effectDisplay);

            const Title = () => (title == null ? <></> : render(title, el => <h3>{el}</h3>));
            const Description = () => render(description, el => <div>{el}</div>);
            const EffectDisplay = () =>
                effectDisplay == null ? <></> : render(effectDisplay, el => <>{el}</>);

            display = computed(() => (
                <span>
                    {title != null ? (
                        <div>
                            <Title />
                        </div>
                    ) : null}
                    <Description />
                    {effectDisplay != null ? (
                        <div>
                            Currently: <EffectDisplay />
                        </div>
                    ) : null}
                    {bought.value ? null : (
                        <>
                            <br />
                            {displayRequirements(requirements)}
                        </>
                    )}
                </span>
            ));
        } else if (_display != null) {
            display = processGetter(_display);
        }

        const upgrade = {
            type: UpgradeType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof UpgradeOptions>),
            ...vueFeature,
            bought,
            canPurchase: computed(() => !bought.value && requirementsMet(requirements)),
            requirements,
            display,
            purchase() {
                if (!unref(upgrade.canPurchase)) {
                    return;
                }
                payRequirements(requirements);
                bought.value = true;
                options.onPurchase?.();
            }
        } satisfies Upgrade;

        return upgrade;
    });
}

/**
 * Utility to auto purchase a list of upgrades whenever they're affordable.
 * @param layer The layer the upgrades are apart of
 * @param autoActive Whether or not the upgrades should currently be auto-purchasing
 * @param upgrades The specific upgrades to upgrade. If unspecified, uses all upgrades on the layer.
 */
export function setupAutoPurchase(
    layer: Layer,
    autoActive: MaybeRefOrGetter<boolean>,
    upgrades: Upgrade[] = []
): void {
    upgrades = upgrades.length === 0 ? (findFeatures(layer, UpgradeType) as Upgrade[]) : upgrades;
    const isAutoActive: MaybeRef<boolean> = isFunction(autoActive)
        ? computed(autoActive)
        : autoActive;
    layer.on("update", () => {
        if (unref(isAutoActive)) {
            upgrades.forEach(upgrade => upgrade.purchase());
        }
    });
}
