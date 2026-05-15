import { createResource } from "features/resources/resource";
import Formula from "game/formulas/formulas";
import { createLayer } from "game/layers";
import { createExponentialModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { Persistent, noPersist, persistent } from "game/persistence";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { ComputedRef, computed, unref } from "vue";
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

const id = "subplanck";
const layer = createLayer(id, () => {
    const amount = createResource<DecimalSource>(0, { displayName: "Subplanck Foam", abyssal: true });

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
            description: () => <>[{fome.name}] Subplanck Boost 1 ({formatWhole(unref(boosts[1].total))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.invention.effect!,
            enabled: noPersist(entropy.enhancements.invention.bought),
            description: () => <>[{acceleron.name}] Entropic Invention</>
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
            multiplier: () => (unref(timecube.upgrades.toil.effect) as Record<FomeTypes, Decimal>)[FomeTypes.subplanck],
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

    const visibility = computed((): boolean => unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || Decimal.gt(unref(upgrades.reform.amount), 0));
    const upgrades = {
        [FomeDims.height]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.height].amount), 1.15).pow_base(7).times(15),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.subplanck].earned)
            })),
            display: getDimDisplay(FomeTypes.subplanck, FomeDims.height),
            effect() { return Decimal.add(unref(upgrades[FomeDims.height].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.subplanck].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subplanck)
        })),
        [FomeDims.width]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.width].amount), 1.15).pow_base(9).times(25),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.subplanck].earned)
            })),
            display: getDimDisplay(FomeTypes.subplanck, FomeDims.width),
            effect() { return Decimal.add(unref(upgrades[FomeDims.width].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.subplanck].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subplanck)
        })),
        [FomeDims.depth]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.depth].amount), 1.15).pow_base(11).times(90),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.subplanck].earned)
            })),
            display: getDimDisplay(FomeTypes.subplanck, FomeDims.depth),
            effect() { return Decimal.add(unref(upgrades[FomeDims.depth].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.subplanck].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.subplanck)
        })),
        condense: createUpgrade(() => ({
            visibility: (): boolean => !unref(upgrades.condense.bought) && (unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || unref(fome[FomeTypes.subspatial].upgrades.condense.bought)),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: 1e6
            })),
            display: { description: () => <><h3>Condense your {unref(amount.displayName)}</h3><br/></> },
            onPurchase() { fome.quantum.upgrades.reform.amount.value = Decimal.dOne },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements.reform.earned) })
        })),
        reform: createRepeatable(() => ({
            visibility: (): boolean => unref(upgrades.condense.bought),
            requirements: [
                createCostRequirement(() => ({
                    resource: noPersist(amount),
                    cost: (): Decimal => [
                        Decimal.pow10(6),
                        Decimal.pow10(25),
                        Decimal.pow10(66),
                        Decimal.pow10(600),
                        Decimal.pow10(1020),
                        Decimal.dInf
                    ][new Decimal(unref(upgrades.reform.amount)).trunc().clampMax(5).toNumber()],
                    requiresPay: (): boolean => !unref(fome.achievements.reform.earned)
                })),
                createReformRequirement((): ReformRequirementOptions => ({
                    fomeType: FomeTypes.subspatial,
                    cost: Formula.variable(upgrades.reform.amount).plus(2)
                }))
            ],
            display: getReformDisplay(FomeTypes.subplanck),
            effect() { return Decimal.cbrt(unref(upgrades.reform.amount)) },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements.reform.earned) })
        }))
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
    const boosts: Record<1|2|3|4|5, Boost> & { index: Persistent<1|2|3|4|5> } = {
        index: persistent<1|2|3|4|5>(1),
        1: createBoost(() => ({
            display: () => `Multiply the generation of ${unref(amount.singularName)} by ${format(getFomeBoost(FomeTypes.subplanck, 1))}`,
            effect: () => new Decimal(unref(boosts[1].total)).times(unref(skyrmion.spinor.upgrades.kappa.effect))
                                                           .times(unref(skyrmion.pion.upgrades.kappa.effect))
                                                           .plus(1),
            bonus: boostBonus
        })),
        2: createBoost(() => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.subplanck, 2))} bonus Pion and Spinor Upgrade δ levels`,
            effect: () => Decimal.times(unref(boosts[2].total), 0.5),
            bonus: boostBonus
        })),
        3: createBoost(() => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.subplanck, 3))} bonus Pion and Spinor Upgrade ε levels`,
            effect: () => Decimal.times(unref(boosts[3].total), 0.5),
            bonus: boostBonus
        })),
        4: createBoost(() => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.subplanck, 4))} bonus Pion and Spinor Upgrade ζ levels`,
            effect: () => Decimal.times(unref(boosts[4].total), 0.5),
            bonus: boostBonus
        })),
        5: createBoost(() => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.subplanck, 5))} bonus Pion and Spinor Upgrade η levels`,
            effect: () => Decimal.times(unref(boosts[5].total), 0.5),
            bonus: boostBonus
        }))
    }

    const modifierModal = createModifierModal(
        () => `${unref(amount.singularName)} Modifiers`,
        () => [{
            title: amount.displayName,
            modifier: productionModifiers,
            base: () => unref(skyrmion.totalSkyrmions).times(0.01),
            baseText: jsx(() => <>[{skyrmion.name}] Total {unref(skyrmion.skyrmions.displayName)}</>)
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