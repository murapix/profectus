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
import { createUpgrade } from "features/clickables/upgrade";
import { createRepeatable } from "features/clickables/repeatable";

const id = "subspatial";
const layer = createLayer(id, function (this: BaseLayer) {
    const amount = createResource<DecimalSource>(0, { displayName: "Subspatial Foam", abyssal: true });

    const productionModifiers = createSequentialModifier(() => [
        ...fome.production,
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.height].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.height].amount), 0),
            description: () => <>[{fome.name}] {unref(amount.singularName)} Height ({formatWhole(unref(upgrades[FomeDims.height].amount))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.width].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.width].amount), 0),
            description: () => <>[{fome.name}] {unref(amount.singularName)} Width ({formatWhole(unref(upgrades[FomeDims.width].amount))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades[FomeDims.depth].effect,
            enabled: () => Decimal.gt(unref(upgrades[FomeDims.depth].amount), 0),
            description: () => <>[{fome.name}] {unref(amount.singularName)} Depth ({formatWhole(unref(upgrades[FomeDims.depth].amount))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: boosts[1].effect,
            enabled: () => Decimal.gt(unref(boosts[1].total), 0),
            description: () => <>[{fome.name}] Subspatial Boost 1 ({formatWhole(unref(boosts[1].total))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.zeta.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.zeta.totalAmount), 0),
            description: () => <>[{skyrmion.name}] {unref(skyrmion.pion.pions.singularName)} Upgrade ζ ({formatWhole(unref(skyrmion.pion.upgrades.zeta.totalAmount))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.spinor.upgrades.theta.effect,
            enabled: () => Decimal.gt(unref(skyrmion.spinor.upgrades.theta.totalAmount), 0),
            description: () => <>[{skyrmion.name}] {unref(skyrmion.spinor.spinors.singularName)} Upgrade θ ({formatWhole(unref(skyrmion.spinor.upgrades.theta.totalAmount))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: acceleron.upgrades.alacrity.effect,
            enabled: unref(acceleron.upgrades.alacrity.bought),
            description: () => <>[{acceleron.name}] Subspatial Alacrity</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.configuration.effect!,
            enabled: noPersist(entropy.enhancements.configuration.bought),
            description: () => <>[{acceleron.name}] Entropic Configuration</>
        })),
        createExponentialModifier(() => ({
            exponent: upgrades.reform.effect,
            enabled: () => Decimal.gt(unref(upgrades.reform.amount), 1),
            description: () => <>[{fome.name}] {unref(amount.singularName)}<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 0,
            enabled: () => Decimal.eq(unref(upgrades.reform.amount), 0),
            description: () => <>[{fome.name}] {unref(amount.singularName)}<sup>{formatWhole(unref(upgrades.reform.amount))}</sup></>
        })),
        ...fome.timelineProduction,
        createMultiplicativeModifier(() => ({
            multiplier: () => (unref(timecube.upgrades.toil.effect) as Record<FomeTypes, Decimal>)[FomeTypes.subspatial],
            enabled: () => unref(timecube.upgrades.toil.bought) && unref(timecube.timelines.inTimeline),
            description: () => <>[{timecube.name}] Toil</>
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
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.height].amount), 1.15).pow_base(6).times(10),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.subspatial].earned)
            })),
            display: getDimDisplay(FomeTypes.subspatial, FomeDims.height),
            effect() { return Decimal.add(unref(upgrades[FomeDims.height].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.subspatial].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subspatial)
        })),
        [FomeDims.width]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.width].amount), 1.15).pow_base(8).times(18),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.subspatial].earned)
            })),
            display: getDimDisplay(FomeTypes.subspatial, FomeDims.width),
            effect() { return Decimal.add(unref(upgrades[FomeDims.width].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.subspatial].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subspatial)
        })),
        [FomeDims.depth]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.depth].amount), 1.15).pow_base(10).times(60),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.subspatial].earned)
            })),
            display: getDimDisplay(FomeTypes.subspatial, FomeDims.depth),
            effect() { return Decimal.add(unref(upgrades[FomeDims.depth].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.subspatial].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subspatial)
        })),
        condense: createUpgrade(() => ({
            visibility: (): boolean => !unref(upgrades.condense.bought) && (unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || unref(fome[FomeTypes.infinitesimal].upgrades.condense.bought)),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: 4e5
            })),
            display: { description: () => <><h3>Condense your {unref(amount.displayName)}</h3><br/></> },
            onPurchase() { fome.subplanck.upgrades.reform.amount.value = Decimal.dOne },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements.reform.earned) })
        })),
        reform: createRepeatable(() => ({
            visibility: (): boolean => unref(upgrades.condense.bought),
            requirements: [
                createCostRequirement(() => ({
                    resource: noPersist(amount),
                    cost: (): Decimal => [
                        Decimal.pow10(5).times(4),
                        Decimal.pow10(24).times(4),
                        Decimal.pow10(33).times(4),
                        Decimal.pow10(71).times(4),
                        Decimal.pow10(1010).times(4),
                        Decimal.pow10(1550).times(4),
                        Decimal.dInf
                    ][new Decimal(unref(upgrades.reform.amount)).trunc().clampMax(6).toNumber()],
                    requiresPay: (): boolean => !unref(fome.achievements.reform.earned)
                })),
                createReformRequirement((): ReformRequirementOptions => ({
                    fomeType: FomeTypes.infinitesimal,
                    cost: Formula.variable(upgrades.reform.amount).plus(2)
                }))
            ],
            display: getReformDisplay(FomeTypes.subspatial),
            effect() { return Decimal.cbrt(unref(upgrades.reform.amount)) },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements.reform.earned) })
        }))
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
    const boosts: Record<1|2|3|4|5, Boost> & { index: Persistent<1|2|3|4|5> } = {
        index: persistent<1|2|3|4|5>(1),
        1: createBoost(() => ({
            display: () => `Multiply the generation of ${unref(amount.singularName)} by ${format(getFomeBoost(FomeTypes.subspatial, 1))}`,
            effect: () => new Decimal(unref(boosts[1].total)).times(unref(skyrmion.pion.upgrades.kappa.effect)),
            bonus: fullBoostBonus
        })),
        2: createBoost(() => ({
            display: () => `The Pion and Spinor nerfs act as if you had ${format(getFomeBoost(FomeTypes.subspatial, 2))} fewer upgrades`,
            effect: () => new Decimal(unref(boosts[2].total)),
            bonus: fullBoostBonus
        })),
        3: createBoost(() => ({
            display: () => `Add ${format(getFomeBoost(FomeTypes.subspatial, 3))} levels to all above boosts`,
            effect: () => Decimal.times(unref(boosts[3].total), 0.1),
            bonus: boostBonus
        })),
        4: createBoost(() => ({
            display: () => `Increase effective Skyrmion count by ${format(getFomeBoost(FomeTypes.subspatial, 4))}`,
            effect: () => new Decimal(unref(boosts[4].total)),
            bonus: boostBonus
        })),
        5: createBoost(() => ({
            display: () => `Pion and Spinor upgrades cost as if you had ${format(getFomeBoost(FomeTypes.subspatial, 5))} fewer`,
            effect: () => Decimal.times(unref(boosts[5].total), 0.25),
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