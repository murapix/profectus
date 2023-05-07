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
import entropy from "../acceleron-old/entropy";
import { createReformRequirement } from "./ReformRequirement";

const id = "subspatial";
const layer = createLayer(id, function (this: BaseLayer) {
    const amount = createResource<DecimalSource>(0, "Subspatial Foam");

    const productionModifiers = createSequentialModifier(() => [
        ...fome.production,
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.height].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.height].amount), 0),
            description: jsx(() => (<>[{fome.name}] Subspatial Foam Height ({formatWhole(unref(upgrades[FomeDims.height].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.width].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.width].amount), 0),
            description: jsx(() => (<>[{fome.name}] Subspatial Foam Width ({formatWhole(unref(upgrades[FomeDims.width].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.depth].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.depth].amount), 0),
            description: jsx(() => (<>[{fome.name}] Subspatial Foam Depth ({formatWhole(unref(upgrades[FomeDims.depth].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: boosts[1].effect,
            enabled: () => Decimal.gt(unref(boosts[1].total), 0),
            description: jsx(() => (<>[{fome.name}] Subspatial Boost 1 ({formatWhole(unref(boosts[1].total))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.zeta.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.zeta.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Pion Upgrade ζ ({formatWhole(unref(skyrmion.pion.upgrades.zeta.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.spinor.upgrades.theta.effect,
            enabled: () => Decimal.gt(unref(skyrmion.spinor.upgrades.theta.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Spinor Upgrade θ ({formatWhole(unref(skyrmion.spinor.upgrades.theta.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => (<>[{acceleron.name}] Acceleron upgrade 23</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.configuration.effect as Ref<DecimalSource>,
            enabled: entropy.enhancements.configuration.bought,
            description: jsx(() => (<>[{acceleron.name}] Entropic Configuration</>))
        })),
        createExponentialModifier(() => ({
            exponent: upgrades.reform.effect,
            enabled: Decimal.gt(unref(upgrades.reform.amount), 1),
            description: jsx(() => (<>[{fome.name}] Subspatial Foam<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>))
        })),
        ...fome.timelineProduction,
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => (<>[{timecube.name}] Timecube Upgrade 45, Subspatial Foam bonus</>))
        }))
    ]);
    const production: ComputedRef<DecimalSource> = computed(() => productionModifiers.apply(unref(skyrmion.totalSkyrmions).times(0.01)));
    fome.on("preUpdate", (diff: number) => {
        if (!unref(fome.unlocked)) return;
        if (Decimal.eq(unref(upgrades.reform.amount), 0)) return;

        const delta = unref(acceleron.timeMult).times(diff);
        amount.value = delta.times(unref(production)).plus(amount.value);
    });

    const upgrades: FomeUpgrades = {
        [FomeDims.height]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: () => Decimal.gt(unref(upgrades.reform.amount), 0),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(6).times(10),
                requiresPay: () => !unref(fome.achievements[FomeTypes.subspatial].earned)
            })),
            display: getDimDisplay(FomeTypes.subspatial, FomeDims.height),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.subspatial].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subspatial)
        }), effectDecorator) as FomeUpgrade,
        [FomeDims.width]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: () => Decimal.gt(unref(upgrades.reform.amount), 0),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(8).times(18),
                requiresPay: () => !unref(fome.achievements[FomeTypes.subspatial].earned)
            })),
            display: getDimDisplay(FomeTypes.subspatial, FomeDims.width),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.subspatial].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subspatial)
        }), effectDecorator) as FomeUpgrade,
        [FomeDims.depth]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: () => Decimal.gt(unref(upgrades.reform.amount), 0),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(10).times(60),
                requiresPay: () => !unref(fome.achievements[FomeTypes.subspatial].earned)
            })),
            display: getDimDisplay(FomeTypes.subspatial, FomeDims.depth),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.subspatial].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subspatial)
        }), effectDecorator) as FomeUpgrade,
        condense: createUpgrade(feature => ({
            visibility: () => !unref(feature.bought) && unref(fome[FomeTypes.infinitesimal].upgrades.condense.bought),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: 4e5
            })),
            display: { description: `Condense your ${amount.displayName}` },
            onPurchase() { fome.subplanck.upgrades.reform.amount.value = Decimal.dOne }
        })),
        reform: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: upgrades.condense.bought,
            requirements: [
                createCostRequirement(() => ({
                    resource: noPersist(amount),
                    cost: () => Decimal.minus(unref(feature.amount), 3).max(2).pow_base(unref(feature.amount)).plus(1).times(6).pow10().dividedBy(2.5),
                    requiresPay: () => !unref(fome.achievements.reform.earned),
                    spendResource: false
                })),
                createReformRequirement(() => ({
                    fomeType: FomeTypes.infinitesimal,
                    cost: Formula.variable(feature.amount).plus(1)
                }))
            ],
            display: getReformDisplay(FomeTypes.subspatial),
            effect() { return Decimal.cbrt(unref(this.amount)) },
            classes: () => ({ auto: unref(fome.achievements.reform.earned) })
        }), effectDecorator) as FomeUpgrade
    }
    fome.on("update", () => {
        if (unref(fome.achievements.reform.earned)) {
            if (!unref(upgrades.condense.bought) && unref(upgrades.condense.canPurchase)) upgrades.condense.purchase();
            if (unref(upgrades.reform.canClick)) upgrades.reform.onClick();
        }
        if (unref(fome.achievements[FomeTypes.subspatial].earned)) {
            for (const dim of Object.values(FomeDims)) {
                if (unref(upgrades[dim].canClick)) upgrades[dim].onClick();
            }
        }
    })

    const boostBonus = computed(() => unref(fome.globalBoostBonus).plus(getFomeBoost(FomeTypes.quantum, 5)));
    const fullBoostBonus = computed(() => unref(boostBonus).plus(getFomeBoost(FomeTypes.subspatial, 3)));
    const boosts: Record<1|2|3|4|5, GenericBoost> & { index: Persistent<1|2|3|4|5> } = {
        index: persistent<1|2|3|4|5>(1),
        1: createBoost(feature => ({
            display: () => `Multiply the generation of Subspatial Foam by ${format(getFomeBoost(FomeTypes.subspatial, 1))}`,
            effect: () => new Decimal(unref(feature.total)).times(unref(skyrmion.spinor.upgrades.kappa.effect)),
            bonus: fullBoostBonus
        })),
        2: createBoost(feature => ({
            display: () => `The Pion and Spinor nerfs act as if you had ${format(getFomeBoost(FomeTypes.subspatial, 2))} fewer upgrades`,
            effect: () => new Decimal(unref(feature.total)),
            bonus: fullBoostBonus
        })),
        3: createBoost(feature => ({
            display: () => `Add ${format(getFomeBoost(FomeTypes.subspatial, 3))} levels to all above boosts`,
            effect: () => Decimal.times(unref(feature.total), 0.1),
            bonus: boostBonus
        })),
        4: createBoost(feature => ({
            display: () => `Increase effective Skyrmion count by ${format(getFomeBoost(FomeTypes.subspatial, 4))}`,
            effect: () => new Decimal(unref(feature.total)),
            bonus: boostBonus
        })),
        5: createBoost(feature => ({
            display: () => `Pion and Spinor upgrades cost as if you had ${format(getFomeBoost(FomeTypes.subspatial, 5))} fewer`,
            effect: () => Decimal.times(unref(feature.total), 0.25),
            bonus: boostBonus
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