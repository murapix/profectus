import SpacerVue from "components/layout/Spacer.vue";
import { createClickable } from "features/clickables/clickable";
import { CoercableComponent, jsx, OptionsFunc, Replace, showIf, Visibility } from "features/feature";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createUpgrade, GenericUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import { BaseLayer, createLayer, GenericLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatTime, formatWhole } from "util/break_eternity";
import { Computable, GetComputableType, GetComputableTypeWithDefault, processComputable, ProcessedComputable } from "util/computed";
import { coerceComponent, render, renderRow } from "util/vue";
import { computed, ComputedRef, unref, watch } from "vue";
import fome from "../fome/fome";
import timecube from "../timecube/timecube";
import acceleron from "./acceleron";
import EnhancementsVue from "./Enhancements.vue";

const id = "entropy";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Entropy";
    const color = acceleron.color;

    const entropy = createResource<DecimalSource>(0, "Entropy");
    const baseEntropy = computed(() => Object.values(acceleron.loops).filter(loop => unref(loop.built)).length);
    const entropyMult = computed(() => getUpgradeEffect(timecube.upgrades.twice));
    const maxEntropy = computed(() => Decimal.times(unref(baseEntropy), unref(entropyMult)));
    watch(maxEntropy, maxEntropy => {
        const boughtUpgrades = Object.values(enhancements).filter(enhancement => unref(enhancement.bought));
        boughtUpgrades.forEach(upgrade => upgrade.bought.value = false);
        entropy.value = maxEntropy;
        boughtUpgrades.forEach(upgrade => upgrade.purchase());
    });

    type EnhancementRow = 1|2|3|4;
    const enhancementRows: Record<EnhancementRow, (keyof typeof enhancements)[]> = { 1: [], 2: [], 3: [], 4: [] }
    const enhancementLimits: Record<EnhancementRow, ComputedRef<number>> = {
        1: computed(() => 1 + (unref(timecube.upgrades.twist.bought) ? 1 : 0)),
        2: computed(() => 1 + (unref(enhancements.entrenchment.bought) ? 1 : 0)),
        3: computed(() => 1),
        4: computed(() => 1 + (unref(timecube.upgrades.twirl.bought) ? 1 : 0))
    };
    const enhancementCounts = Object.fromEntries(Object.entries(enhancementRows).map(([row, upgrades]) => {
        return [Number(row), computed(() => upgrades.map(upgrade => enhancements[upgrade]).filter(upgrade => unref(upgrade.bought)).length)];
    })) as Record<EnhancementRow, ComputedRef<number>>;
    const totalEnhancements = computed(() => Object.values(enhancementCounts).map(count => unref(count)).reduce((a,b) => a + b));
    const effectiveEnhancements = computed(() => Decimal.add(unref(totalEnhancements), 0)); // bottom time square
    const fibonacciEnhancements = computed(() => fibonacciNumber(unref(effectiveEnhancements)));
    const enhancementCost = computed(() => fibonacciNumber(unref(totalEnhancements)).round());

    type Enhancements = 'expansion' | 'construction' | 'dilation' | 'contraction' |
                        'formation' | 'development' | 'acceleration' | 'entrenchment' |
                        'extension' | 'configuration' | 'invention' | 'inversion' |
                        'tesselation' | 'amplification' | 'rotation' | 'entitlement'
    const enhancements = Object.fromEntries([
        createEnhancement('expansion', () => ({
            row: 1,
            visibility: acceleron.loops.acceleron.built,
            title: 'Entropic Expansion',
            description: 'Increase the second Entropic Loop effect based on purchased Entropic Enhancements',
            effect() { return Decimal.pow(unref(fibonacciEnhancements), 0.9).times(getUpgradeEffect(timecube.upgrades.tilt)) },
            effectDisplay: (effect) => `+${format(effect)} minutes`
        })),
        createEnhancement('construction', () => ({
            row: 1,
            visibility: acceleron.loops.acceleron.built,
            title: 'Entropic Construction',
            description: 'Entropic Loops build faster based on purchased Entropic Enhancements',
            effect() { return Decimal.pow10(Decimal.pow(unref(fibonacciEnhancements), 0.9)) }
        })),
        createEnhancement('dilation', () => ({
            row: 1,
            visibility: acceleron.loops.acceleron.built,
            title: 'Entropic Dilation',
            description: 'Increase time speed based on purchased Entropic Enhancements',
            effect() { return Decimal.pow(unref(fibonacciEnhancements), 0.8).plus(1) }
        })),
        createEnhancement('contraction', () => ({
            row: 1,
            visibility: timecube.upgrades.tetrate.bought,
            title: 'Entropic Contraction',
            description: 'Increase Acceleron gain based on number of purchased Entropic Enhancements',
            effect() { return Decimal.pow(unref(fibonacciEnhancements), 0.9) }
        })),
        createEnhancement('formation', () => ({
            row: 2,
            visibility: acceleron.loops.instantProd.built,
            title: 'Entropic Formation',
            description: 'Increase Foam gain based on best Accelerons',
            effect() { return Decimal.pow(fibonacciNumber(Decimal.max(unref(acceleron.bestAccelerons), 0).plus(1).log10().floor()), 2.5).plus(1) }
        })),
        createEnhancement('development', () => ({
            row: 2,
            visibility: acceleron.loops.instantProd.built,
            title: 'Entropic Development',
            description: 'Decrease Entropic Loop construction cost based on purchased Entropic Enhancements',
            effect() { return Decimal.pow(0.7, unref(fibonacciEnhancements)) }
        })),
        createEnhancement('acceleration', () => ({
            row: 2,
            visibility: acceleron.loops.instantProd.built,
            title: 'Entropic Acceleration',
            description: 'Increase the first Entropic Loop effect based on completed Entropic Loops',
            effect() { return Decimal.times(unref(acceleron.numBuiltLoops), 0.001)},
            effectDisplay: (effect) => `+${format(Decimal.times(effect, 100), 1)}% of your Acceleron reset gain`
        })),
        createEnhancement('entrenchment', () => ({
            row: 2,
            visibility: timecube.upgrades.tetrate.bought,
            title: 'Entropic Entrenchment',
            description: 'You may select an additional second row Entropic Enhancement'
        })),
        createEnhancement('extension', () => ({
            row: 3,
            visibility: acceleron.loops.timecube.built,
            title: 'Entropic Extension',
            description: 'Increase Infinitesimal Foam gain based on purchased Entropic Enhancements',
            effect() { return Decimal.pow(unref(fibonacciEnhancements), 2).plus(1) }
        })),
        createEnhancement('configuration', () => ({
            row: 3,
            visibility: acceleron.loops.timecube.built,
            title: 'Entropic Configuration',
            description: 'Increase Subspatial Foam gain based on purchased Entropic Enhancements',
            effect() { return Decimal.pow(unref(fibonacciEnhancements), 1.75).plus(1) }
        })),
        createEnhancement('invention', () => ({
            row: 3,
            visibility: acceleron.loops.timecube.built,
            title: 'Entropic Invention',
            description: 'Increase Subplanck Foam gain based on purchased Entropic Enhancements',
            effect() { return Decimal.pow(unref(fibonacciEnhancements), 1.5).plus(1) }
        })),
        createEnhancement('inversion', () => ({
            row: 3,
            visibility: timecube.upgrades.tetrate.bought,
            title: 'Entropic Inversion',
            description: 'Increase Acceleron gain based on Quantum Foam',
            effect() { return Decimal.max(unref(fome.amounts.quantum), 0).plus(1).log10().plus(1) }
        })),
        createEnhancement('tesselation', () => ({
            row: 4,
            visibility: acceleron.loops.tempFoam.built,
            title: 'Entropic Tesselation',
            description: 'Increase Time Cube gain based on best Accelerons',
            effect() { return Decimal.max(unref(acceleron.bestAccelerons), 0).plus(1).log10().plus(1) }
        })),
        createEnhancement('amplification', () => ({
            row: 4,
            visibility: acceleron.loops.tempFoam.built,
            title: 'Entropic Amplification',
            description: 'Skyrmions are cheaper based on best Time Cubes',
            effect() { return Decimal.pow(0.9, fibonacciNumber(Decimal.max(unref(timecube.bestTimecubes), 0).plus(1).log10().floor())) }
        })),
        createEnhancement('rotation', () => ({
            row: 4,
            visibility: acceleron.loops.tempFoam.built,
            title: 'Entropic Rotation',
            description: 'Increase Acceleron gain based on best Time Cubes',
            effect() { return Decimal.max(unref(timecube.bestTimecubes), 0).plus(1).log10().plus(1) }
        })),
        createEnhancement('entitlement', () => ({
            row: 4,
            visibility: timecube.upgrades.tetrate.bought,
            title: 'Entropic Entitlement',
            description: 'Each purchased Entropic Enhancement gives 0.1 free levels to each Foam Boost',
            effect() { return unref(effectiveEnhancements).times(0.1) },
            effectDisplay: (effect) => `${format(effect, 1)} free levels`
        })),
    ]) as Record<Enhancements, GenericUpgrade>;

    const respec = createClickable(() => ({
        canClick() { return unref(totalEnhancements) > 0 },
        onClick() {
            Object.values(enhancements).forEach(enhancement => enhancement.bought.value = false);
            entropy.value = unref(maxEntropy);
        },
        display: { description: 'Reset Enhancements' },
        style: {
            minHeight: '30px',
            width: '100px'
        }
    }))

    return {
        name,
        color,
        entropy,
        maxEntropy,
        enhancements,
        display: jsx(() => (
            <>
                <MainDisplayVue resource={acceleron.accelerons} color={color} effectDisplay={jsx(() => <>which are causing time to go {format(unref(acceleron.timeMult))}x faster<br />
                For every second in real time, {formatTime(unref(acceleron.timeMult))} passes</>)}/>
                <SpacerVue />
                Entropy: {formatWhole(unref(entropy))} / {formatWhole(unref(maxEntropy))}
                <br />
                Next Enhancement: {formatWhole(unref(enhancementCost))} {entropy.displayName}
                <SpacerVue />
                {render(respec)}
                <SpacerVue />
                <EnhancementsVue rows={Object.values(enhancementRows).map(row => row.map(upgrade => enhancements[upgrade]))}/>
            </>
        )),
        enhancementCounts,
        enhancementLimits,
        totalEnhancements
    }

    interface EnhancementOptions {
        row: EnhancementRow;
        visibility?: Computable<boolean>;
        title: CoercableComponent;
        description: CoercableComponent;
        effect?: Computable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        effectDisplay?: (effect: any) => CoercableComponent;
    }

    type Enhancement<T extends EnhancementOptions> = Replace<
        T, {
            visibility: GetComputableTypeWithDefault<T["visibility"], true>;
            effect?: GetComputableType<T["effect"]>;
        }
    >;

    type GenericEnhancement = Replace<
        Enhancement<EnhancementOptions>,
        {
            visibility: ProcessedComputable<boolean>;
            effect?: ProcessedComputable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
    >;

    function createEnhancement<T extends EnhancementOptions>(
        id: Enhancements,
        optionsFunc: OptionsFunc<T, {}, GenericEnhancement>
    ): [string, GenericUpgrade] {
        return [id, (() => {
            const enhancement = optionsFunc();

            processComputable(enhancement as T, "visibility");
            processComputable(enhancement as T, "effect");

            const displayFunc = enhancement.effectDisplay ?? ((effect: any) => `${format(effect)}x`)

            const upgrade: GenericUpgrade = createUpgrade(() => ({
                cost: enhancementCost,
                canAfford(this: GenericUpgrade) {
                    return (
                        this.resource != null &&
                        this.cost != null &&
                        Decimal.gte(unref(this.resource), unref(this.cost))
                    ) && (
                        unref(enhancementCounts[enhancement.row]) < unref(enhancementLimits[enhancement.row])
                    );
                },
                resource: entropy,
                visibility() { return showIf(unref(this.bought) || unref(enhancement.visibility as ProcessedComputable<boolean> ?? true))
                },
                display: enhancement.title,
                effect: enhancement.effect
            }));

            addTooltip(upgrade, {
                display: jsx(() => {
                    const Description = coerceComponent(enhancement.description, "div");
                    const EffectDisplay = enhancement.effect
                    ? coerceComponent(jsx(() => <>{displayFunc(unref(upgrade.effect))}</>))
                    : undefined;

                    return (
                        <>
                            <Description />
                            {EffectDisplay ? (
                                <div>
                                    Currently: <EffectDisplay />
                                </div>
                            ) : null }
                        </>
                    )
                })
            })

            enhancementRows[enhancement.row].push(id);

            return upgrade;
        })()];
    };
})

const sqrt5 = Decimal.sqrt(5);
const phi = sqrt5.plus(1).div(2);
function fibonacciNumber(index: DecimalSource) {
    return phi.pow(index).minus(Decimal.dOne.minus(phi).pow(index)).div(sqrt5);
}

export default layer;