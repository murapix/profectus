import { CoercableComponent, getUniqueID, jsx, OptionsFunc, Replace, Visibility } from "features/feature";
import { createResource, PersistentResource, Resource } from "features/resources/resource";
import { createRepeatable, GenericRepeatable, RepeatableOptions } from "features/repeatable";
import { createUpgrade, GenericUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import { createTabFamily } from "features/tabs/tabFamily";
import { createTab } from "features/tabs/tab";
import { createAchievement, GenericAchievement } from "features/achievements/achievement";
import { addTooltip } from "features/tooltips/tooltip";
import { BaseLayer, createLayer } from "game/layers";
import { noPersist, Persistent, persistent, PersistentState } from "game/persistence";
import { Computable, convertComputable, GetComputableType, processComputable, ProcessedComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { formatWhole } from "util/break_eternity";
import Decimal, { DecimalSource, format } from "util/bignum";
import { render, renderRowJSX } from "util/vue";
import { computed, ComputedRef, Ref, StyleValue, unref } from "vue";

import ResourceVue from "features/resources/Resource.vue";
import SpacerVue from "components/layout/Spacer.vue";
import FomeVue from "./Fome.vue";
import FomeBoostVue from "./FomeBoost.vue";

import skyrmion from "../skyrmion/skyrmion";
import acceleron from "../acceleron/acceleron";
import entropy from "../acceleron/entropy";
import timecube from "../timecube/timecube";
import inflaton from "../inflaton/inflaton";
import { getResearchEffect } from "../inflaton/research";
import { createBooleanRequirement, createCostRequirement, displayRequirements } from "game/requirements";
import { effectDecorator, EffectFeatureOptions, GenericEffectFeature } from "features/decorators/common";


export enum FomeTypes {
    protoversal = "protoversal",
    infinitesimal = "infinitesimal",
    subspatial = "subspatial",
    subplanck = "subplanck",
    quantum = "quantum"
}

export enum FomeDims {
    height = "height",
    width = "width",
    depth = "depth"
}

const id = "fome";
const layer = createLayer(id, function (this: BaseLayer) {
    const BoostType = Symbol("Boost");

    const name = "Quantum Foam";
    const color = "#ffffff";

    const unlocked: Ref<boolean> = skyrmion.skyrmionUpgrades.fome.bought;

    const amounts: Record<FomeTypes, PersistentResource<DecimalSource>> = {
        [FomeTypes.protoversal]: createResource<DecimalSource>(0, "Protoversal Foam"),
        [FomeTypes.infinitesimal]: createResource<DecimalSource>(0, "Infinitesimal Foam"),
        [FomeTypes.subspatial]: createResource<DecimalSource>(0, "Subspatial Foam"),
        [FomeTypes.subplanck]: createResource<DecimalSource>(0, "Subplanck Foam"),
        [FomeTypes.quantum]: createResource<DecimalSource>(0, "Quantum Foam")
    };

    const highestFome = computed(() => {
        if (Decimal.gt(unref(reformUpgrades.quantum.amount), 0)) return FomeTypes.quantum;
        else if (Decimal.gt(unref(reformUpgrades.subplanck.amount), 0)) return FomeTypes.subplanck;
        else if (Decimal.gt(unref(reformUpgrades.subspatial.amount), 0)) return FomeTypes.subspatial;
        else if (Decimal.gt(unref(reformUpgrades.infinitesimal.amount), 0)) return FomeTypes.infinitesimal;
        else return FomeTypes.protoversal;
    });

    const baseGenRate = computed(() =>
        Decimal.add(unref(skyrmion.skyrmions), getFomeBoost(FomeTypes.subspatial, 4))
            .divide(100)
            .times(unref(skyrmion.spinorUpgrades.eta.effect))
            .times(getUpgradeEffect(acceleron.upgrades.acceleration))
            .times(getUpgradeEffect(entropy.enhancements.invention))
            .times(unref(acceleron.loops.tempFoam.currentBoost!))
            .times(getUpgradeEffect(entropy.enhancements.formation))
            .times(unref(inflaton.fomeBonus))
            .times(1) // inflaton upgrade 21
            .times(getFomeBoost(FomeTypes.quantum, 1))
            .times(getFomeBoost(FomeTypes.quantum, 3))
    );
    const enlargeMulti = Object.fromEntries(
        Object.values(FomeTypes).map(type => [
            type,
            computed(() => Object.values(dimUpgrades[type]).map(upgrade => unref(upgrade.effect)).reduce((a, b) => a.times(b)))
        ])
    ) as Record<FomeTypes, ComputedRef<Decimal>>;

    const boostMulti: Record<FomeTypes, ComputedRef<Decimal>> = {
        [FomeTypes.protoversal]: computed(() => getFomeBoost(FomeTypes.protoversal, 1)),
        [FomeTypes.infinitesimal]: computed(() => getFomeBoost(FomeTypes.infinitesimal, 1)),
        [FomeTypes.subspatial]: computed(() => getFomeBoost(FomeTypes.subspatial, 1)),
        [FomeTypes.subplanck]: computed(() => getFomeBoost(FomeTypes.subplanck, 1)),
        [FomeTypes.quantum]: computed(() => Decimal.dOne)
    };
    const miscMulti: Record<FomeTypes, ComputedRef<Decimal>> = {
        [FomeTypes.protoversal]: computed(() => new Decimal(unref(skyrmion.pionUpgrades.delta.effect)).times(unref(skyrmion.pionUpgrades.epsilon.effect)).times(unref(skyrmion.pionUpgrades.theta.effect))),
        [FomeTypes.infinitesimal]: computed(() => new Decimal(unref(skyrmion.pionUpgrades.iota.effect)).times(unref(skyrmion.spinorUpgrades.epsilon.effect)).times(unref(skyrmion.spinorUpgrades.iota.effect)).times(getUpgradeEffect(entropy.enhancements.extension))),
        [FomeTypes.subspatial]: computed(() => new Decimal(unref(skyrmion.pionUpgrades.zeta.effect)).times(unref(skyrmion.spinorUpgrades.theta.effect)).times(1/* acceleron upgrade 23 */).times(getUpgradeEffect(entropy.enhancements.configuration))),
        [FomeTypes.subplanck]: computed(() => getUpgradeEffect(entropy.enhancements.invention)),
        [FomeTypes.quantum]: computed(() => Decimal.dOne)
    };
    const fomeRate = Object.fromEntries(
        Object.values(FomeTypes).map(type => [
            type,
            computed(() => unref(baseGenRate)
                    .times(unref(enlargeMulti[type]))
                    .times(unref(boostMulti[type]))
                    .times(unref(miscMulti[type]))
                    .pow(unref(reformUpgrades[type].effect))
                    .times(1) // left timeline bonus
                    .div(1) // left timeline nerf
                    .times(1) // timecube upgrade 45, per-foam
            )
        ])
    ) as Record<FomeTypes, ComputedRef<Decimal>>;
    this.on("preUpdate", (diff: number) => {
        if (!unref(unlocked)) return;

        const delta = unref(acceleron.timeMult).times(diff);
        Object.values(FomeTypes).forEach(type => {
            if (Decimal.gt(unref(reformUpgrades[type].amount), 0))
                amounts[type].value = unref(fomeRate[type]).times(delta).plus(unref(amounts[type])).max(0);
        });
    });

    const achievementStyle = {
        fontSize: '48px',
        fontWeight: 'normal',
        color: 'var(--feature-foreground)'
    } as StyleValue
    const achievements: Record<FomeTypes | "reform", GenericAchievement & { tooltip: { requirement: JSX.Element, effectDisplay: JSX.Element } }> = {
        [FomeTypes.protoversal]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>2</sup></span></>),
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 2) },
            tooltip: {
                requirement: <>Re-form your Protoversal Foam</>,
                effectDisplay: <>Unlock the Pion and Spinor Buy All button<br />Automatically enlarge your Protoversal Foam</>
            }
        })),
        [FomeTypes.infinitesimal]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>3</sup></span></>),
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 3) },
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>3</sup></>,
                effectDisplay: <>Automatically enlarge your Infinitesimal Foam</>
            }
        })),
        [FomeTypes.subspatial]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>4</sup></span></>),
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 4) },
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>4</sup></>,
                effectDisplay: <>Automatically enlarge your Subspatial Foam</>
            }
        })),
        [FomeTypes.subplanck]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>5</sup></span></>),
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 5) },
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>5</sup></>,
                effectDisplay: <>Automatically enlarge your Subplanck Foam</>
            }
        })),
        [FomeTypes.quantum]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>6</sup></span></>),
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 6) },
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>6</sup></>,
                effectDisplay: <>Automatically enlarge your Quantum Foam</>
            }
        })),
        reform: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>Q<sup style={{fontWeight: 'normal'}}>2</sup></span></>),
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.quantum.amount), 2) },
            tooltip: {
                requirement: <>Obtain Quantum Foam<sup>2</sup></>,
                effectDisplay: <>Automatically re-form your Foam</>
            }
        }))
    };
    Object.values(achievements).forEach(achievement => {
        addTooltip(achievement, {
            display: jsx(() => (<><h3>{achievement.tooltip.requirement}</h3><br />{achievement.tooltip.effectDisplay}</>)) 
        })
    })
    this.on("update", () => {
        if (unref(achievements.reform.earned)) {
            Object.values(condenseUpgrades).filter(upgrade => !unref(upgrade.bought)).forEach(upgrade => upgrade.purchase());
            Object.values(reformUpgrades).forEach(upgrade => upgrade.onClick());
        }
        Object.values(FomeTypes).forEach(type => {
            if (unref(achievements[type].earned)) {
                Object.values(dimUpgrades[type]).forEach(dim => dim.onClick());
            }
        });
    })

    const dimUpgrades: Record<FomeTypes, Record<FomeDims, GenericRepeatable & GenericEffectFeature>> = {
        [FomeTypes.protoversal]: {
            [FomeDims.height]: createDimRepeatable(FomeTypes.protoversal, FomeDims.height, amount => Decimal.pow(4, Decimal.pow(amount, 1.15)).times(2)),
            [FomeDims.width]: createDimRepeatable(FomeTypes.protoversal, FomeDims.width, amount => Decimal.pow(6, Decimal.pow(amount, 1.15)).times(5)),
            [FomeDims.depth]: createDimRepeatable(FomeTypes.protoversal, FomeDims.depth, amount => Decimal.pow(8, Decimal.pow(amount, 1.15)).times(20))
        },
        [FomeTypes.infinitesimal]: {
            [FomeDims.height]: createDimRepeatable(FomeTypes.infinitesimal, FomeDims.height, amount => Decimal.pow(5, Decimal.pow(amount, 1.15)).times(6)),
            [FomeDims.width]: createDimRepeatable(FomeTypes.infinitesimal, FomeDims.width, amount => Decimal.pow(7, Decimal.pow(amount, 1.15)).times(10)),
            [FomeDims.depth]: createDimRepeatable(FomeTypes.infinitesimal, FomeDims.depth, amount => Decimal.pow(9, Decimal.pow(amount, 1.15)).times(25))
        },
        [FomeTypes.subspatial]: {
            [FomeDims.height]: createDimRepeatable(FomeTypes.subspatial, FomeDims.height, amount => Decimal.pow(6, Decimal.pow(amount, 1.15)).times(10)),
            [FomeDims.width]: createDimRepeatable(FomeTypes.subspatial, FomeDims.width, amount => Decimal.pow(8, Decimal.pow(amount, 1.15)).times(18)),
            [FomeDims.depth]: createDimRepeatable(FomeTypes.subspatial, FomeDims.depth, amount => Decimal.pow(10, Decimal.pow(amount, 1.15)).times(60))
        },
        [FomeTypes.subplanck]: {
            [FomeDims.height]: createDimRepeatable(FomeTypes.subplanck, FomeDims.height, amount => Decimal.pow(7, Decimal.pow(amount, 1.15)).times(15)),
            [FomeDims.width]: createDimRepeatable(FomeTypes.subplanck, FomeDims.width, amount => Decimal.pow(9, Decimal.pow(amount, 1.15)).times(25)),
            [FomeDims.depth]: createDimRepeatable(FomeTypes.subplanck, FomeDims.depth, amount => Decimal.pow(11, Decimal.pow(amount, 1.15)).times(90))
        },
        [FomeTypes.quantum]: {
            [FomeDims.height]: createDimRepeatable(FomeTypes.quantum, FomeDims.height, amount => Decimal.pow(8, Decimal.pow(amount, 1.15)).times(20)),
            [FomeDims.width]: createDimRepeatable(FomeTypes.quantum, FomeDims.width, amount => Decimal.pow(10, Decimal.pow(amount, 1.15)).times(30)),
            [FomeDims.depth]: createDimRepeatable(FomeTypes.quantum, FomeDims.depth, amount => Decimal.pow(12, Decimal.pow(amount, 1.15)).times(100))
        }
    };
    function createDimRepeatable(type: FomeTypes, dim: FomeDims, cost: (amount: DecimalSource) => DecimalSource) {
        const display = dimRepeatableDisplay(type, dim);
        const repeatable = createRepeatable<RepeatableOptions & EffectFeatureOptions>(() => ({
            visibility() { return Decimal.gt(unref(reformUpgrades[type].amount), 0) },
            requirements: createCostRequirement(() => ({
                resource: noPersist(amounts[type]),
                cost() { return cost(unref(repeatable.amount))},
                requiresPay: achievements[type].earned
            })),
            display: display,
            effect() { return Decimal.add(unref(this.amount), 1); },
            classes: () => ({ auto: unref(achievements[type].earned) }),
            onPurchase() {
                const index = boosts[type].index;
                const boost = boosts[type][unref(index)].amount;
                boost.value = Decimal.add(unref(boost), 1);
                index.value = (unref(index) === 5 ? 1 : unref(index) + 1) as 1|2|3|4|5;
            }
        }), effectDecorator) as GenericRepeatable & GenericEffectFeature;
        return repeatable;
    }
    function dimRepeatableDisplay(type: FomeTypes, dim: FomeDims) {
        let dimName: string;
        switch (dim) {
            case FomeDims.height: dimName = "Height"; break;
            case FomeDims.width: dimName = "Width"; break;
            case FomeDims.depth: dimName = "Depth"; break;
        }
        return jsx(() => (
            <>
                <h3>Enlarge {amounts[type].displayName} {dimName} by 1m</h3>
                <br />
                <br />
                <b>Current {dimName}:</b> {format(unref(dimUpgrades[type][dim].amount))}m
                <br />
                <br />
                <b>Cost:</b> {displayRequirements(dimUpgrades[type][dim].requirements)}
            </>
        ));
    }

    const condenseUpgrades: Record<FomeTypes, GenericUpgrade> = {
        [FomeTypes.protoversal]: createUpgrade(() => ({
            visibility() { return !unref(this.bought); },
            requirements: createCostRequirement(() => ({
                resource: noPersist(amounts[FomeTypes.protoversal]),
                cost: 1e4
            })),
            display: { description: `Condense your ${amounts.protoversal.displayName}` },
            onPurchase() { reformUpgrades.infinitesimal.amount.value = Decimal.dOne }
        })),
        [FomeTypes.infinitesimal]: createUpgrade(() => ({
            visibility() { return !unref(this.bought) && unref(condenseUpgrades.protoversal.bought); },
            requirements: createCostRequirement(() => ({
                resource: noPersist(amounts[FomeTypes.infinitesimal]),
                cost: 2e4
            })),
            display: { description: `Condense your ${amounts.infinitesimal.displayName}` },
            onPurchase() { reformUpgrades.subspatial.amount.value = Decimal.dOne }
        })),
        [FomeTypes.subspatial]: createUpgrade(() => ({
            visibility() { return !unref(this.bought) && unref(condenseUpgrades.infinitesimal.bought); },
            requirements: createCostRequirement(() => ({
                resource: noPersist(amounts[FomeTypes.subspatial]),
                cost: 4e5
            })),
            display: { description: `Condense your ${amounts.subspatial.displayName}` },
            onPurchase() { reformUpgrades.subplanck.amount.value = Decimal.dOne }
        })),
        [FomeTypes.subplanck]: createUpgrade(() => ({
            visibility() { return !unref(this.bought) && unref(condenseUpgrades.subspatial.bought); },
            requirements: createCostRequirement(() => ({
                resource: noPersist(amounts[FomeTypes.subplanck]),
                cost: 1e6
            })),
            display: { description: `Condense your ${amounts.subplanck.displayName}` },
            onPurchase() { reformUpgrades.quantum.amount.value = Decimal.dOne }
        })),
        [FomeTypes.quantum]: createUpgrade(() => ({
            visibility() { return !unref(this.bought) && unref(condenseUpgrades.subplanck.bought); },
            requirements: createCostRequirement(() => ({
                resource: noPersist(amounts[FomeTypes.quantum]),
                cost: 1e5
            })),
            display: { description: `Condense your ${amounts.quantum.displayName}` }
        }))
    };

    const reformCosts: Record<FomeTypes, (amount: Decimal) => Decimal> = {
        [FomeTypes.protoversal]: amount => amount.pow(amount.minus(3).max(2)).plus(1).times(4).pow10(),
        [FomeTypes.infinitesimal]: amount => amount.pow(amount.minus(2).max(2)).plus(1).times(5).pow10().dividedBy(5),
        [FomeTypes.subspatial]: amount => amount.pow(amount.minus(3).max(2)).plus(1).times(6).pow10().dividedBy(2.5),
        [FomeTypes.subplanck]: amount => amount.pow(amount.minus(3).max(2)).plus(1).times(6).pow10(),
        [FomeTypes.quantum]: amount => amount.pow(amount.minus(3).max(2)).plus(1).times(4).pow10()
    }
    const reformLimits: Record<FomeTypes, ComputedRef<DecimalSource>> = {
        [FomeTypes.protoversal]: computed(() => Decimal.dInf),
        [FomeTypes.infinitesimal]: computed(() => Decimal.sub(unref(reformUpgrades.protoversal.amount), 1).max(0)),
        [FomeTypes.subspatial]: computed(() => Decimal.sub(unref(reformUpgrades.infinitesimal.amount), 1).max(0)),
        [FomeTypes.subplanck]: computed(() => Decimal.sub(unref(reformUpgrades.subspatial.amount), 1).max(0)),
        [FomeTypes.quantum]: computed(() => Decimal.sub(unref(reformUpgrades.subplanck.amount), 1).max(0))
    }
    const reformLimitResource: Record<FomeTypes, Resource> = {
        [FomeTypes.protoversal]: amounts.protoversal,
        [FomeTypes.infinitesimal]: amounts.protoversal,
        [FomeTypes.subspatial]: amounts.infinitesimal,
        [FomeTypes.subplanck]: amounts.subspatial,
        [FomeTypes.quantum]: amounts.subplanck
    }
    type ReformUpgrade = GenericRepeatable & GenericEffectFeature;
    const reformUpgrades = Object.fromEntries(
        Object.values(FomeTypes).map(type => [
            type,
            createRepeatable<RepeatableOptions & EffectFeatureOptions>(() => ({
                visibility() { return unref(condenseUpgrades[type].bought); },
                requirements: [
                    createBooleanRequirement(() => Decimal.lt(unref(reformUpgrades[type].amount), unref(reformLimits[type]))),
                    createCostRequirement(() => ({
                        cost() { return reformCosts[type](new Decimal(unref(reformUpgrades[type].amount))); },
                        resource: noPersist(amounts[type])
                    })),
                ],
                display: jsx(() => {
                    const buyable = reformUpgrades[type];
                    const description = <>Re-form your {amounts[type].displayName}</>
                    const amountDisplay = <>Amount: {formatWhole(unref(buyable.amount))}</>
                    const requirementDisplay = <>Requires: {reformLimitResource[type].displayName}<sup>{formatWhole(unref(Decimal.add(unref(buyable.amount), 2)))}</sup></>
                    const costDisplay = displayRequirements(buyable.requirements)
                    return (
                        <>
                            {description}
                            <div><br />
                            {amountDisplay}</div>
                            <div><br />
                            {requirementDisplay}{costDisplay}</div>
                        </>
                    );
                }),
                classes: () => ({ auto: unref(achievements.reform.earned) }),
                effect() { return Decimal.cbrt(unref(this.amount)); }
            }), effectDecorator)
        ])
    ) as Record<FomeTypes, ReformUpgrade>;
    
    const globalBoost = computed(() => Decimal.add(getUpgradeEffect(entropy.enhancements.entitlement, 0), getUpgradeEffect(timecube.upgrades.tier, 0)))

    const boosts: Record<FomeTypes, Record<1|2|3|4|5, GenericBoost> & { index: Persistent<1|2|3|4|5> }> = {
        [FomeTypes.protoversal]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.protoversal, 1,
                effect => `Multiply the generation of Protoversal Foam by ${format(effect)}`,
                total => total.times(1).plus(1).times(unref(skyrmion.pionUpgrades.kappa.effect)).times(unref(skyrmion.spinorUpgrades.delta.effect)),
                () => unref(globalBoost).plus(unref(globalBoost).plus(getFomeBoost(FomeTypes.protoversal, 5)).plus(getFomeBoost(FomeTypes.subspatial, 3)).plus(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            2: createFomeBoost(FomeTypes.protoversal, 2,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade α levels`,
                total => total,
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.protoversal, 5).plus(getFomeBoost(FomeTypes.subspatial, 3)).add(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            3: createFomeBoost(FomeTypes.protoversal, 3,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade β levels`,
                total => Decimal.sqrt(total),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.protoversal, 5).plus(getFomeBoost(FomeTypes.subspatial, 3)).add(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            4: createFomeBoost(FomeTypes.protoversal, 4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade γ levels`,
                total => total,
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.protoversal, 5).plus(getFomeBoost(FomeTypes.subspatial, 3)).add(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            5: createFomeBoost(FomeTypes.protoversal, 5,
                effect => `Add ${format(effect)} levels to all above boosts`,
                total => total.times(0.1),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5)))
            )
        },
        [FomeTypes.infinitesimal]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.infinitesimal, 1,
                effect => `Multiply the generation of Infinitesimal Foam by ${format(effect)}x`,
                total => total.times(1).plus(1).times(unref(skyrmion.pionUpgrades.lambda.effect)),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))).times(unref(skyrmion.pionUpgrades.lambda.effect))
            ),
            2: createFomeBoost(FomeTypes.infinitesimal, 2,
                effect => `Increase Pion and Spinor gain by ${format(effect.minus(1).times(100))}%`,
                total => total.times(0.5).plus(1),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            3: createFomeBoost(FomeTypes.infinitesimal, 3,
                effect => `Reduce Pion and Spinor Upgrade α costs by ${format(Decimal.sub(1, effect).times(100))}%`,
                total => Decimal.pow(0.8, total),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            4: createFomeBoost(FomeTypes.infinitesimal, 4,
                effect => `Increase Skyrmion gain by ${format(effect.minus(1).times(100))}%`,
                total => total.times(0.5).plus(1),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            5: createFomeBoost(FomeTypes.infinitesimal, 5,
                effect => `Reduce Pion and Spinor Upgrade γ costs by ${format(Decimal.sub(1, effect).times(100))}%`,
                total => Decimal.pow(0.8, total),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5)))
            )
        },
        [FomeTypes.subspatial]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.subspatial, 1,
                effect => `Multiply the generation of Subspatial Foam by ${format(effect)}x`,
                total => total.times(1).plus(1).times(unref(skyrmion.spinorUpgrades.kappa.effect)),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            2: createFomeBoost(FomeTypes.subspatial, 2,
                effect => `The Pion and Spinor nerfs act as if you had ${format(effect)} fewer upgrades`,
                total => total,
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5)))
            ),
            3: createFomeBoost(FomeTypes.subspatial, 3,
                effect => `Add ${format(effect)} levels to all above boosts`,
                total => total.times(0.1),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            4: createFomeBoost(FomeTypes.subspatial, 4,
                effect => `Increase effective Skyrmion count by ${format(effect)}`,
                total => total,
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            5: createFomeBoost(FomeTypes.subspatial, 5,
                effect => `Pion and Spinor upgrades cost as if you had ${format(effect)} fewer`,
                total => total.times(0.25),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            )
        },
        [FomeTypes.subplanck]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.subplanck, 1,
                effect => `Multiply the generation of Subplanck Foam by ${format(effect)}x`,
                total => total.times(1).plus(1),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            2: createFomeBoost(FomeTypes.subplanck, 2,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade δ levels`,
                total => total.times(0.5),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            3: createFomeBoost(FomeTypes.subplanck, 3,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade ε levels`,
                total => total.times(0.5),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            4: createFomeBoost(FomeTypes.subplanck, 4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade ζ levels`,
                total => total.times(0.5),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            5: createFomeBoost(FomeTypes.subplanck, 5,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade η levels`,
                total => total.times(0.5),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            )
        },
        [FomeTypes.quantum]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.quantum, 1,
                effect => `Multiply the generation of all Foam types by ${format(effect)}x`,
                total => total.times(1).plus(1),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            2: createFomeBoost(FomeTypes.quantum, 2,
                effect => `Reduce the Pion and Spinor cost nerf exponent by ${format(Decimal.sub(1, effect).times(100))}%`,
                total => Decimal.pow(0.975, total.gt(16) ? total.ln().times(Decimal.ln(2).recip().times(4)) : total),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            3: createFomeBoost(FomeTypes.quantum, 3,
                effect => `Multiply the generation of all Foam types again by ${format(effect)}x`,
                total => (total.gt(16) ? total.sqrt().times(4) : total).times(getFomeBoost(FomeTypes.quantum, 1).dividedBy(10)).plus(1),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            4: createFomeBoost(FomeTypes.quantum, 4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade θ, ι, and κ levels`,
                total => total.times(0.25),
                () => unref(globalBoost).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            5: createFomeBoost(FomeTypes.quantum, 5,
                effect => `Add ${format(effect)} levels to all above boosts`,
                total => total.times(0.1),
                () => unref(globalBoost)
            )
        }
    };
    function getFomeBoost(type: FomeTypes, index: 1 | 2 | 3 | 4 | 5) {
        return unref(boosts[type][index].effect);
    }

    const tabs = createTabFamily({
        main: () => ({
            display: "Foam",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        <div>
                            You have{" "}
                            <ResourceVue resource={amounts[unref(highestFome)]} color={color} />{" "}
                            {amounts[unref(highestFome)].displayName}
                            {unref(reformUpgrades[unref(highestFome)].amount) > 1 ? (
                                <sup>{formatWhole(unref(reformUpgrades[unref(highestFome)].amount))}</sup>
                            ) : null}
                        </div>
                        <SpacerVue />
                        <FomeVue />
                        <SpacerVue height="8px" />
                        {renderRowJSX(...Object.values(achievements))}
                    </>
                ))
            }))
        }),
        boosts: () => ({
            display: "Boosts",
            tab: createTab(() => ({ display: jsx(() => (<><FomeBoostVue /></>)) }))
        })
    });

    return {
        name,
        color,
        amounts,
        rates: fomeRate,
        dimUpgrades,
        condenseUpgrades,
        reformUpgrades,
        achievements,
        boosts,
        getFomeBoost,
        display: jsx(() => (
            <>
                {unref(boosts.protoversal[1].amount) === 0
                    ? render(unref(tabs.tabs.main.tab))
                    : render(tabs)}
            </>
        )),
        style: { "--bought": "#929aa9" },
        tabs,
        unlocked
    };

    interface BoostOptions {
        display: Computable<CoercableComponent[]>;
        effect: Computable<Decimal>;
        bonus: Computable<DecimalSource>;
    }

    interface BaseBoost extends Persistent<number> {
        id: string;
        amount: Ref<DecimalSource>;
        type: typeof BoostType;
    }

    type Boost<T extends BoostOptions> = Replace<
        T & BaseBoost,
        {
            display: Ref<string[]>;
            effect: GetComputableType<T["effect"]>;
            bonus: GetComputableType<T["bonus"]>;
        }
    >;

    type GenericBoost = Replace<Boost<BoostOptions>,
    {
        effect: ProcessedComputable<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        bonus: ProcessedComputable<DecimalSource>
    }>;

    function createFomeBoost(
        type: FomeTypes,
        index: 1 | 2 | 3 | 4 | 5,
        display: (effect: Decimal) => string,
        effect: (total: Decimal) => Decimal,
        bonus: Computable<DecimalSource>
    ) {
        return createBoost(() => ({
            display() {
                const amount = unref(boosts[type][index].amount);
                const bonus = unref(boosts[type][index].bonus);
                if (amount > 0 || bonus > 0)
                    return [
                        `${amounts[type].displayName.split(" ")[0]} Boost ${index}`,
                        '[',
                        formatWhole(amount),
                        bonus > 0 ? '+' : '',
                        bonus > 0 ? format(bonus) : '',
                        ']:',
                        display(unref(boosts[type][index].effect))
                    ];
                return ["", "", "", "", "", "", ""];
                
            },
            effect() {
                return effect(Decimal.add(unref(this.amount), unref(this.bonus as ProcessedComputable<DecimalSource>)));
            },
            bonus: bonus
        }));
    }

    function createBoost<T extends BoostOptions>(optionsFunc: OptionsFunc<T, BaseBoost, GenericBoost>): Boost<T> {
        const amount = persistent<DecimalSource>(0);
        return createLazyProxy(() => {
            const boost = optionsFunc();

            boost.id = getUniqueID("boost-");
            boost.type = BoostType;
            boost.amount = amount;

            processComputable(boost as T, "display");
            processComputable(boost as T, "effect");
            processComputable(boost as T, "bonus");

            return boost as unknown as Boost<T>;
        });
    }
});

export default layer;