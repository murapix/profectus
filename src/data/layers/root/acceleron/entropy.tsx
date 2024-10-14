import Column from "components/layout/Column.vue";
import Row from "components/layout/Row.vue";
import Spacer from "components/layout/Spacer.vue";
import { createClickable } from "features/clickables/clickable";
import { effectDecorator } from "features/decorators/common";
import { CoercableComponent, OptionsFunc, Replace, jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { EffectUpgrade, EffectUpgradeOptions, GenericUpgrade, createUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { noPersist } from "game/persistence";
import { Requirement, createBooleanRequirement, createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall, formatWhole } from "util/break_eternity";
import { Computable, GetComputableType, GetComputableTypeWithDefault, ProcessedComputable, processComputable } from "util/computed";
import { createModifierModal } from "util/util";
import { coerceComponent, render } from "util/vue";
import { ComputedRef, computed, unref, watch } from "vue";
import fome, { FomeTypes } from "../fome/fome";
import timecube from "../timecube/timecube";
import { Sides } from "../timecube/timesquares";
import EnhancementTotals from "./EnhancementTotals.vue";
import Enhancements from "./Enhancements.vue";
import Presets from "./Presets.vue";
import acceleron from "./acceleron";
import loops from "./loops";
import settings from "game/settings";

const id = "entropy";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Entropy";

    const entropy = createResource<DecimalSource>(0, { displayName: name, abyssal: true });
    
    const maxEntropyModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: 2,
            enabled: noPersist(timecube.upgrades.twice.bought),
            description: jsx(() => <>[{timecube.name}] Twice</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 1.5,
            enabled: noPersist(timecube.upgrades.triple.bought),
            description: jsx(() => <>[{timecube.name}] Triple</>)
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
            visibility: loops.loops.acceleron.built,
            display: {
                title: 'Entropic Expansion',
                description: 'Increase the second Entropic Loop effect based on purchased Entropic Enhancements',
                effect: effect => `+${format(effect)} minutes`
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
                description: 'Multiply Acceleron gain based on the number of purchased Entropic Enhancements',
                effect: effect => `${format(effect)}×`
            },
            effect: () => unref(fibonacciEnhancements).pow(0.9)
        }));
        const formation: EffectUpgrade<Decimal> = createEnhancement<Decimal>(() => ({
            row: 2,
            visibility: loops.loops.instantProd.built,
            display: {
                title: 'Entropic Formation',
                description: 'Increase Foam gain based on best Accelerons'
            },
            effect: () => fibonacciNumber(Decimal.clampMin(unref(acceleron.bestAccelerons), 0).plus(1).log10().floor()).pow(2.5).plus(1)
        }));
        const development = createEnhancement<Decimal>(() => ({
            row: 2,
            visibility: loops.loops.instantProd.built,
            display: {
                title: 'Entropic Development',
                description: 'Decrease Entropic Loop construction cost based on purchased Entropic Enhancements',
                effect: effect => `${formatSmall(effect)}×`
            },
            effect: () => unref(fibonacciEnhancements).pow_base(0.7)
        }));
        const acceleration = createEnhancement<Decimal>(() => ({
            row: 2,
            visibility: loops.loops.instantProd.built,
            display: {
                title: 'Entropic Acceleration',
                description: 'Increase the first Entropic Loop effect based on completed Entropic Loops',
                effect: effect => `+${format(Decimal.times(effect, 100), 1)}% of your Acceleron reset gain`
            },
            effect: () => Decimal.times(unref(loops.numBuiltLoops), 0.001)
        }));
        const entrenchment = createEnhancement<Decimal>(() => ({
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
                effect: effect => `${format(effect)}×`
            },
            effect: () => Decimal.max(unref(fome[FomeTypes.quantum].amount), 0).plus(1).log10().plus(1)
        }));
        const tesselation: EffectUpgrade<Decimal> = createEnhancement<Decimal>(() => ({
            row: 4,
            visibility: loops.loops.tempFome.built,
            display: {
                title: 'Entropic Tesselation',
                description: 'Increase Time Cube gain based on best Accelerons'
            },
            effect: () => Decimal.max(unref(acceleron.bestAccelerons), 0).plus(1).log10().plus(1)
        }));
        const amplification = createEnhancement<Decimal>(() => ({
            row: 4,
            visibility: loops.loops.tempFome.built,
            display: {
                title: 'Entropic Amplification',
                description: 'Skyrmions are cheaper based on best Time Cubes',
                effect: effect => `/${format(effect.reciprocate())}`
            },
            effect: () => fibonacciNumber(Decimal.max(unref(timecube.bestTimecubes), 0).plus(1).log10().floor()).pow_base(0.9)
        }));
        const rotation = createEnhancement<Decimal>(() => ({
            row: 4,
            visibility: loops.loops.tempFome.built,
            display: {
                title: 'Entropic Rotation',
                description: 'Multiply Acceleron gain based on best Time Cubes',
                effect: effect => `${format(effect)}×`
            },
            effect: () => Decimal.max(unref(timecube.bestTimecubes), 0).plus(1).log10().plus(1)
        }));
        const entitlement = createEnhancement<Decimal>(() => ({
            row: 4,
            visibility: noPersist(timecube.upgrades.tetrate.bought),
            display: {
                title: 'Entropic Entitlement',
                description: 'Each purchased Entropic Enhancement gives 0.1 free levels to each Foam Boost',
                effect: effect => `${format(effect, 1)} free levels`
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
            baseText: jsx(() => <>[{acceleron.name}] Entropic Loops</>)
        }]
    );
    
    return {
        name,
        entropy,
        maxEntropy,
        enhancements,
        enhancementCounts,
        enhancementLimits,
        display: jsx(() => (
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
                        }, {} as Record<EnhancementRow, GenericUpgrade[]>)}
                        presets={unref(presets)}
                        nextID={nextPresetID}
                    />
                    <Spacer width="17px" />
                    <Column><Enhancements rows={(Object.keys(enhancementRows) as unknown as EnhancementRow[]).reduce((result, key) => {
                        result[key] = enhancementRows[key].map(upgrade => enhancements[upgrade]);
                        return result;
                    }, {} as Record<EnhancementRow, GenericUpgrade[]>)}/>
                    </Column>
                    <Spacer width="17px" />
                    <EnhancementTotals />
                </Row>
            </>
        ))
    }

    function createEnhancement<T = unknown, U extends EnhancementOptions<T> = EnhancementOptions<T>>(
        optionsFunc: OptionsFunc<U, object, GenericEnhancement<T>>
    ): EffectUpgrade<T> {
        const enhancement = optionsFunc.call({}, {});
    
        processComputable(enhancement as U, "visibility");
        processComputable(enhancement as U, "effect");
    
        const displayFunc = enhancement.display.effect ?? ((effect: T) => `${format(effect as DecimalSource)}×`);
    
        const upgrade = createUpgrade<EffectUpgradeOptions<T>>(() => ({
            requirements: (() => {
                const requirements = [
                    createCostRequirement(() => ({
                        cost: enhancementCost,
                        resource: noPersist(entropy)
                    }))
                ] as Requirement[];
                if (enhancement.ignoreRowLimit !== true) {
                    requirements.push(createBooleanRequirement(() => unref(enhancementCounts[enhancement.row]) < unref(enhancementLimits[enhancement.row])));
                }
                return requirements;
            })(),
            visibility() { return unref(this.bought) || unref(enhancement.visibility as ProcessedComputable<boolean> ?? true); },
            display: enhancement.display.title,
            effect: enhancement.effect!
        }), effectDecorator) as EffectUpgrade<T>;
    
        addTooltip(upgrade, {
            display: jsx(() => {
                const Description = coerceComponent(enhancement.display.description, "div");
                const EffectDisplay = enhancement.effect != undefined
                    ? coerceComponent(jsx(() => <>{displayFunc(unref(upgrade.effect))}</>))
                    : undefined;
                
                return (<>
                    <Description />
                    {EffectDisplay ? (
                        <div>Currently: <EffectDisplay /></div>
                    ) : undefined}
                </>)
            })
        });
        return upgrade;
    }
});

export type EnhancementRow = 1|2|3|4;

export interface EnhancementOptions<T> {
    row: EnhancementRow;
    visibility?: Computable<boolean>;
    display: {
        title: CoercableComponent;
        description: CoercableComponent;
        effect?: (effect: T) => CoercableComponent;
    };
    effect?: Computable<T>,
    ignoreRowLimit?: boolean;
}

export type Enhancement<T extends EnhancementOptions<U>, U = unknown> = Replace<
    T, {
        visibility: GetComputableTypeWithDefault<T["visibility"], true>;
        effect: GetComputableType<T["effect"]>;
    }
>;

export type GenericEnhancement<T> = Replace<
    Enhancement<EnhancementOptions<T>, T>,
    {
        visibility: ProcessedComputable<boolean>;
        effect: ProcessedComputable<T>;
    }
>;

const sqrt5 = Decimal.sqrt(5);
const phi = sqrt5.plus(1).div(2);
function fibonacciNumber(index: DecimalSource) {
    const pow = phi.pow(index);
    const cos = Decimal.times(index, Math.PI).cos();
    return pow.minus(cos.dividedBy(pow)).dividedBy(sqrt5);
}

export default layer;