import { createResource } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import { createExponentialModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import fome, { FomeDims, FomeTypes, FomeUpgrade, FomeUpgrades, getDimDisplay, getReformDisplay, onDimRepeatable } from "./fome";
import { RepeatableOptions, createRepeatable } from "features/repeatable";
import { EffectFeatureOptions, effectDecorator } from "features/decorators/common";
import { createUpgrade } from "features/upgrades/upgrade";
import { createCostRequirement } from "game/requirements";
import { ComputedRef, computed, unref } from "vue";
import { Persistent, noPersist, persistent } from "game/persistence";
import { jsx } from "features/feature";
import { GenericBoost, createBoost, getFomeBoost } from "./boost";
import skyrmion from "../skyrmion/skyrmion";
import { format, formatWhole } from "util/break_eternity";
import acceleron from "../acceleron-old/acceleron";
import timecube from "../timecube-old/timecube";

const id = "protoversal";
const layer = createLayer(id, function (this: BaseLayer) {
    const amount = createResource<DecimalSource>(0, "Protoversal Foam");

    const productionModifiers = createSequentialModifier(() => [
        ...fome.production,
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.height].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.height].amount), 0),
            description: jsx(() => (<>[{fome.name}] Protoversal Foam Height ({formatWhole(unref(upgrades[FomeDims.height].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.width].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.width].amount), 0),
            description: jsx(() => (<>[{fome.name}] Protoversal Foam Width ({formatWhole(unref(upgrades[FomeDims.width].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.depth].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.depth].amount), 0),
            description: jsx(() => (<>[{fome.name}] Protoversal Foam Depth ({formatWhole(unref(upgrades[FomeDims.depth].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: boosts[1].effect,
            enabled: () => Decimal.gt(unref(boosts[1].total), 0),
            description: jsx(() => (<>[{fome.name}] Protoversal Boost 1 ({formatWhole(unref(boosts[1].total))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.delta.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.delta.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Pion Upgrade δ ({formatWhole(unref(skyrmion.pion.upgrades.delta.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.epsilon.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.epsilon.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Pion Upgrade ε ({formatWhole(unref(skyrmion.pion.upgrades.epsilon.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.theta.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.theta.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Pion Upgrade θ ({formatWhole(unref(skyrmion.pion.upgrades.theta.totalAmount))})</>))
        })),
        createExponentialModifier(() => ({
            exponent: upgrades.reform.effect,
            enabled: Decimal.gt(unref(upgrades.reform.amount), 1),
            description: jsx(() => (<>[{fome.name}] Protoversal Foam<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>))
        })),
        ...fome.timelineProduction,
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => (<>[{timecube.name}] Timecube Upgrade 45, Protoversal Foam bonus</>))
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
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(4).times(2),
                requiresPay: () => !unref(fome.achievements[FomeTypes.protoversal].earned),
                spendResources: false
            })),
            display: getDimDisplay(FomeTypes.protoversal, FomeDims.height),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.protoversal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.protoversal)
        }), effectDecorator) as FomeUpgrade,
        [FomeDims.width]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: () => Decimal.gt(unref(upgrades.reform.amount), 0),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(6).times(5),
                requiresPay: () => !unref(fome.achievements[FomeTypes.protoversal].earned),
                spendResources: false
            })),
            display: getDimDisplay(FomeTypes.protoversal, FomeDims.width),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.protoversal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.protoversal)
        }), effectDecorator) as FomeUpgrade,
        [FomeDims.depth]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: () => Decimal.gt(unref(upgrades.reform.amount), 0),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(8).times(20),
                requiresPay: () => !unref(fome.achievements[FomeTypes.protoversal].earned),
                spendResources: false
            })),
            display: getDimDisplay(FomeTypes.protoversal, FomeDims.depth),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.protoversal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.protoversal)
        }), effectDecorator) as FomeUpgrade,
        condense: createUpgrade(feature => ({
            visibility: () => !unref(feature.bought),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: 1e4
            })),
            display: { description: `Condense your ${amount.displayName}` },
            onPurchase() { fome.infinitesimal.upgrades.reform.amount.value = Decimal.dOne }
        })),
        reform: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: upgrades.condense.bought,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.minus(unref(feature.amount), 3).max(2).pow_base(unref(feature.amount)).plus(1).times(4).pow10(),
                requiresPay: () => !unref(fome.achievements.reform.earned),
                spendResource: false
            })),
            display: getReformDisplay(FomeTypes.protoversal),
            effect() { return Decimal.cbrt(unref(this.amount)) },
            classes: () => ({ auto: unref(fome.achievements.reform.earned) })
        }), effectDecorator) as FomeUpgrade
    }
    fome.on("update", () => {
        if (unref(fome.achievements.reform.earned)) {
            if (!unref(upgrades.condense.bought) && unref(upgrades.condense.canPurchase)) upgrades.condense.purchase();
            if (unref(upgrades.reform.canClick)) upgrades.reform.onClick();
        }
        if (unref(fome.achievements[FomeTypes.protoversal].earned)) {
            for (const dim of Object.values(FomeDims)) {
                if (unref(upgrades[dim].canClick)) upgrades[dim].onClick();
            }
        }
    })

    const boostBonus = computed(() => unref(fome.globalBoostBonus).plus(getFomeBoost(FomeTypes.quantum, 5)).plus(getFomeBoost(FomeTypes.subspatial, 3)));
    const fullBoostBonus = computed(() => unref(boostBonus).plus(getFomeBoost(FomeTypes.protoversal, 5)));
    const boosts: Record<1|2|3|4|5, GenericBoost> & { index: Persistent<1|2|3|4|5> } = {
        index: persistent<1|2|3|4|5>(1),
        1: createBoost(feature => ({
            display: () => `Multiply the generation of Protoversal Foam by ${format(getFomeBoost(FomeTypes.protoversal, 1))}`,
            effect: () => new Decimal(unref(feature.total)).times(unref(skyrmion.pion.upgrades.kappa.effect))
                                                           .times(unref(skyrmion.spinor.upgrades.delta.effect))
                                                           .plus(1),
            bonus: fullBoostBonus
        })),
        2: createBoost(feature => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.protoversal, 2))} bonus Pion and Spinor Upgrade α levels`,
            effect: () => new Decimal(unref(feature.total)),
            bonus: fullBoostBonus
        })),
        3: createBoost(feature => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.protoversal, 3))} bonus Pion and Spinor Upgrade β levels`,
            effect: () => Decimal.sqrt(unref(feature.total)),
            bonus: fullBoostBonus
        })),
        4: createBoost(feature => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.protoversal, 4))} bonus Pion and Spinor Upgrade γ levels`,
            effect: () => new Decimal(unref(feature.total)),
            bonus: fullBoostBonus
        })),
        5: createBoost(feature => ({
            display: () => `Add ${format(getFomeBoost(FomeTypes.protoversal, 5))} levels to all above boosts`,
            effect: () => Decimal.times(unref(feature.total), 0.1),
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