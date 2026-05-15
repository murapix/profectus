import { createResource } from "features/resources/resource";
import Formula from "game/formulas/formulas";
import { BaseLayer, createLayer } from "game/layers";
import { createExponentialModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { Persistent, noPersist, persistent } from "game/persistence";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { ComputedRef, Ref, computed, unref } from "vue";
import acceleron from "../acceleron/acceleron";
import entropy from "../acceleron/enhancements/entropy";
import entangled from "../entangled/entangled";
import inflaton from "../inflaton/inflaton";
import skyrmion from "../skyrmion/skyrmion";
import timecube from "../timecube/timecube";
import { createReformRequirement, ReformRequirementOptions } from "./ReformRequirement";
import { Boost, createBoost, getFomeBoost } from "./boost";
import fome, { FomeDims, FomeTypes, getDimDisplay, getReformDisplay, onDimRepeatable } from "./fome";
import loops from "../acceleron/loops/loops";
import { createRepeatable } from "features/clickables/repeatable";
import { createUpgrade } from "features/clickables/upgrade";

const id = "infinitesimal";
const layer = createLayer(id, () => {
    const amount = createResource<DecimalSource>(0, { displayName: "Infinitesimal Foam", abyssal: true });

    const productionModifiers = createSequentialModifier(() => [
        ...fome.production,
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.height].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.height].amount), 0),
            description: () => (<>[{fome.name}] {unref(amount.singularName)} Height ({formatWhole(unref(upgrades[FomeDims.height].amount))})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.width].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.width].amount), 0),
            description: () => (<>[{fome.name}] {unref(amount.singularName)} Width ({formatWhole(unref(upgrades[FomeDims.width].amount))})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.depth].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.depth].amount), 0),
            description: () => (<>[{fome.name}] {unref(amount.singularName)} Depth ({formatWhole(unref(upgrades[FomeDims.depth].amount))})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: boosts[1].effect,
            enabled: () => Decimal.gt(unref(boosts[1].total), 0),
            description: () => (<>[{fome.name}] Infinitesimal Boost 1 ({formatWhole(unref(boosts[1].total))})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.iota.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.iota.totalAmount), 0),
            description: () => (<>[{skyrmion.name}] {unref(skyrmion.pion.pions.singularName)} Upgrade ι ({formatWhole(unref(skyrmion.pion.upgrades.iota.totalAmount))})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.spinor.upgrades.epsilon.effect,
            enabled: () => Decimal.gt(unref(skyrmion.spinor.upgrades.epsilon.totalAmount), 0),
            description: () => (<>[{skyrmion.name}] {unref(skyrmion.spinor.spinors.singularName)} Upgrade ε ({formatWhole(unref(skyrmion.spinor.upgrades.epsilon.totalAmount))})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.spinor.upgrades.iota.effect,
            enabled: () => Decimal.gt(unref(skyrmion.spinor.upgrades.iota.totalAmount), 0),
            description: () => (<>[{skyrmion.name}] {unref(skyrmion.spinor.spinors.singularName)} Upgrade ι ({formatWhole(unref(skyrmion.spinor.upgrades.iota.totalAmount))})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.extension.effect!,
            enabled: noPersist(entropy.enhancements.extension.bought),
            description: () => (<>[{acceleron.name}] Entropic Extension</>)
        })),
        createExponentialModifier(() => ({
            exponent: upgrades.reform.effect,
            enabled: () => Decimal.gt(unref(upgrades.reform.amount), 1),
            description: () => (<>[{fome.name}] {unref(amount.singularName)}<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 0,
            enabled: () => Decimal.eq(unref(upgrades.reform.amount), 0),
            description: () => (<>[{fome.name}] {unref(amount.singularName)}<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>)
        })),
        ...fome.timelineProduction,
        createMultiplicativeModifier(() => ({
            multiplier: () => (unref(timecube.upgrades.toil.effect) as Record<FomeTypes, Decimal>)[FomeTypes.infinitesimal],
            enabled: () => unref(timecube.upgrades.toil.bought) && unref(timecube.timelines.inTimeline),
            description: () => (<>[{timecube.name}] Toil</>)
        }))
    ]);
    const production: ComputedRef<DecimalSource> = computed(() => productionModifiers.apply(unref(skyrmion.totalSkyrmions).times(0.01)));
    fome.on("preUpdate", (diff: number) => {
        if (!unref(fome.unlocked)) return;
        if (Decimal.eq(unref(upgrades.reform.amount), 0)) return;
        if (unref(loops.isBuilding)) return;

        const delta = unref(acceleron.timeMult).times(diff);
        amount.value = delta.times(unref(production)).plus(amount.value);
    });

    const visibility = (): boolean => unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || Decimal.gt(unref(upgrades.reform.amount), 0);
    const upgrades = {
        [FomeDims.height]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.height].amount), 1.15).pow_base(5).times(6),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.infinitesimal].earned)
            })),
            display: getDimDisplay(FomeTypes.infinitesimal, FomeDims.height),
            effect() { return Decimal.add(unref(upgrades[FomeDims.height].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.infinitesimal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.infinitesimal)
        })),
        [FomeDims.width]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.width].amount), 1.15).pow_base(7).times(10),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.infinitesimal].earned)
            })),
            display: getDimDisplay(FomeTypes.infinitesimal, FomeDims.width),
            effect() { return Decimal.add(unref(upgrades[FomeDims.width].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.infinitesimal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.infinitesimal)
        })),
        [FomeDims.depth]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.depth].amount), 1.15).pow_base(9).times(25),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.infinitesimal].earned)
            })),
            display: getDimDisplay(FomeTypes.infinitesimal, FomeDims.depth),
            effect() { return Decimal.add(unref(upgrades[FomeDims.depth].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.infinitesimal].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.infinitesimal)
        })),
        condense: createUpgrade(() => ({
            visibility: (): boolean => !unref(upgrades.condense.bought) && (unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || unref(fome[FomeTypes.protoversal].upgrades.condense.bought)),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: 2e4
            })),
            display: { description: () => <><h3>Condense your {unref(amount.displayName)}</h3><br/></> },
            onPurchase() { fome.subspatial.upgrades.reform.amount.value = Decimal.dOne },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements.reform.earned) })
        })),
        reform: createRepeatable(() => ({
            visibility: (): boolean => unref(upgrades.condense.bought),
            requirements: [
                createCostRequirement(() => ({
                    resource: noPersist(amount),
                    cost: (): Decimal => [
                            Decimal.pow10(4).times(2),
                            Decimal.pow10(9).times(2),
                            Decimal.pow10(27).times(2),
                            Decimal.pow10(59).times(2),
                            Decimal.pow10(78).times(2),
                            Decimal.pow10(1290).times(2),
                            Decimal.pow10(10840).times(2),
                            Decimal.dInf
                        ][new Decimal(unref(upgrades.reform.amount)).trunc().clampMax(7).toNumber()],
                    requiresPay: (): boolean => !unref(fome.achievements.reform.earned)
                })),
                createReformRequirement((): ReformRequirementOptions => ({
                    fomeType: FomeTypes.protoversal,
                    cost: Formula.variable(upgrades.reform.amount).plus(2)
                }))
            ],
            display: getReformDisplay(FomeTypes.infinitesimal),
            effect() { return Decimal.cbrt(unref(upgrades.reform.amount)) },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements.reform.earned) })
        }))
    };
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
    const boosts: Record<1|2|3|4|5, Boost> & { index: Persistent<1|2|3|4|5> } = {
        index: persistent<1|2|3|4|5>(1),
        1: createBoost(() => ({
            display: () => `Multiply the generation of ${unref(amount.singularName)} by ${format(getFomeBoost(FomeTypes.infinitesimal, 1))}`,
            effect: () => new Decimal(unref(boosts[1].total)).times(unref(skyrmion.pion.upgrades.lambda.effect))
                                                           .times(unref(skyrmion.pion.upgrades.kappa.effect))
                                                           .plus(1),
            bonus: boostBonus
        })),
        2: createBoost(() => ({
            display: () => `Increase Pion and Spinor gain by ${format(Decimal.minus(getFomeBoost(FomeTypes.infinitesimal, 2), 1).times(100))}%`,
            effect: () => Decimal.times(unref(boosts[2].total), 0.5).plus(1),
            bonus: boostBonus
        })),
        3: createBoost(() => ({
            display: () => `Reduce Pion and Spinor Upgrade α costs to 1/${format(Decimal.reciprocate(getFomeBoost(FomeTypes.infinitesimal, 3)))}×`,
            effect: () => Decimal.pow(0.8, unref(boosts[3].total)),
            bonus: boostBonus
        })),
        4: createBoost(() => ({
            display: () => `Reduce Skyrmion costs to 1/${format(getFomeBoost(FomeTypes.infinitesimal, 4))}×`,
            effect: () => Decimal.times(unref(boosts[4].total), 0.5).plus(1),
            bonus: boostBonus
        })),
        5: createBoost(() => ({
            display: () => `Reduce Pion and Spinor Upgrade γ costs to 1/${format(Decimal.reciprocate(getFomeBoost(FomeTypes.infinitesimal, 5)))}×`,
            effect: () => Decimal.pow(0.8, unref(boosts[5].total)),
            bonus: boostBonus
        }))
    }

    const modifierModal = createModifierModal(
        () => `${unref(amount.singularName)} Modifiers`,
        () => [{
            title: amount.displayName,
            modifier: productionModifiers,
            base: () => unref(skyrmion.totalSkyrmions).times(0.01),
            baseText: () => <>[{skyrmion.name}] Total {unref(skyrmion.skyrmions.displayName)}</>
        }]
    );

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