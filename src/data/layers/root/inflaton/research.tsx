import { CoercableComponent, Component, GatherProps, GenericComponent, OptionsFunc, Replace, Visibility, getUniqueID } from "features/feature";
import { Persistent, persistent } from "game/persistence";
import { Requirements, requirementsMet } from "game/requirements";
import { DecimalSource } from "lib/break_eternity";
import { Computable, GetComputableType, GetComputableTypeWithDefault, ProcessedComputable, processComputable } from "util/computed";
import { Ref, computed, unref, watch } from "vue";
import { GenericDecorator, GenericEffectFeature } from "features/decorators/common";
import { createLazyProxy } from "util/proxies";
import ResearchComponent from "../inflaton/Research.vue";

export const ResearchType = Symbol("Research");

export interface ResearchOptions {
    visibility?: Computable<Visibility | boolean>;
    prerequisites?: GenericResearch[];
    requirements: Requirements;
    display: Computable<CoercableComponent
        | {
            title: CoercableComponent;
            description: CoercableComponent;
            effect?: CoercableComponent;
        }
    >;
    canResearch?: Computable<boolean>;
    onResearch?: VoidFunction;
    research: (force: boolean) => void;
    isResearching: () => boolean;
}

export interface BaseResearch {
    id: string;
    progress: Persistent<DecimalSource>;
    progressPercentage: Ref<DecimalSource>;
    researched: Ref<boolean>;
    research: (force: boolean) => void;
    isResearching: Computable<boolean>;
    type: typeof ResearchType;
    [Component]: GenericComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Research<T extends ResearchOptions> = Replace<
    T & BaseResearch,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        display: GetComputableType<T["display"]>;
        isResearching: GetComputableType<T["isResearching"]>;
    }
>;

export type GenericResearch = Replace<
    Research<ResearchOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        isResearching: ProcessedComputable<boolean>;
    }
>;

export function createResearch<T extends ResearchOptions>(
    optionsFunc: OptionsFunc<T, BaseResearch, GenericResearch>,
    ...decorators: GenericDecorator[]
): Research<T> {
    const progress = persistent<DecimalSource>(0);
    const decoratedData = decorators.reduce((current, next) => Object.assign(current, next.getPersistentData?.()), {});
    return createLazyProxy<Research<T>, Research<T>>(feature => {
        const research = optionsFunc.call(feature, feature);

        research.id = getUniqueID("research-");
        research.type = ResearchType;
        research[Component] = ResearchComponent as GenericComponent;

        if (research.visibility == undefined && research.prerequisites == undefined) {
            console.warn(
                "Error: can't create research without a visibility or prerequisites property",
                research
            );
        }

        for (const decorator of decorators) {
            decorator.preConstruct?.(research);
        }

        research.progress = progress;
        Object.assign(research, decoratedData);

        processComputable(research as T, "canResearch");
        const canResearch = research.canResearch;
        research.canResearch = computed(() => {
            if (canResearch != null) {
                if (!unref(canResearch)) {
                    return false;
                }
            }
            return research.prerequisites?.every(research => unref(research.researched)) ?? true;
        })

        processComputable(research as T, "visibility");
        const visibility = research.visibility as ProcessedComputable<Visibility>;
        research.visibility = computed(() => {
            if (unref(research.researched)) return Visibility.Visible;
            if (research.prerequisites?.every(research => unref(research.researched) || unref(research.canResearch)) ?? true) {
                return unref(visibility) ?? Visibility.Visible;
            }
            return Visibility.None;
        });

        processComputable(research as T, "display");
        processComputable(research as T, "isResearching");

        watch(research.progress, () => {
            if (research.researched) return;
            if (requirementsMet(research.requirements)) {
                research.researched!.value = true;
            }
        });
        research.researched = computed(() => requirementsMet(research.requirements));

        for (const decorator of decorators) {
            decorator.postConstruct?.(research);
        }

        const decoratedProps = decorators.reduce((current, next) => Object.assign(current, next.getGatheredProps?.(research)), {});
        research[GatherProps] = function (this: GenericResearch) {
            const {
                visibility,
                display,
                id,
                requirements,
                canResearch,
                research,
                isResearching,
                progress,
                researched
            } = this;
            return {
                visibility,
                display,
                id,
                requirements,
                canResearch,
                research,
                isResearching,
                progress,
                researched,
                ...decoratedProps
            }
        }

        return research as Research<T>;
    })
}

export type EffectResearch<T = unknown> = GenericResearch & GenericEffectFeature<T>;

export function getResearchEffect<T = unknown>(research: EffectResearch<T>, defaultValue: T): T {
    return unref(research.researched) ? unref(research.effect) : defaultValue;
}