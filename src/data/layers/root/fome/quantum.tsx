import { createResource } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import { createExponentialModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import fome, { FomeDims, FomeTypes, FomeUpgrade, FomeUpgrades, getDimDisplay, getReformDisplay, onDimRepeatable } from "./fome";
import { RepeatableOptions, createRepeatable } from "features/repeatable";
import { EffectFeatureOptions, effectDecorator } from "features/decorators/common";
import { createUpgrade } from "features/upgrades/upgrade";
import { createCostRequirement } from "game/requirements";
import { ComputedRef, Ref, computed, unref } from "vue";
import { Persistent, noPersist, persistent } from "game/persistence";
import { jsx } from "features/feature";
import { GenericBoost, createBoost, getFomeBoost } from "./boost";
import skyrmion from "../skyrmion/skyrmion";
import Formula from "game/formulas/formulas";
import { format, formatWhole } from "util/break_eternity";
import acceleron from "../acceleron-old/acceleron";
import timecube from "../timecube-old/timecube";
import { createReformRequirement } from "./ReformRequirement";

const id = "subplanck";
const layer = createLayer(id, function (this: BaseLayer) {
    const amount = createResource<DecimalSource>(0, "Quantum Foam");

    const productionModifiers = createSequentialModifier(() => [
        ...fome.production,
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.height].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.height].amount), 0),
            description: jsx(() => (<>[{fome.name}] Quantum Foam Height ({formatWhole(unref(upgrades[FomeDims.height].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.width].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.width].amount), 0),
            description: jsx(() => (<>[{fome.name}] Quantum Foam Width ({formatWhole(unref(upgrades[FomeDims.width].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.depth].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.depth].amount), 0),
            description: jsx(() => (<>[{fome.name}] Quantum Foam Depth ({formatWhole(unref(upgrades[FomeDims.depth].amount))})</>))
        })),
        createExponentialModifier(() => ({
            exponent: upgrades.reform.effect,
            enabled: Decimal.gt(unref(upgrades.reform.amount), 1),
            description: jsx(() => (<>[{fome.name}] Quantum Foam<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>))
        })),
        ...fome.timelineProduction,
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => (<>[{timecube.name}] Timecube Upgrade 45, Subplanck Foam bonus</>))
        }))
    ]);
    const production: ComputedRef<DecimalSource> = computed(() => productionModifiers.apply(unref(skyrmion.totalSkyrmions).times(0.01)));
    fome.on("preUpdate", (diff: number) => {
        if (!unref(fome.unlocked)) return;

        const delta = unref(acceleron.timeMult).times(diff);
        amount.value = delta.times(unref(production)).plus(amount.value);
    });

    const upgrades: FomeUpgrades = {
        [FomeDims.height]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: () => Decimal.gt(unref(upgrades.reform.amount), 0),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(8).times(20),
                requiresPay: () => !unref(fome.achievements[FomeTypes.subplanck].earned),
                spendResources: false
            })),
            display: getDimDisplay(FomeTypes.quantum, FomeDims.height),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.subplanck].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subplanck)
        }), effectDecorator) as FomeUpgrade,
        [FomeDims.width]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: () => Decimal.gt(unref(upgrades.reform.amount), 0),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(10).times(30),
                requiresPay: () => !unref(fome.achievements[FomeTypes.subplanck].earned),
                spendResources: false
            })),
            display: getDimDisplay(FomeTypes.quantum, FomeDims.width),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.subplanck].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subplanck)
        }), effectDecorator) as FomeUpgrade,
        [FomeDims.depth]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: () => Decimal.gt(unref(upgrades.reform.amount), 0),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(12).times(100),
                requiresPay: () => !unref(fome.achievements[FomeTypes.subplanck].earned),
                spendResources: false
            })),
            display: getDimDisplay(FomeTypes.quantum, FomeDims.depth),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.subplanck].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subplanck)
        }), effectDecorator) as FomeUpgrade,
        condense: createUpgrade(feature => ({
            visibility: () => !unref(feature.bought) && unref(fome[FomeTypes.subplanck].upgrades.condense.bought),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: 1e5
            })),
            display: { description: `Condense your ${amount.displayName}` }
        })),
        reform: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: upgrades.condense.bought,
            requirements: [
                createCostRequirement(() => ({
                    resource: noPersist(amount),
                    cost: () => Decimal.minus(unref(feature.amount), 3).max(2).pow_base(unref(feature.amount)).plus(1).times(4).pow10(),
                    requiresPay: () => !unref(fome.achievements.reform.earned),
                    spendResource: false
                })),
                createReformRequirement(() => ({
                    fomeType: FomeTypes.subplanck,
                    cost: Formula.variable(feature.amount).plus(1)
                }))
            ],
            display: getReformDisplay(FomeTypes.quantum),
            effect() { return Decimal.cbrt(unref(this.amount)) },
            classes: () => ({ auto: unref(fome.achievements.reform.earned) })
        }), effectDecorator) as FomeUpgrade
    }
    fome.on("update", () => {
        if (unref(fome.achievements.reform.earned)) {
            if (!unref(upgrades.condense.bought) && unref(upgrades.condense.canPurchase)) upgrades.condense.purchase();
            if (unref(upgrades.reform.canClick)) upgrades.reform.onClick();
        }
        if (unref(fome.achievements[FomeTypes.subplanck].earned)) {
            for (const dim of Object.values(FomeDims)) {
                if (unref(upgrades[dim].canClick)) upgrades[dim].onClick();
            }
        }
    })

    const boostBonus = computed(() => unref(fome.globalBoostBonus).plus(getFomeBoost(FomeTypes.quantum, 5)));
    const boosts: Record<1|2|3|4|5, GenericBoost> & { index: Persistent<1|2|3|4|5> } = {
        index: persistent<1|2|3|4|5>(1),
        1: createBoost(feature => ({
            display: () => `Multiply the generation of all Foam types by ${format(getFomeBoost(FomeTypes.quantum, 1))}`,
            effect: () => new Decimal(unref(feature.total)),
            bonus: boostBonus
        })),
        2: createBoost(feature => ({
            display: () => `Reduce the Pion and Spinor cost nerf exponent by ${format(Decimal.sub(1, getFomeBoost(FomeTypes.quantum, 2)).times(100))}%`,
            effect: () => Decimal.pow(0.975, Decimal.gt(unref(feature.total), 16) ? Decimal.ln(unref(feature.total)).times(Decimal.ln(2).recip().times(4)) : unref(feature.total)),
            bonus: boostBonus
        })),
        3: createBoost(feature => ({
            display: () => `Multiply the generation of all Foam types again by ${format(getFomeBoost(FomeTypes.quantum, 3))}x`,
            effect: () => Decimal.times(Decimal.gt(unref(feature.total), 16) ? Decimal.sqrt(unref(feature.total)).times(4) : unref(feature.total), getFomeBoost(FomeTypes.quantum, 1)).dividedBy(10).plus(1),
            bonus: boostBonus
        })),
        4: createBoost(feature => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.quantum, 4))} bonus Pion and Spinor Upgrade θ, ι, and κ levels`,
            effect: () => Decimal.times(unref(feature.total), 0.25),
            bonus: boostBonus
        })),
        5: createBoost(feature => ({
            display: () => `Add ${format(getFomeBoost(FomeTypes.quantum, 5))} bonus levels to all above boosts`,
            effect: () => Decimal.times(unref(feature.total), 0.1),
            bonus: fome.globalBoostBonus
        }))
    }

    return {
        amount,
        upgrades,
        boosts,
        production,
        display: "This page intentionally left blank"
    }
});

export default layer;