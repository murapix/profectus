import { CoercableComponent, getUniqueID, jsx, OptionsFunc, Replace, showIf, StyleValue, Visibility } from "features/feature";
import { createResource, Resource } from "features/resources/resource";
import { BaseLayer, createLayer } from "game/layers";
import Decimal, { DecimalSource, format } from "util/bignum";
import { Persistent, persistent, PersistentState } from "game/persistence";
import { createLayerTreeNode } from "data/common";
import { computed, ComputedRef, Ref, unref } from "vue";
import { render, renderRowJSX } from "util/vue";
import ResourceVue from "features/resources/Resource.vue";
import Spacer from "components/layout/Spacer.vue";
import skyrmion from "../skyrmion/skyrmion";
import { createBuyable, GenericBuyable } from "features/buyable";
import { Computable, convertComputable, GetComputableType, processComputable, ProcessedComputable } from "util/computed";
import FomeVue from "./Fome.vue";
import { createUpgrade, GenericUpgrade } from "features/upgrades/upgrade";
import { createLazyProxy } from "util/proxies";
import { formatWhole } from "util/break_eternity";
import { createTabFamily } from "features/tabs/tabFamily";
import { createTab } from "features/tabs/tab";
import FomeBoostVue from "./FomeBoost.vue";
import { createAchievement, GenericAchievement } from "features/achievements/achievement";
import { addTooltip } from "features/tooltips/tooltip";

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
    const style = {
        "--bought": "#929aa9"
    };

    const unlocked: Ref<boolean> = skyrmion.skyrmionUpgrades.fome.bought;

    const amounts: Record<FomeTypes, Resource<DecimalSource>> = {
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

    const inflatonBonus = computed(() => {
        let bonus = Decimal.dOne;
        if (false) {
            if (false) bonus = bonus.times(1) // inflaton research 4
            if (false) bonus = bonus.times(1) // inflaton research 11
            if (false) bonus = bonus.times(1) // inflaton research 18
            bonus = bonus.times(1) // inflaton repeatable 115
        }
        return bonus.min(Decimal.dInf) // current inflaton nerf
    });

    const baseGenRate = computed(() =>
        Decimal.add(unref(skyrmion.skyrmions), getFomeBoost(FomeTypes.subspatial, 4))
            .divide(100)
            .times(unref(skyrmion.spinorUpgrades.eta.effect))
            .times(1) // acceleron fome boost
            .times(1) // acceleron upgrade 121
            .times(unref(inflatonBonus)) // inflaton bonus
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
        [FomeTypes.protoversal]: computed(() => new Decimal(unref(skyrmion.pionUpgrades.delta.effect)).times(unref(skyrmion.pionUpgrades.epsilon.effect)).times(unref(skyrmion.pionUpgrades.theta.effect)).times(1/* acceleron upgrade 11 */)),
        [FomeTypes.infinitesimal]: computed(() => new Decimal(unref(skyrmion.pionUpgrades.iota.effect)).times(unref(skyrmion.spinorUpgrades.epsilon.effect)).times(unref(skyrmion.spinorUpgrades.iota.effect)).times(1/* acceleron upgrade 11 */).times(1/* acceleron upgrade 131 */)),
        [FomeTypes.subspatial]: computed(() => new Decimal(unref(skyrmion.pionUpgrades.zeta.effect)).times(unref(skyrmion.spinorUpgrades.theta.effect)).times(1/* acceleron upgrade 11 */).times(1/* acceleron upgrade 23 */).times(1/* acceleron upgrade 132 */)),
        [FomeTypes.subplanck]: computed(() => new Decimal(1/* acceleron upgrade 133 */)),
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

        const delta = Decimal.times(diff, 1);
        Object.values(FomeTypes).forEach(type => {
            if (Decimal.gt(unref(reformUpgrades[type].amount), 0))
                amounts[type].value = unref(fomeRate[type]).times(delta).plus(unref(amounts[type])).max(0);
        });
    });

    const achievements: Record<FomeTypes | "reform", GenericAchievement & { tooltip: { requirement: JSX.Element, effectDisplay: JSX.Element } }> = {
        [FomeTypes.protoversal]: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 2) },
            tooltip: {
                requirement: <>Re-form your Protoversal Foam</>,
                effectDisplay: <>Unlock the Pion and Spinor Buy All button<br />Automatically enlarge your Protoversal Foam</>
            }
        })),
        [FomeTypes.infinitesimal]: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 3) },
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>3</sup></>,
                effectDisplay: <>Automatically enlarge your Infinitesimal Foam</>
            }
        })),
        [FomeTypes.subspatial]: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 4) },
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>4</sup></>,
                effectDisplay: <>Automatically enlarge your Subspatial Foam</>
            }
        })),
        [FomeTypes.subplanck]: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 5) },
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>5</sup></>,
                effectDisplay: <>Automatically enlarge your Subplanck Foam</>
            }
        })),
        [FomeTypes.quantum]: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(reformUpgrades.protoversal.amount), 6) },
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>6</sup></>,
                effectDisplay: <>Automatically enlarge your Quantum Foam</>
            }
        })),
        reform: createAchievement(() => ({
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
            Object.values(reformUpgrades).forEach(upgrade => upgrade.purchase());
        }
        Object.values(FomeTypes).forEach(type => {
            if (unref(achievements[type].earned)) {
                Object.values(dimUpgrades[type]).forEach(dim => dim.purchase());
            }
        });
    })

    const dimUpgrades: Record<FomeTypes, Record<FomeDims, GenericBuyable>> = {
        [FomeTypes.protoversal]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.protoversal, FomeDims.height, amount => Decimal.pow(4, Decimal.pow(amount, 1.15)).times(2)),
            [FomeDims.width]: createDimBuyable(FomeTypes.protoversal, FomeDims.width, amount => Decimal.pow(6, Decimal.pow(amount, 1.15)).times(5)),
            [FomeDims.depth]: createDimBuyable(FomeTypes.protoversal, FomeDims.depth, amount => Decimal.pow(8, Decimal.pow(amount, 1.15)).times(20))
        },
        [FomeTypes.infinitesimal]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.infinitesimal, FomeDims.height, amount => Decimal.pow(5, Decimal.pow(amount, 1.15)).times(6)),
            [FomeDims.width]: createDimBuyable(FomeTypes.infinitesimal, FomeDims.width, amount => Decimal.pow(7, Decimal.pow(amount, 1.15)).times(10)),
            [FomeDims.depth]: createDimBuyable(FomeTypes.infinitesimal, FomeDims.depth, amount => Decimal.pow(9, Decimal.pow(amount, 1.15)).times(25))
        },
        [FomeTypes.subspatial]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.subspatial, FomeDims.height, amount => Decimal.pow(6, Decimal.pow(amount, 1.15)).times(10)),
            [FomeDims.width]: createDimBuyable(FomeTypes.subspatial, FomeDims.width, amount => Decimal.pow(8, Decimal.pow(amount, 1.15)).times(18)),
            [FomeDims.depth]: createDimBuyable(FomeTypes.subspatial, FomeDims.depth, amount => Decimal.pow(10, Decimal.pow(amount, 1.15)).times(60))
        },
        [FomeTypes.subplanck]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.subplanck, FomeDims.height, amount => Decimal.pow(7, Decimal.pow(amount, 1.15)).times(15)),
            [FomeDims.width]: createDimBuyable(FomeTypes.subplanck, FomeDims.width, amount => Decimal.pow(9, Decimal.pow(amount, 1.15)).times(25)),
            [FomeDims.depth]: createDimBuyable(FomeTypes.subplanck, FomeDims.depth, amount => Decimal.pow(11, Decimal.pow(amount, 1.15)).times(90))
        },
        [FomeTypes.quantum]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.quantum, FomeDims.height, amount => Decimal.pow(8, Decimal.pow(amount, 1.15)).times(20)),
            [FomeDims.width]: createDimBuyable(FomeTypes.quantum, FomeDims.width, amount => Decimal.pow(10, Decimal.pow(amount, 1.15)).times(30)),
            [FomeDims.depth]: createDimBuyable(FomeTypes.quantum, FomeDims.depth, amount => Decimal.pow(12, Decimal.pow(amount, 1.15)).times(100))
        }
    };
    function createDimBuyable(type: FomeTypes, dim: FomeDims, cost: (amount: DecimalSource) => DecimalSource) {
        const display = dimBuyableDisplay(type, dim);
        return createBuyable(() => ({
            visibility() { return showIf(Decimal.gt(unref(reformUpgrades[type].amount), 0)) },
            resource: amounts[type],
            display: display,
            effect() { return Decimal.add(unref(this.amount), 1); },
            cost() { return cost(unref(this.amount)); },
            style() {
                const currentStyle: StyleValue = {
                    width: "100%",
                    minHeight: "100px"
                }
                if (unref(achievements[type].earned)) currentStyle.backgroundColor = "var(--bought)";
                return currentStyle;
            },
            onPurchase(cost?: DecimalSource) {
                const index = boosts[type].index;
                const boost = boosts[type][unref(index)].amount;
                boost.value = Decimal.add(unref(boost), 1);
                index.value = (unref(index) === 5 ? 1 : unref(index) + 1) as 1|2|3|4|5;
                if (unref(achievements[type].earned))
                    amounts[type].value = Decimal.add(unref(amounts[type]), cost ?? 0);
            }
        }));
    }
    function dimBuyableDisplay(type: FomeTypes, dim: FomeDims) {
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
                <b>Cost:</b>{" "}
                {format(unref((dimUpgrades[type][dim].cost as ProcessedComputable<DecimalSource>) || 0))}
            </>
        ));
    }

    const condenseUpgrades: Record<FomeTypes, GenericUpgrade> = {
        [FomeTypes.protoversal]: createUpgrade(() => ({
            visibility() { return showIf(!unref(this.bought)); },
            resource: amounts[FomeTypes.protoversal],
            display: { description: `Condense your ${amounts.protoversal.displayName}` },
            cost: 1e4,
            style: { width: "100%", minHeight: "100px" },
            onPurchase() { reformUpgrades.infinitesimal.amount.value = Decimal.dOne }
        })),
        [FomeTypes.infinitesimal]: createUpgrade(() => ({
            visibility() { return showIf(!unref(this.bought) && unref(condenseUpgrades.protoversal.bought)); },
            resource: amounts[FomeTypes.infinitesimal],
            display: { description: `Condense your ${amounts.infinitesimal.displayName}` },
            cost: 2e4,
            style: { width: "100%", minHeight: "100px" },
            onPurchase() { reformUpgrades.subspatial.amount.value = Decimal.dOne }
        })),
        [FomeTypes.subspatial]: createUpgrade(() => ({
            visibility() { return showIf(!unref(this.bought) && unref(condenseUpgrades.infinitesimal.bought)); },
            resource: amounts[FomeTypes.subspatial],
            display: { description: `Condense your ${amounts.subspatial.displayName}` },
            cost: 4e5,
            style: { width: "100%", minHeight: "100px" },
            onPurchase() { reformUpgrades.subplanck.amount.value = Decimal.dOne }
        })),
        [FomeTypes.subplanck]: createUpgrade(() => ({
            visibility() { return showIf(!unref(this.bought) && unref(condenseUpgrades.subspatial.bought)); },
            resource: amounts[FomeTypes.subplanck],
            display: { description: `Condense your ${amounts.subplanck.displayName}` },
            cost: 1e7,
            style: { width: "100%", minHeight: "100px" },
            onPurchase() { reformUpgrades.quantum.amount.value = Decimal.dOne }
        })),
        [FomeTypes.quantum]: createUpgrade(() => ({
            visibility() { return showIf(!unref(this.bought) && unref(condenseUpgrades.subplanck.bought)); },
            resource: amounts[FomeTypes.quantum],
            display: { description: `Condense your ${amounts.quantum.displayName}` },
            cost: 1e5,
            style: { width: "100%", minHeight: "100px" }
        }))
    };

    const reformCosts: Record<FomeTypes, (amount: Decimal) => Decimal> = {
        [FomeTypes.protoversal]: amount => amount.pow(amount.minus(3).max(2)).plus(1).times(4).pow10(),
        [FomeTypes.infinitesimal]: amount => amount.pow(amount.minus(2).max(2)).plus(1).times(5).pow10().dividedBy(5),
        [FomeTypes.subspatial]: amount => amount.pow(amount.minus(3).max(2)).plus(1).times(6).pow10().dividedBy(2.5),
        [FomeTypes.subplanck]: amount => amount.pow(amount.minus(3).max(2)).plus(1).times(7).pow10(),
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
    type ReformUpgrade = GenericBuyable & { requires: Ref<DecimalSource>};
    const reformUpgrades = Object.fromEntries(
        Object.values(FomeTypes).map(type => [
            type,
            createBuyable(() => ({
                visibility() { return showIf(unref(condenseUpgrades[type].bought)); },
                resource: amounts[type],
                display: jsx(() => {
                    const buyable = reformUpgrades[type];
                    const description = <>Re-form your {amounts[type].displayName}</>
                    const amountDisplay = <>Amount: {formatWhole(unref(buyable.amount))}</>
                    const requirementDisplay = <>Requires: {reformLimitResource[type].displayName}<sup>{formatWhole(unref(Decimal.add(unref(buyable.amount), 2)))}</sup></>
                    const costDisplay = <>Cost: {format(unref(buyable.cost ?? 0))} {buyable.resource?.displayName}</>
                    return (
                        <>
                            {description}
                            <div><br />
                            {amountDisplay}</div>
                            <div><br />
                            {Decimal.gte(unref(buyable.amount), unref(buyable.requires)) ? requirementDisplay : costDisplay}</div>
                        </>
                    );
                }),
                cost() { return reformCosts[type](new Decimal(unref(this.amount))); },
                requires: reformLimits[type],
                effect() { return Decimal.cbrt(unref(this.amount)); },
                canPurchase() {
                    return unref(this.visibility) === Visibility.Visible &&
                    unref(this.canAfford) &&
                    Decimal.lt(unref(this.amount), unref((this as ReformUpgrade).requires)) &&
                    Decimal.lt(unref(this.amount), unref(convertComputable(this.purchaseLimit)))
                },
                style: { width: "100%", minHeight: "100px" }
            }))
        ])
    ) as Record<FomeTypes, ReformUpgrade>;
    
    const boosts: Record<FomeTypes, { [key in 1|2|3|4|5]: GenericBoost } & { index: Persistent<1|2|3|4|5> }> = {
        [FomeTypes.protoversal]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.protoversal, 1,
                effect => `Multiply the generation of Protoversal Foam by ${format(effect)}`,
                total => total.times(1).plus(1).times(unref(skyrmion.pionUpgrades.kappa.effect)).times(unref(skyrmion.spinorUpgrades.delta.effect)),
                () => getFomeBoost(FomeTypes.protoversal, 5).plus(getFomeBoost(FomeTypes.subspatial, 3)).plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            2: createFomeBoost(FomeTypes.protoversal, 2,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade α levels`,
                total => total,
                () => getFomeBoost(FomeTypes.protoversal, 5).plus(getFomeBoost(FomeTypes.subspatial, 3)).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            3: createFomeBoost(FomeTypes.protoversal, 3,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade β levels`,
                total => Decimal.sqrt(total),
                () => getFomeBoost(FomeTypes.protoversal, 5).plus(getFomeBoost(FomeTypes.subspatial, 3)).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            4: createFomeBoost(FomeTypes.protoversal, 4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade γ levels`,
                total => total,
                () => getFomeBoost(FomeTypes.protoversal, 5).plus(getFomeBoost(FomeTypes.subspatial, 3)).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            5: createFomeBoost(FomeTypes.protoversal, 5,
                effect => `Add ${format(effect)} levels to all above boosts`,
                total => total.times(0.1),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            )
        },
        [FomeTypes.infinitesimal]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.infinitesimal, 1,
                effect => `Multiply the generation of Infinitesimal Foam by ${format(effect)}x`,
                total => total.times(1).plus(1).times(unref(skyrmion.pionUpgrades.lambda.effect)),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            2: createFomeBoost(FomeTypes.infinitesimal, 2,
                effect => `Increase Pion and Spinor gain by ${format(effect.minus(1).times(100))}%`,
                total => total.times(0.5).plus(1),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            3: createFomeBoost(FomeTypes.infinitesimal, 3,
                effect => `Reduce Pion and Spinor Upgrade α costs by ${format(Decimal.sub(1, effect).times(100))}%`,
                total => Decimal.pow(0.8, total),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            4: createFomeBoost(FomeTypes.infinitesimal, 4,
                effect => `Increase Skyrmion gain by ${format(effect.minus(1).times(100))}%`,
                total => total.times(0.5).plus(1),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            5: createFomeBoost(FomeTypes.infinitesimal, 5,
                effect => `Reduce Pion and Spinor Upgrade γ costs by ${format(Decimal.sub(1, effect).times(100))}%`,
                total => Decimal.pow(0.8, total),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            )
        },
        [FomeTypes.subspatial]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.subspatial, 1,
                effect => `Multiply the generation of Subspatial Foam by ${format(effect)}x`,
                total => total.times(1).plus(1).times(unref(skyrmion.spinorUpgrades.kappa.effect)),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            2: createFomeBoost(FomeTypes.subspatial, 2,
                effect => `The Pion and Spinor nerfs act as if you had ${format(effect)} fewer upgrades`,
                total => total,
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            3: createFomeBoost(FomeTypes.subspatial, 3,
                effect => `Add ${format(effect)} levels to all above boosts`,
                total => total.times(0.1),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            4: createFomeBoost(FomeTypes.subspatial, 4,
                effect => `Increase effective Skyrmion count by ${format(effect)}`,
                total => total,
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            5: createFomeBoost(FomeTypes.subspatial, 5,
                effect => `Pion and Spinor upgrades cost as if you had ${format(effect)} fewer`,
                total => total.times(0.25),
                () => getFomeBoost(FomeTypes.quantum, 5)
            )
        },
        [FomeTypes.subplanck]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.subplanck, 1,
                effect => `Multiply the generation of Subplanck Foam by ${format(effect)}x`,
                total => total.times(1).plus(1),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            2: createFomeBoost(FomeTypes.subplanck, 2,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade δ levels`,
                total => total.times(0.5),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            3: createFomeBoost(FomeTypes.subplanck, 3,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade ε levels`,
                total => total.times(0.5),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            4: createFomeBoost(FomeTypes.subplanck, 4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade ζ levels`,
                total => total.times(0.5),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            5: createFomeBoost(FomeTypes.subplanck, 5,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade η levels`,
                total => total.times(0.5),
                () => getFomeBoost(FomeTypes.quantum, 5)
            )
        },
        [FomeTypes.quantum]: {
            index: persistent<1|2|3|4|5>(1),
            1: createFomeBoost(FomeTypes.quantum, 1,
                effect => `Multiply the generation of all Foam types by ${format(effect)}x`,
                total => total.times(1).plus(1),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            2: createFomeBoost(FomeTypes.quantum, 2,
                effect => `Reduce the Pion and Spinor cost nerf exponent by ${format(Decimal.sub(1, effect).times(100))}%`,
                total => Decimal.pow(0.975, total.gt(16) ? total.ln().times(Decimal.ln(2).recip().times(4)) : total),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            3: createFomeBoost(FomeTypes.quantum, 3,
                effect => `Multiply the generation of all Foam types again by ${format(effect)}x`,
                total => (total.gt(16) ? total.sqrt().times(4) : total).times(getFomeBoost(FomeTypes.quantum, 1).dividedBy(10)).plus(1),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            4: createFomeBoost(FomeTypes.quantum, 4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade θ, ι, and κ levels`,
                total => total.times(0.25),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            5: createFomeBoost(FomeTypes.quantum, 5,
                effect => `Add ${format(effect)} levels to all above boosts`,
                total => total.times(0.1),
                () => 0
            )
        }
    };
    function getFomeBoost(type: FomeTypes, index: 1 | 2 | 3 | 4 | 5) {
        return unref(boosts[type][index].effect);
    }

    const treeNode = createLayerTreeNode(() => ({
        display: "F",
        layerID: id,
        color: color
    }));

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
                        <Spacer />
                        <FomeVue />
                        <Spacer height="8px" />
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
        milestones: achievements,
        boosts,
        getFomeBoost,
        display: jsx(() => (
            <>
                {unref(boosts.protoversal[1].amount) === 0
                    ? render(unref(tabs.tabs.main.tab))
                    : render(tabs)}
            </>
        )),
        style,
        tabs,
        treeNode,
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
        return createLazyProxy(persistent => {
            const boost = Object.assign(persistent, optionsFunc());

            boost.id = getUniqueID("boost-");
            boost.type = BoostType;
            boost.amount = boost[PersistentState];

            processComputable(boost as T, "display");
            processComputable(boost as T, "effect");
            processComputable(boost as T, "bonus");

            return boost as unknown as Boost<T>;
        }, persistent<DecimalSource>(0));
    }
});

export default layer;
