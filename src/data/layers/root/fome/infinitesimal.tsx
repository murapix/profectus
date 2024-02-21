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
import acceleron from "../acceleron/acceleron";
import timecube from "../timecube/timecube";
import entropy from "../acceleron/entropy";
import { createReformRequirement } from "./ReformRequirement";
import entangled from "../entangled/entangled";
import inflaton from "../inflaton/inflaton";
import { createModifierModal } from "util/util";

const id = "infinitesimal";
const layer = createLayer(id, function (this: BaseLayer) {
    const amount = createResource<DecimalSource>(0, "Infinitesimal Foam");

    const productionModifiers = createSequentialModifier(() => [
        ...fome.production,
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.height].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.height].amount), 0),
            description: jsx(() => (<>[{fome.name}] Infinitesimal Foam Height ({formatWhole(unref(upgrades[FomeDims.height].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.width].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.width].amount), 0),
            description: jsx(() => (<>[{fome.name}] Infinitesimal Foam Width ({formatWhole(unref(upgrades[FomeDims.width].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.depth].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.depth].amount), 0),
            description: jsx(() => (<>[{fome.name}] Infinitesimal Foam Depth ({formatWhole(unref(upgrades[FomeDims.depth].amount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: boosts[1].effect,
            enabled: () => Decimal.gt(unref(boosts[1].total), 0),
            description: jsx(() => (<>[{fome.name}] Infinitesimal Boost 1 ({formatWhole(unref(boosts[1].total))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.iota.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.iota.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Pion Upgrade ι ({formatWhole(unref(skyrmion.pion.upgrades.iota.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.spinor.upgrades.epsilon.effect,
            enabled: () => Decimal.gt(unref(skyrmion.spinor.upgrades.epsilon.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Spinor Upgrade ε ({formatWhole(unref(skyrmion.spinor.upgrades.epsilon.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.spinor.upgrades.iota.effect,
            enabled: () => Decimal.gt(unref(skyrmion.spinor.upgrades.iota.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Spinor Upgrade ι ({formatWhole(unref(skyrmion.spinor.upgrades.iota.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.extension.effect as Ref<DecimalSource>,
            enabled: noPersist(entropy.enhancements.extension.bought),
            description: jsx(() => (<>[{acceleron.name}] Entropic Extension</>))
        })),
        createExponentialModifier(() => ({
            exponent: upgrades.reform.effect,
            enabled: () => Decimal.gt(unref(upgrades.reform.amount), 1),
            description: jsx(() => (<>[{fome.name}] Infinitesimal Foam<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 0,
            enabled: () => Decimal.eq(unref(upgrades.reform.amount), 0),
            description: jsx(() => (<>[{fome.name}] Infinitesimal Foam<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>))
        })),
        ...fome.timelineProduction,
        createMultiplicativeModifier(() => ({
            multiplier: () => (unref(timecube.upgrades.toil.effect) as Record<FomeTypes, Decimal>)[FomeTypes.infinitesimal],
            enabled: () => unref(timecube.upgrades.toil.bought) && unref(timecube.timelines.inTimeline),
            description: jsx(() => (<>[{timecube.name}] Toil</>))
        }))
    ]);
    const production: ComputedRef<DecimalSource> = computed(() => productionModifiers.apply(unref(skyrmion.totalSkyrmions).times(0.01)));
    fome.on("preUpdate", (diff: number) => {
        if (!unref(fome.unlocked)) return;
        if (Decimal.eq(unref(upgrades.reform.amount), 0)) return;

        const delta = unref(acceleron.timeMult).times(diff);
        amount.value = delta.times(unref(production)).plus(amount.value);
    });

    const visibility = computed(() => unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || Decimal.gt(unref(upgrades.reform.amount), 0));
    const upgrades: FomeUpgrades = {
        [FomeDims.height]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(5).times(6),
                requiresPay: () => !unref(fome.achievements[FomeTypes.infinitesimal].earned)
            })),
            display: getDimDisplay(FomeTypes.infinitesimal, FomeDims.height),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.infinitesimal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.infinitesimal)
        }), effectDecorator) as FomeUpgrade,
        [FomeDims.width]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(7).times(10),
                requiresPay: () => !unref(fome.achievements[FomeTypes.infinitesimal].earned)
            })),
            display: getDimDisplay(FomeTypes.infinitesimal, FomeDims.width),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.infinitesimal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.infinitesimal)
        }), effectDecorator) as FomeUpgrade,
        [FomeDims.depth]: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: () => Decimal.pow(unref(feature.amount), 1.15).pow_base(9).times(25),
                requiresPay: () => !unref(fome.achievements[FomeTypes.infinitesimal].earned)
            })),
            display: getDimDisplay(FomeTypes.infinitesimal, FomeDims.depth),
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(fome.achievements[FomeTypes.infinitesimal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.infinitesimal)
        }), effectDecorator) as FomeUpgrade,
        condense: createUpgrade(feature => ({
            visibility: () => !unref(feature.bought) && (unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || unref(fome[FomeTypes.protoversal].upgrades.condense.bought)),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: 2e4
            })),
            display: { description: `Condense your ${amount.displayName}` },
            onPurchase() { fome.subspatial.upgrades.reform.amount.value = Decimal.dOne },
            classes: () => ({ auto: unref(fome.achievements.reform.earned) })
        })),
        reform: createRepeatable<RepeatableOptions & EffectFeatureOptions>(feature => ({
            visibility: noPersist(upgrades.condense.bought),
            requirements: [
                createCostRequirement(() => ({
                    resource: noPersist(amount),
                    cost: () => Decimal.minus(unref(feature.amount), 3).max(2).pow_base(unref(feature.amount)).plus(1).times(5).pow10().dividedBy(5),
                    requiresPay: () => !unref(fome.achievements.reform.earned)
                })),
                createReformRequirement(() => ({
                    fomeType: FomeTypes.protoversal,
                    cost: Formula.variable(feature.amount).plus(2)
                }))
            ],
            display: getReformDisplay(FomeTypes.infinitesimal),
            effect() { return Decimal.cbrt(unref(this.amount)) },
            classes: () => ({ auto: unref(fome.achievements.reform.earned) })
        }), effectDecorator) as FomeUpgrade
    }
    fome.on("update", () => {
        if (unref(fome.achievements.reform.earned)) {
            if (!unref(upgrades.condense.bought) && unref(upgrades.condense.canPurchase)) upgrades.condense.purchase();
            if (unref(upgrades.reform.canClick)) upgrades.reform.onClick();
        }
        if (unref(fome.achievements[FomeTypes.infinitesimal].earned)) {
            for (const dim of Object.values(FomeDims)) {
                if (unref(upgrades[dim].canClick)) upgrades[dim].onClick();
            }
        }
    })

    const boostBonus = computed(() => unref(fome.globalBoostBonus).plus(getFomeBoost(FomeTypes.quantum, 5)).plus(getFomeBoost(FomeTypes.subspatial, 3)));
    const boosts: Record<1|2|3|4|5, GenericBoost> & { index: Persistent<1|2|3|4|5> } = {
        index: persistent<1|2|3|4|5>(1),
        1: createBoost(feature => ({
            display: () => `Multiply the generation of Infinitesimal Foam by ${format(getFomeBoost(FomeTypes.infinitesimal, 1))}`,
            effect: () => new Decimal(unref(feature.total)).times(unref(skyrmion.pion.upgrades.lambda.effect))
                                                           .times(unref(skyrmion.pion.upgrades.kappa.effect))
                                                           .plus(1),
            bonus: boostBonus
        })),
        2: createBoost(feature => ({
            display: () => `Increase Pion and Spinor gain by ${format(Decimal.minus(getFomeBoost(FomeTypes.infinitesimal, 2), 1).times(100))}%`,
            effect: () => Decimal.times(unref(feature.total), 0.5).plus(1),
            bonus: boostBonus
        })),
        3: createBoost(feature => ({
            display: () => `Reduce Pion and Spinor Upgrade α costs to 1/${format(Decimal.times(getFomeBoost(FomeTypes.infinitesimal, 3), 100).reciprocate())}%`,
            effect: () => Decimal.pow(0.8, unref(feature.total)),
            bonus: boostBonus
        })),
        4: createBoost(feature => ({
            display: () => `Reduce Skyrmion costs to 1/${format(getFomeBoost(FomeTypes.infinitesimal, 4))}×`,
            effect: () => Decimal.times(unref(feature.total), 0.5).plus(1),
            bonus: boostBonus
        })),
        5: createBoost(feature => ({
            display: () => `Reduce Pion and Spinor Upgrade γ costs to 1/${format(Decimal.times(getFomeBoost(FomeTypes.infinitesimal, 5), 100).reciprocate())}%`,
            effect: () => Decimal.pow(0.8, unref(feature.total)),
            bonus: boostBonus
        }))
    }

    const modifierModal = createModifierModal(`${amount.displayName} Modifiers`, () => [
        {
            title: amount.displayName,
            modifier: productionModifiers,
            base: () => unref(skyrmion.totalSkyrmions).times(0.01),
            baseText: jsx(() => <>[{skyrmion.name}] Total {skyrmion.skyrmions.displayName}</>)
        }
    ]);

    return {
        amount,
        upgrades,
        boosts,
        production,
        modifierModal,
        display: "This page intentionally left blank"
    }
});

export default layer;