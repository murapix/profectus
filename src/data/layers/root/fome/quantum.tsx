import { createResource } from "features/resources/resource";
import Formula from "game/formulas/formulas";
import { BaseLayer, createLayer } from "game/layers";
import { createExponentialModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { Persistent, noPersist, persistent } from "game/persistence";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { ComputedRef, computed, unref } from "vue";
import acceleron from "../acceleron/acceleron";
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

const id = "quantum";
const layer = createLayer(id, function (this: BaseLayer) {
    const amount = createResource<DecimalSource>(0, { displayName: "Quantum Foam", abyssal: true });

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
            multiplier: () => (unref(timecube.upgrades.toil.effect) as Record<FomeTypes, Decimal>)[FomeTypes.quantum],
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
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.height].amount), 1.15).pow_base(8).times(20),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.quantum].earned)
            })),
            display: getDimDisplay(FomeTypes.quantum, FomeDims.height),
            effect() { return Decimal.add(unref(upgrades[FomeDims.height].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.quantum].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.quantum)
        })),
        [FomeDims.width]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.width].amount), 1.15).pow_base(10).times(30),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.quantum].earned)
            })),
            display: getDimDisplay(FomeTypes.quantum, FomeDims.width),
            effect() { return Decimal.add(unref(upgrades[FomeDims.width].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.quantum].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.quantum)
        })),
        [FomeDims.depth]: createRepeatable(() => ({
            visibility,
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: (): Decimal => Decimal.pow(unref(upgrades[FomeDims.depth].amount), 1.15).pow_base(12).times(100),
                requiresPay: (): boolean => !unref(fome.achievements[FomeTypes.quantum].earned)
            })),
            display: getDimDisplay(FomeTypes.quantum, FomeDims.depth),
            effect() { return Decimal.add(unref(upgrades[FomeDims.depth].amount), 1); },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements[FomeTypes.quantum].earned) }),
            onClick: () => onDimRepeatable(FomeTypes.quantum)
        })),
        condense: createUpgrade(() => ({
            visibility: (): boolean => !unref(upgrades.condense.bought) && (unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || unref(fome[FomeTypes.subplanck].upgrades.condense.bought)),
            requirements: createCostRequirement(() => ({
                resource: noPersist(amount),
                cost: 1e5
            })),
            display: { description: () => <><h3>Condense your {unref(amount.displayName)}</h3><br/></> },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements.reform.earned) })
        })),
        reform: createRepeatable(() => ({
            visibility: (): boolean => unref(upgrades.condense.bought),
            requirements: [
                createCostRequirement(() => ({
                    resource: noPersist(amount),
                    cost: (): Decimal => [
                        Decimal.pow10(4),
                        Decimal.pow10(47),
                        Decimal.pow10(200),
                        Decimal.pow10(400),
                        Decimal.dInf
                    ][new Decimal(unref(upgrades.reform.amount)).trunc().clampMax(4).toNumber()],
                    requiresPay: (): boolean => !unref(fome.achievements.reform.earned)
                })),
                createReformRequirement((): ReformRequirementOptions => ({
                    fomeType: FomeTypes.subplanck,
                    cost: Formula.variable(upgrades.reform.amount).plus(2)
                }))
            ],
            display: getReformDisplay(FomeTypes.quantum),
            effect() { return Decimal.cbrt(unref(upgrades.reform.amount)) },
            classes: (): Record<string, boolean> => ({ auto: unref(fome.achievements.reform.earned) })
        }))
    }
    fome.on("update", () => {
        if (unref(fome.achievements.reform.earned)) {
            if (!unref(upgrades.condense.bought) && unref(upgrades.condense.canPurchase)) upgrades.condense.purchase();
            if (unref(upgrades.reform.canClick)) upgrades.reform.onClick();
        }
        if (unref(fome.achievements[FomeTypes.quantum].earned)) {
            for (const dim of Object.values(FomeDims)) {
                if (unref(upgrades[dim].canClick)) upgrades[dim].onClick();
            }
        }
    })

    const boostBonus = computed(() => unref(fome.globalBoostBonus).plus(getFomeBoost(FomeTypes.quantum, 5)));
    const boosts: Record<1|2|3|4|5, Boost> & { index: Persistent<1|2|3|4|5> } = {
        index: persistent<1|2|3|4|5>(1),
        1: createBoost(() => ({
            display: () => `Multiply the generation of all Foam types by ${format(getFomeBoost(FomeTypes.quantum, 1))}`,
            effect: () => new Decimal(unref(boosts[1].total)).times(unref(skyrmion.pion.upgrades.kappa.effect))
                                                           .plus(1),
            bonus: boostBonus
        })),
        2: createBoost(() => ({
            display: () => `Reduce the Pion and Spinor cost nerf exponent to 1/${format(Decimal.times(getFomeBoost(FomeTypes.quantum, 2), 100).reciprocate())}%`,
            effect: () => {
                let total = unref(boosts[2].total);
                if (Decimal.gt(total, 16)) total = Decimal.ln(2).recip().times(4).times(total);
                return Decimal.pow(0.975, total)
            },
            bonus: boostBonus
        })),
        3: createBoost(() => ({
            display: () => `Multiply the generation of all Foam types again by ${format(getFomeBoost(FomeTypes.quantum, 3))}×`,
            effect: () => {
                let total = unref(boosts[3].total);
                if (Decimal.gt(total, 16)) total = Decimal.sqrt(total).times(4);
                return Decimal.sqrt(getFomeBoost(FomeTypes.quantum, 1)).times(total).dividedBy(10).plus(1);
            },
            bonus: boostBonus
        })),
        4: createBoost(() => ({
            display: () => `Gain ${format(getFomeBoost(FomeTypes.quantum, 4))} bonus Pion and Spinor Upgrade θ, ι, and κ levels`,
            effect: () => Decimal.times(unref(boosts[4].total), 0.25),
            bonus: boostBonus
        })),
        5: createBoost(() => ({
            display: () => `Add ${format(getFomeBoost(FomeTypes.quantum, 5))} bonus levels to all above boosts`,
            effect: () => Decimal.times(unref(boosts[5].total), 0.1),
            bonus: fome.globalBoostBonus
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