import Column from "components/layout/Column.vue";
import Row from "components/layout/Row.vue";
import Spacer from "components/layout/Spacer.vue";
import { createClickable } from "features/clickables/clickable";
import { createResource } from "features/resources/resource";
import { BaseLayer, createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { noPersist, Persistent } from "game/persistence";
import { Requirement, createBooleanRequirement, createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { ComputedRef, MaybeRefOrGetter, computed, unref, watch } from "vue";
import fome, { FomeTypes } from "../../fome/fome";
import timecube from "../../timecube/timecube";
import { Sides } from "../../timecube/timesquares";
import EnhancementTotals from "./EnhancementTotals.vue";
import Enhancements from "./Enhancements.vue";
import Presets from "./Presets.vue";
import acceleron from "../acceleron";
import loops from "../loops/loops";
import settings from "game/settings";
import { createUpgrade, getUpgradeEffect, Upgrade } from "features/clickables/upgrade";
import { render, Renderable, VueFeatureOptions } from "util/vue";
import { MaybeGetter, processGetter } from "util/computed";
import { addTooltip } from "wrappers/tooltips/tooltip";
import { Visibility } from "features/feature";
import { createLazyProxy } from "util/proxies";
import { effectMixin } from "mixins/effects";

const id = "entropy";
const layer = createLayer(id, () => {
    const name = "Entropy";

    const entropy = createResource<DecimalSource>(0, { displayName: name, abyssal: true });
    
    const maxEntropyModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: 2,
            enabled: noPersist(timecube.upgrades.twice.bought),
            description: () => <>[{timecube.name}] Twice</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 1.5,
            enabled: noPersist(timecube.upgrades.triple.bought),
            description: () => <>[{timecube.name}] Triple</>
        }))
    ]);
    const maxEntropy: ComputedRef<DecimalSource> = computed(() => maxEntropyModifiers.apply(unref(loops.numBuiltLoops)));
    watch(maxEntropy, maxEntropy => {
        const boughtUpgrades = Object.values(enhancements).filter(enhancement => unref(enhancement.bought));
        for (const upgrade of boughtUpgrades) { upgrade.bought.value = false; }
        entropy.value = maxEntropy;
        for (const upgrade of boughtUpgrades) { upgrade.purchase(); }
    });

    const enhancementRows: Record<EnhancementRow, (keyof typeof enhancements)[]> = {
        1: ['expansion', 'construction', 'dilation', 'contraction'],
        2: ['formation', 'development', 'acceleration', 'entrenchment'],
        3: ['extension', 'configuration', 'invention', 'inversion'],
        4: ['tesselation', 'amplification', 'rotation', 'entitlement']
    };
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
    const effectiveEnhancements = computed(() => Decimal.add(unref(totalEnhancements), unref(timecube.getTimesquareEffect(Sides.BOTTOM))));
    const fibonacciEnhancements = computed(() => fibonacciNumber(unref(effectiveEnhancements)));
    const enhancementCost = computed(() => fibonacciNumber(unref(totalEnhancements)).round());

    const enhancements = (() => {
        const expansion = createEnhancement<Decimal>(() => ({
            row: 1,
            visibility: noPersist(loops.loops.acceleron.built),
            display: {
                title: 'Entropic Expansion',
                description: 'Increase the second Entropic Loop effect based on purchased Entropic Enhancements',
                effect: effect => `+${format(effect as Decimal)} minutes`
            },
            effect: () => unref(fibonacciEnhancements).pow(0.9).times(getUpgradeEffect(timecube.upgrades.tilt))
        }));
        const construction = createEnhancement<Decimal>(() => ({
            row: 1,
            visibility: loops.loops.acceleron.built,
            display: {
                title: 'Entropic Construction',
                description: 'Entropic Loops build faster based on purchased Entropic Enhancements'
            },
            effect: () => unref(fibonacciEnhancements).pow(0.9).pow10()
        }));
        const dilation = createEnhancement<Decimal>(() => ({
            row: 1,
            visibility: loops.loops.acceleron.built,
            display: {
                title: 'Entropic Dilation',
                description: 'Increase time speed based on purchased Entropic Enhancements'
            },
            effect: () => unref(fibonacciEnhancements).pow(0.8).plus(1)
        }));
        const contraction = createEnhancement<Decimal>(() => ({
            row: 1,
            visibility: noPersist(timecube.upgrades.tetrate.bought),
            display: {
                title: 'Entropic Contraction',
                description: 'Multiply Acceleron gain based on the number of purchased Entropic Enhancements'
            },
            effect: () => unref(fibonacciEnhancements).pow(0.9)
        }));
        const formation = createEnhancement<Decimal>(() => ({
            row: 2,
            visibility: loops.loops.instantProd.built,
            display: {
                title: 'Entropic Formation',
                description: 'Increase Foam gain based on best Accelerons'
            },
            effect: (): Decimal => fibonacciNumber(Decimal.clampMin(unref(acceleron.bestAccelerons), 0).plus(1).log10().floor()).pow(2.5).plus(1)
        }));
        const development = createEnhancement<Decimal>(() => ({
            row: 2,
            visibility: loops.loops.instantProd.built,
            display: {
                title: 'Entropic Development',
                description: 'Decrease Entropic Loop construction cost based on purchased Entropic Enhancements'
            },
            effect: () => unref(fibonacciEnhancements).pow_base(0.7)
        }));
        const acceleration = createEnhancement<Decimal>(() => ({
            row: 2,
            visibility: loops.loops.instantProd.built,
            display: {
                title: 'Entropic Acceleration',
                description: 'Increase the first Entropic Loop effect based on completed Entropic Loops',
                effect: effect => `+${format(Decimal.times(effect as Decimal, 100), 1)}% of your Acceleron reset gain`
            },
            effect: () => Decimal.times(unref(loops.numBuiltLoops), 0.001)
        }));
        const entrenchment = createEnhancement(() => ({
            row: 2,
            visibility: noPersist(timecube.upgrades.tetrate.bought),
            display: {
                title: 'Entropic Entrenchment',
                description: 'You may select an additional second row Entropic Enhancement'
            },
            ignoreRowLimit: true
        }));
        const extension = createEnhancement<Decimal>(() => ({
            row: 3,
            visibility: loops.loops.timecube.built,
            display: {
                title: 'Entropic Extension',
                description: 'Increase Infinitesimal Foam gain based on purchased Entropic Enhancements'
            },
            effect: () => unref(fibonacciEnhancements).pow(2).plus(1)
        }));
        const configuration = createEnhancement<Decimal>(() => ({
            row: 3,
            visibility: loops.loops.timecube.built,
            display: {
                title: 'Entropic Configuration',
                description: 'Increase Subspatial Foam gain based on purchased Entropic Enhancements'
            },
            effect: () => unref(fibonacciEnhancements).pow(1.75).plus(1)
        }));
        const invention = createEnhancement<Decimal>(() => ({
            row: 3,
            visibility: loops.loops.timecube.built,
            display: {
                title: 'Entropic Invention',
                description: 'Increase Subplanck Foam gain based on purchased Entropic Enhancements'
            },
            effect: () => unref(fibonacciEnhancements).pow(1.5).plus(1)
        }));
        const inversion = createEnhancement<Decimal>(() => ({
            row: 3,
            visibility: noPersist(timecube.upgrades.tetrate.bought),
            display: {
                title: 'Entropic Inversion',
                description: 'Multiply Acceleron gain based on Quantum Foam',
            },
            effect: () => Decimal.max(unref(fome[FomeTypes.quantum].amount), 0).plus(1).log10().plus(1)
        }));
        const tesselation = createEnhancement<Decimal>(() => ({
            row: 4,
            visibility: loops.loops.tempFome.built,
            display: {
                title: 'Entropic Tesselation',
                description: 'Increase Time Cube gain based on best Accelerons'
            },
            effect: (): Decimal => Decimal.max(unref(acceleron.bestAccelerons), 0).plus(1).log10().plus(1)
        }));
        const amplification = createEnhancement<Decimal>(() => ({
            row: 4,
            visibility: loops.loops.tempFome.built,
            display: {
                title: 'Entropic Amplification',
                description: 'Skyrmions are cheaper based on best Time Cubes',
                effect: effect => `/${format((effect as Decimal).reciprocate())}`
            },
            effect: () => fibonacciNumber(Decimal.max(unref(timecube.bestTimecubes), 0).plus(1).log10().floor()).pow_base(0.9)
        }));
        const rotation = createEnhancement<Decimal>(() => ({
            row: 4,
            visibility: loops.loops.tempFome.built,
            display: {
                title: 'Entropic Rotation',
                description: 'Multiply Acceleron gain based on best Time Cubes'
            },
            effect: () => Decimal.max(unref(timecube.bestTimecubes), 0).plus(1).log10().plus(1)
        }));
        const entitlement = createEnhancement<Decimal>(() => ({
            row: 4,
            visibility: noPersist(timecube.upgrades.tetrate.bought),
            display: {
                title: 'Entropic Entitlement',
                description: 'Each purchased Entropic Enhancement gives 0.1 free levels to each Foam Boost',
                effect: effect => `${format(effect as Decimal, 1)} free levels`
            },
            effect: () => unref(effectiveEnhancements).times(0.1)
        }));

        return {
            expansion, construction, dilation, contraction,
            formation, development, acceleration, entrenchment,
            extension, configuration, invention, inversion,
            tesselation, amplification, rotation, entitlement
        };
    })();

    type Preset = {
        id: number;
        name: string;
        purchased: string[];
    };
    const nextPresetID = computed(() => unref(presets).reduce((id, preset) => preset.id > id ? preset.id : id, -1) + 1);
    const presets = computed(() => (settings.layerData.entropy as { presets: Preset[] }).presets);

    const respec = createClickable(() => ({
        canClick() { return unref(totalEnhancements) > 0 },
        onClick() {
            for (const enhancement of Object.values(enhancements)) { enhancement.bought.value = false; }
            entropy.value = unref(maxEntropy);
        },
        display: { description: 'Reset Enhancements' },
        style: {
            minHeight: '30px',
            width: '100px'
        }
    }));

    const maxEntropyModal = createModifierModal(
        () => `${unref(entropy.singularName)} Modifiers`, 
        () => [{
            title: () => `Maximum ${unref(entropy.singularName)}`,
            modifier: maxEntropyModifiers,
            base: loops.numBuiltLoops,
            baseText: () => <>[{acceleron.name}] Entropic Loops</>
        }]
    );
    
    return {
        name,
        entropy,
        maxEntropy,
        enhancements,
        enhancementCounts,
        enhancementLimits,
        display: () => (
            <>
                <Spacer />
                Entropy: {formatWhole(unref(entropy))} / {formatWhole(unref(maxEntropy))}{render(maxEntropyModal)}
                <br />
                Next Enhancement: {formatWhole(unref(enhancementCost))} {unref(entropy.displayName)}
                <Spacer />
                {render(respec)}
                <Spacer />
                <Row>
                    <Presets
                        enhancements={(Object.keys(enhancementRows) as unknown as EnhancementRow[]).reduce((result, key) => {
                            result[key] = enhancementRows[key].map(upgrade => enhancements[upgrade]);
                            return result;
                        }, {} as Record<EnhancementRow, Upgrade[]>)}
                        presets={unref(presets)}
                        nextID={nextPresetID}
                    />
                    <Spacer width="17px" />
                    <Column><Enhancements rows={(Object.keys(enhancementRows) as unknown as EnhancementRow[]).reduce((result, key) => {
                        result[key] = enhancementRows[key].map(upgrade => enhancements[upgrade]);
                        return result;
                    }, {} as Record<EnhancementRow, Upgrade[]>)}/>
                    </Column>
                    <Spacer width="17px" />
                    <EnhancementTotals />
                </Row>
            </>
        )
    }

    function createEnhancement<U, T extends EnhancementOptions<U> = EnhancementOptions<U>>(
        optionsFunc: () => T
    ) {
        return createLazyProxy(() => {
            const options = optionsFunc?.() ?? ({} as T);
            const {
                row,
                display: _display,
                ignoreRowLimit,
                visibility: _visibility,
                effect
            } = options;
        
            const display = _display.effect ?? ((effect: U) => `${format(effect as DecimalSource)}×`);
            const visibility = processGetter(_visibility);
        
            const upgrade = createUpgrade(() => ({
                requirements: (() => {
                    const requirements = [
                        createCostRequirement(() => ({
                            cost: enhancementCost,
                            resource: noPersist(entropy)
                        }))
                    ] as Requirement[];
                    if (ignoreRowLimit !== true) {
                        requirements.push(createBooleanRequirement(() => unref(enhancementCounts[row]) < unref(enhancementLimits[row])));
                    }
                    return requirements;
                })(),
                visibility(): boolean|Visibility { return unref(upgrade.bought) || unref(visibility ?? true); },
                display: _display.title,
                ...effectMixin(effect)
            }));
            
            addTooltip(upgrade, () => ({
                display: <>
                    <div>{_display.description}</div>
                    {effect !== undefined ? (
                        <div>Currently: {display(unref(effect as U))}</div>
                    ) : undefined}
                </>
            }));
            return upgrade;
        });
    }
});

export type EnhancementRow = 1|2|3|4;

interface EnhancementOptions<T> extends VueFeatureOptions {
    row: EnhancementRow;
    visibility?: MaybeRefOrGetter<boolean>;
    display: {
        title: MaybeGetter<Renderable>;
        description: MaybeGetter<Renderable>;
        effect?: (effect: T) => Renderable
    };
    effect?: MaybeGetter<T>
    ignoreRowLimit?: boolean;
}

const sqrt5 = Decimal.sqrt(5);
const phi = sqrt5.plus(1).div(2);
function fibonacciNumber(index: DecimalSource) {
    const pow = phi.pow(index);
    const cos = Decimal.times(index, Math.PI).cos();
    return pow.minus(cos.dividedBy(pow)).dividedBy(sqrt5);
}

export default layer;