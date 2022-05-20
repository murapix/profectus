import {
    CoercableComponent,
    getUniqueID,
    jsx,
    OptionsFunc,
    Replace,
    showIf
} from "features/feature";
import { createResource, Resource } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource, format } from "util/bignum";
import { Persistent, persistent, PersistentState } from "game/persistence";
import { createLayerTreeNode } from "data/common";
import { computed, ComputedRef, Ref, unref } from "vue";
import { render } from "util/vue";
import ResourceVue from "features/resources/Resource.vue";
import Spacer from "components/layout/Spacer.vue";
import skyrmion from "./skyrmion";
import { createBuyable, GenericBuyable } from "features/buyable";
import {
    Computable,
    GetComputableType,
    processComputable,
    ProcessedComputable
} from "util/computed";
import FomeVue from "./Fome.vue";
import { createUpgrade, GenericUpgrade } from "features/upgrades/upgrade";
import { createLazyProxy } from "util/proxies";
import { formatWhole } from "util/break_eternity";
import { createTabFamily } from "features/tabs/tabFamily";
import { createTab } from "features/tabs/tab";
import FomeBoostVue from "./FomeBoost.vue";
import { globalBus } from "game/events";

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
const layer = createLayer(id, () => {
    const BoostType = Symbol("Boost");

    const name = "Quantum Foam";
    const color = "#ffffff";

    const amounts: Record<FomeTypes, Resource<DecimalSource>> = {
        [FomeTypes.protoversal]: createResource<DecimalSource>(0, "Protoversal Foam"),
        [FomeTypes.infinitesimal]: createResource<DecimalSource>(0, "Infinitesimal Foam"),
        [FomeTypes.subspatial]: createResource<DecimalSource>(0, "Subspatial Foam"),
        [FomeTypes.subplanck]: createResource<DecimalSource>(0, "Subplanck Foam"),
        [FomeTypes.quantum]: createResource<DecimalSource>(0, "Quantum Foam")
    };
    const expansions: Record<FomeTypes, Persistent<number>> = {
        [FomeTypes.protoversal]: persistent<number>(1),
        [FomeTypes.infinitesimal]: persistent<number>(0),
        [FomeTypes.subspatial]: persistent<number>(0),
        [FomeTypes.subplanck]: persistent<number>(0),
        [FomeTypes.quantum]: persistent<number>(0)
    };

    const highestFome = computed(() => {
        if (expansions.quantum.value > 0) return FomeTypes.quantum;
        else if (expansions.subplanck.value > 0) return FomeTypes.subplanck;
        else if (expansions.subspatial.value > 0) return FomeTypes.subspatial;
        else if (expansions.infinitesimal.value > 0) return FomeTypes.infinitesimal;
        else return FomeTypes.protoversal;
    });

    const baseGenRate = computed(() =>
        Decimal.divide(skyrmion.skyrmions.value, 100)
            .times(1)
            .times(1)
            .times(1)
            .times(1)
            .times(1)
            .times(getFomeBoost(FomeTypes.quantum, 1))
            .times(getFomeBoost(FomeTypes.quantum, 3))
    );
    const enlargeMulti = Object.fromEntries(
        Object.values(FomeTypes).map(type => [
            type,
            computed(() =>
                Object.values(dimUpgrades[type])
                    .map(upgrade => unref(upgrade.effect))
                    .reduce((a, b) => a.times(b))
            )
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
        [FomeTypes.protoversal]: computed(() => new Decimal(1).times(1).times(1).times(1)),
        [FomeTypes.infinitesimal]: computed(() =>
            new Decimal(1).times(1).times(1).times(1).times(1)
        ),
        [FomeTypes.subspatial]: computed(() => new Decimal(1).times(1).times(1).times(1).times(1)),
        [FomeTypes.subplanck]: computed(() => new Decimal(1)),
        [FomeTypes.quantum]: computed(() => Decimal.dOne)
    };
    const fomeRate = Object.fromEntries(
        Object.values(FomeTypes).map(type => [
            type,
            computed(() =>
                baseGenRate.value
                    .times(enlargeMulti[type].value)
                    .times(miscMulti[type].value)
                    .pow(Decimal.cbrt(expansions[type].value))
            )
        ])
    ) as Record<FomeTypes, ComputedRef<Decimal>>;
    globalBus.on("update", (diff: number) => {
        const delta = Decimal.times(diff, 1);
        Object.values(FomeTypes).forEach(type => {
            if (expansions[type].value > 0)
                amounts[type].value = fomeRate[type].value
                    .times(delta)
                    .plus(amounts[type].value)
                    .max(0);
        });
    });

    const dimUpgrades: Record<FomeTypes, Record<FomeDims, GenericBuyable>> = {
        [FomeTypes.protoversal]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.protoversal, FomeDims.height, amount =>
                Decimal.pow(4, Decimal.pow(amount, 1.15)).times(2)
            ),
            [FomeDims.width]: createDimBuyable(FomeTypes.protoversal, FomeDims.width, amount =>
                Decimal.pow(6, Decimal.pow(amount, 1.15)).times(5)
            ),
            [FomeDims.depth]: createDimBuyable(FomeTypes.protoversal, FomeDims.depth, amount =>
                Decimal.pow(8, Decimal.pow(amount, 1.15)).times(20)
            )
        },
        [FomeTypes.infinitesimal]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.infinitesimal, FomeDims.height, amount =>
                Decimal.pow(5, Decimal.pow(amount, 1.15)).times(6)
            ),
            [FomeDims.width]: createDimBuyable(FomeTypes.infinitesimal, FomeDims.width, amount =>
                Decimal.pow(7, Decimal.pow(amount, 1.15)).times(10)
            ),
            [FomeDims.depth]: createDimBuyable(FomeTypes.infinitesimal, FomeDims.depth, amount =>
                Decimal.pow(9, Decimal.pow(amount, 1.15)).times(25)
            )
        },
        [FomeTypes.subspatial]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.subspatial, FomeDims.height, amount =>
                Decimal.pow(6, Decimal.pow(amount, 1.15)).times(10)
            ),
            [FomeDims.width]: createDimBuyable(FomeTypes.subspatial, FomeDims.width, amount =>
                Decimal.pow(8, Decimal.pow(amount, 1.15)).times(18)
            ),
            [FomeDims.depth]: createDimBuyable(FomeTypes.subspatial, FomeDims.depth, amount =>
                Decimal.pow(10, Decimal.pow(amount, 1.15)).times(60)
            )
        },
        [FomeTypes.subplanck]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.subplanck, FomeDims.height, amount =>
                Decimal.pow(7, Decimal.pow(amount, 1.15)).times(15)
            ),
            [FomeDims.width]: createDimBuyable(FomeTypes.subplanck, FomeDims.width, amount =>
                Decimal.pow(9, Decimal.pow(amount, 1.15)).times(25)
            ),
            [FomeDims.depth]: createDimBuyable(FomeTypes.subplanck, FomeDims.depth, amount =>
                Decimal.pow(11, Decimal.pow(amount, 1.15)).times(90)
            )
        },
        [FomeTypes.quantum]: {
            [FomeDims.height]: createDimBuyable(FomeTypes.quantum, FomeDims.height, amount =>
                Decimal.pow(8, Decimal.pow(amount, 1.15)).times(20)
            ),
            [FomeDims.width]: createDimBuyable(FomeTypes.quantum, FomeDims.width, amount =>
                Decimal.pow(10, Decimal.pow(amount, 1.15)).times(30)
            ),
            [FomeDims.depth]: createDimBuyable(FomeTypes.quantum, FomeDims.depth, amount =>
                Decimal.pow(12, Decimal.pow(amount, 1.15)).times(100)
            )
        }
    };
    function createDimBuyable(
        type: FomeTypes,
        dim: FomeDims,
        cost: (amount: DecimalSource) => DecimalSource
    ) {
        const display = dimBuyableDisplay(type, dim);
        return createBuyable(() => ({
            visibility() {
                return showIf(unref(expansions[type]) > 0);
            },
            resource: amounts[type],
            display: display,
            effect() {
                return Decimal.add(this.amount.value, 1);
            },
            cost() {
                return cost(this.amount.value);
            },
            style: {
                width: "100%",
                "min-height": "100px"
            },
            onPurchase() {
                const index = boosts[type].index;
                const boost = boosts[type][index.value].amount;
                boost.value = Decimal.add(boost.value, 1);
                index.value = (index.value === 5 ? 1 : index.value + 1) as 1 | 2 | 3 | 4 | 5;
            }
        }));
    }
    function dimBuyableDisplay(type: FomeTypes, dim: FomeDims) {
        let dimName: string;
        switch (dim) {
            case FomeDims.height:
                dimName = "Height";
                break;
            case FomeDims.width:
                dimName = "Width";
                break;
            case FomeDims.depth:
                dimName = "Depth";
                break;
        }
        return jsx(() => (
            <>
                <h3>
                    Enlarge {amounts[type].displayName} {dimName} by 1m
                </h3>
                <br />
                <br />
                <b>Current {dimName}:</b> {format(dimUpgrades[type][dim].amount.value)}m
                <br />
                <br />
                <b>Cost:</b>{" "}
                {format(
                    unref((dimUpgrades[type][dim].cost as ProcessedComputable<DecimalSource>) || 0)
                )}
            </>
        ));
    }

    const condenseUpgrades: Record<FomeTypes, GenericUpgrade> = {
        [FomeTypes.protoversal]: createUpgrade(() => ({
            visibility() {
                return showIf(
                    unref(expansions.infinitesimal) === 0 && unref(expansions.protoversal) > 0
                );
            },
            resource: amounts[FomeTypes.protoversal],
            display: { description: `Condense your ${amounts.protoversal.displayName}` },
            cost: 1e4,
            style: { width: "100%", "min-height": "100px" },
            onPurchase() {
                expansions.infinitesimal.value = 1;
            }
        })),
        [FomeTypes.infinitesimal]: createUpgrade(() => ({
            visibility() {
                return showIf(
                    unref(expansions.subspatial) === 0 && unref(expansions.infinitesimal) > 0
                );
            },
            resource: amounts[FomeTypes.infinitesimal],
            display: { description: `Condense your ${amounts.infinitesimal.displayName}` },
            cost: 2e4,
            style: { width: "100%", "min-height": "100px" },
            onPurchase() {
                expansions.subspatial.value = 1;
            }
        })),
        [FomeTypes.subspatial]: createUpgrade(() => ({
            visibility() {
                return showIf(
                    unref(expansions.subplanck) === 0 && unref(expansions.subspatial) > 0
                );
            },
            resource: amounts[FomeTypes.subspatial],
            display: { description: `Condense your ${amounts.subspatial.displayName}` },
            cost: 4e5,
            style: { width: "100%", "min-height": "100px" },
            onPurchase() {
                expansions.subplanck.value = 1;
            }
        })),
        [FomeTypes.subplanck]: createUpgrade(() => ({
            visibility() {
                return showIf(unref(expansions.quantum) === 0 && unref(expansions.subplanck) > 0);
            },
            resource: amounts[FomeTypes.subplanck],
            display: { description: `Condense your ${amounts.subplanck.displayName}` },
            cost: 1e7,
            style: { width: "100%", "min-height": "100px" },
            onPurchase() {
                expansions.quantum.value = 1;
            }
        })),
        [FomeTypes.quantum]: createUpgrade(() => ({
            visibility() {
                return showIf(!unref(this.bought) && unref(expansions.quantum) > 0);
            },
            resource: amounts[FomeTypes.quantum],
            display: { description: `Condense your ${amounts.quantum.displayName}` },
            cost: 1e5,
            style: { width: "100%", "min-height": "100px" },
            onPurchase() {
                expansions.quantum.value = new Decimal(expansions.quantum.value).toNumber();
            }
        }))
    };

    const reformUpgrades: Record<FomeTypes, GenericBuyable> = {
        [FomeTypes.protoversal]: createBuyable(() => ({
            visibility() {
                return showIf(unref(expansions[FomeTypes.infinitesimal]) > 0);
            },
            resource: amounts[FomeTypes.protoversal],
            display: { description: `Re-form your ${amounts[FomeTypes.protoversal].displayName}` },
            cost() {
                let amount = Decimal.add(this.amount.value, 1);
                amount = amount.pow(amount.minus(3).max(2));
                return amount.plus(1).times(4).pow10();
            },
            style: { width: "100%", "min-height": "100px" }
        })),
        [FomeTypes.infinitesimal]: createBuyable(() => ({
            visibility() {
                return showIf(unref(expansions[FomeTypes.subspatial]) > 0);
            },
            resource: amounts[FomeTypes.infinitesimal],
            display: {
                description: `Re-form your ${amounts[FomeTypes.infinitesimal].displayName}`
            },
            cost() {
                let amount = Decimal.add(this.amount.value, 1);
                amount = amount.pow(amount.minus(2).max(2));
                return amount.plus(1).times(5).pow10().dividedBy(5);
            },
            style: { width: "100%", "min-height": "100px" }
        })),
        [FomeTypes.subspatial]: createBuyable(() => ({
            visibility() {
                return showIf(unref(expansions[FomeTypes.subplanck]) > 0);
            },
            resource: amounts[FomeTypes.subspatial],
            display: { description: `Re-form your ${amounts[FomeTypes.subspatial].displayName}` },
            cost() {
                let amount = Decimal.add(this.amount.value, 1);
                amount = amount.pow(amount.minus(3).max(2));
                return amount.plus(1).times(6).pow10().dividedBy(2.5);
            },
            style: { width: "100%", "min-height": "100px" }
        })),
        [FomeTypes.subplanck]: createBuyable(() => ({
            visibility() {
                return showIf(unref(expansions[FomeTypes.quantum]) > 0);
            },
            resource: amounts[FomeTypes.subplanck],
            display: { description: `Re-form your ${amounts[FomeTypes.subplanck].displayName}` },
            cost() {
                let amount = Decimal.add(this.amount.value, 1);
                amount = amount.pow(amount.minus(3).max(2));
                return amount.plus(1).times(7).pow10();
            },
            style: { width: "100%", "min-height": "100px" }
        })),
        [FomeTypes.quantum]: createBuyable(() => ({
            visibility() {
                return showIf(unref(condenseUpgrades.quantum.bought));
            },
            resource: amounts[FomeTypes.quantum],
            display: { description: `Re-form your ${amounts[FomeTypes.quantum].displayName}` },
            cost() {
                let amount = Decimal.add(this.amount.value, 1);
                amount = amount.pow(amount.minus(3).max(2));
                return amount.plus(1).times(4).pow10();
            },
            style: { width: "100%", "min-height": "100px" }
        }))
    };

    const boosts: Record<
        FomeTypes,
        {
            index: Persistent<1 | 2 | 3 | 4 | 5>;
            1: GenericBoost;
            2: GenericBoost;
            3: GenericBoost;
            4: GenericBoost;
            5: GenericBoost;
        }
    > = {
        [FomeTypes.protoversal]: {
            index: persistent<1 | 2 | 3 | 4 | 5>(1),
            1: createFomeBoost(
                FomeTypes.protoversal,
                1,
                effect => `Multiply the generation of Protoversal Foam by ${format(effect)}`,
                total => total.times(1).plus(1),
                () =>
                    getFomeBoost(FomeTypes.protoversal, 5)
                        .plus(getFomeBoost(FomeTypes.subspatial, 3))
                        .plus(getFomeBoost(FomeTypes.quantum, 5))
            ),
            2: createFomeBoost(
                FomeTypes.protoversal,
                2,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade α levels`,
                total => total,
                () =>
                    getFomeBoost(FomeTypes.protoversal, 5)
                        .plus(getFomeBoost(FomeTypes.subspatial, 3))
                        .add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            3: createFomeBoost(
                FomeTypes.protoversal,
                3,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade β levels`,
                total => Decimal.sqrt(total),
                () =>
                    getFomeBoost(FomeTypes.protoversal, 5)
                        .plus(getFomeBoost(FomeTypes.subspatial, 3))
                        .add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            4: createFomeBoost(
                FomeTypes.protoversal,
                4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade γ levels`,
                total => total,
                () =>
                    getFomeBoost(FomeTypes.protoversal, 5)
                        .plus(getFomeBoost(FomeTypes.subspatial, 3))
                        .add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            5: createFomeBoost(
                FomeTypes.protoversal,
                5,
                effect => `Add ${format(effect)} levels to all above boosts`,
                total => total.times(0.1),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            )
        },
        [FomeTypes.infinitesimal]: {
            index: persistent<1 | 2 | 3 | 4 | 5>(1),
            1: createFomeBoost(
                FomeTypes.infinitesimal,
                1,
                effect => `Multiply the generation of Infinitesimal Foam by ${format(effect)}x`,
                total => total.times(1).plus(1),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            2: createFomeBoost(
                FomeTypes.infinitesimal,
                2,
                effect => `Increase Pion and Spinor gain by ${format(effect.minus(1).times(100))}%`,
                total => total.times(0.5).plus(1),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            3: createFomeBoost(
                FomeTypes.infinitesimal,
                3,
                effect =>
                    `Reduce Pion and Spinor Upgrade α costs by ${format(
                        Decimal.sub(1, effect).times(100)
                    )}%`,
                total => Decimal.pow(0.8, total),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            4: createFomeBoost(
                FomeTypes.infinitesimal,
                4,
                effect => `Increase Skyrmion gain by ${format(effect.minus(1).times(100))}%`,
                total => total.times(0.5).plus(1),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            5: createFomeBoost(
                FomeTypes.infinitesimal,
                5,
                effect =>
                    `Reduce Pion and Spinor Upgrade γ costs by ${format(
                        Decimal.sub(1, effect).times(100)
                    )}%`,
                total => Decimal.pow(0.8, total),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            )
        },
        [FomeTypes.subspatial]: {
            index: persistent<1 | 2 | 3 | 4 | 5>(1),
            1: createFomeBoost(
                FomeTypes.subspatial,
                1,
                effect => `Multiply the generation of Subspatial Foam by ${format(effect)}x`,
                total => total.times(1).plus(1),
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            2: createFomeBoost(
                FomeTypes.subspatial,
                2,
                effect =>
                    `The Pion and Spinor nerfs act as if you had ${format(effect)} fewer upgrades`,
                total => total,
                () => getFomeBoost(FomeTypes.subspatial, 3).add(getFomeBoost(FomeTypes.quantum, 5))
            ),
            3: createFomeBoost(
                FomeTypes.subspatial,
                3,
                effect => `Add ${format(effect)} levels to all above boosts`,
                total => total.times(0.1),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            4: createFomeBoost(
                FomeTypes.subspatial,
                4,
                effect => `Increase effective Skyrmion count by ${format(effect)}`,
                total => total,
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            5: createFomeBoost(
                FomeTypes.subspatial,
                5,
                effect => `Pion and Spinor upgrades cost as if you had ${format(effect)} fewer`,
                total => total.times(0.25),
                () => getFomeBoost(FomeTypes.quantum, 5)
            )
        },
        [FomeTypes.subplanck]: {
            index: persistent<1 | 2 | 3 | 4 | 5>(1),
            1: createFomeBoost(
                FomeTypes.subplanck,
                1,
                effect => `Multiply the generation of Subplanck Foam by ${format(effect)}x`,
                total => total.times(1).plus(1),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            2: createFomeBoost(
                FomeTypes.subplanck,
                2,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade δ levels`,
                total => total.times(0.5),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            3: createFomeBoost(
                FomeTypes.subplanck,
                3,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade ε levels`,
                total => total.times(0.5),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            4: createFomeBoost(
                FomeTypes.subplanck,
                4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade ζ levels`,
                total => total.times(0.5),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            5: createFomeBoost(
                FomeTypes.subplanck,
                5,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade η levels`,
                total => total.times(0.5),
                () => getFomeBoost(FomeTypes.quantum, 5)
            )
        },
        [FomeTypes.quantum]: {
            index: persistent<1 | 2 | 3 | 4 | 5>(1),
            1: createFomeBoost(
                FomeTypes.quantum,
                1,
                effect => `Multiply the generation of all Foam types by ${format(effect)}x`,
                total => total.times(1).plus(1),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            2: createFomeBoost(
                FomeTypes.quantum,
                2,
                effect =>
                    `Reduce the Pion and Spinor cost nerf exponent by ${format(
                        Decimal.sub(1, effect).times(100)
                    )}%`,
                total =>
                    Decimal.pow(
                        0.975,
                        total.gt(16) ? total.ln().times(Decimal.ln(2).recip().times(4)) : total
                    ),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            3: createFomeBoost(
                FomeTypes.quantum,
                3,
                effect => `Multiply the generation of all Foam types again by ${format(effect)}x`,
                total =>
                    (total.gt(16) ? total.sqrt().times(4) : total)
                        .times(getFomeBoost(FomeTypes.quantum, 1).dividedBy(10))
                        .plus(1),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            4: createFomeBoost(
                FomeTypes.quantum,
                4,
                effect => `Gain ${format(effect)} bonus Pion and Spinor Upgrade θ, ι, and κ levels`,
                total => total.times(0.25),
                () => getFomeBoost(FomeTypes.quantum, 5)
            ),
            5: createFomeBoost(
                FomeTypes.quantum,
                5,
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
                            <ResourceVue resource={amounts[highestFome.value]} color={color} />{" "}
                            {amounts[highestFome.value].displayName}
                            {expansions[highestFome.value].value > 1 ? (
                                <sup>{expansions[highestFome.value].value}</sup>
                            ) : null}
                        </div>
                        <Spacer />
                        <FomeVue />
                    </>
                ))
            }))
        }),
        boosts: () => ({
            display: "Boosts",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        <FomeBoostVue />
                    </>
                ))
            }))
        })
    });

    return {
        name,
        color,
        amounts,
        expansions,
        rates: fomeRate,
        dimUpgrades,
        condenseUpgrades,
        reformUpgrades,
        boosts,
        getFomeBoost,
        display: jsx(() => (
            <>
                {unref(boosts.protoversal[1].amount) === 0
                    ? render(unref(tabs.tabs.main.tab))
                    : render(tabs)}
            </>
        )),
        tabs,
        treeNode
    };

    interface BoostOptions {
        display: Computable<CoercableComponent>;
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
            display: Ref<string>;
            effect: GetComputableType<T["effect"]>;
            bonus: GetComputableType<T["bonus"]>;
        }
    >;

    type GenericBoost = Boost<BoostOptions>;

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
                    return `${amounts[type].displayName.split(" ")[0]} Boost ${index} [${amount}${
                        bonus > 0 ? ` ${formatWhole(bonus)}` : ``
                    }]: ${display(unref(boosts[type][index].effect))}`;
                return "";
            },
            effect() {
                return effect(Decimal.add(unref(this.amount), unref(this.bonus)));
            },
            bonus: bonus
        }));
    }

    function createBoost<T extends BoostOptions>(
        optionsFunc: OptionsFunc<T, Boost<T>, BaseBoost>
    ): Boost<T> {
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
