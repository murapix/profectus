import {
    createExponentialScaling,
    createIndependentConversion,
    GenericConversion
} from "features/conversion";
import { CoercableComponent, jsx, Replace, showIf, Visibility } from "features/feature";
import { createReset } from "features/reset";
import { createResource, displayResource, Resource } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall } from "util/break_eternity";
import { coerceComponent, render, renderRow } from "util/vue";
import { computed, unref } from "vue";
import { createLayerTreeNode, createResetButton } from "../common";
import { main } from "../projEntry";
import MainDisplay from "features/resources/MainDisplay.vue";
import Spacer from "components/layout/Spacer.vue";
import { globalBus } from "game/events";
import { createBuyable, Buyable, BuyableOptions } from "features/buyable";
import { Computable, GetComputableType, GetComputableTypeWithDefault } from "util/computed";
import { createUpgrade, Upgrade, UpgradeOptions } from "features/upgrades/upgrade";
import Tooltip from "components/Tooltip.vue";
import Skyrmion from "./Skyrmion.vue";

const layer = createLayer(() => {
    const id = "skyrmion";
    const name = "Skyrmion";
    const color = "#37d7ff";

    const skyrmions = createResource<DecimalSource>(1, "Skyrmions");
    const pions = createResource<DecimalSource>(0, "Pions");
    const spinors = createResource<DecimalSource>(0, "Spinors");

    const totalSkyrmions = computed(() => Decimal.add(skyrmions.value, 0));
    const genRate = computed(() => {
        // eslint-disable-next-line
        let rate = totalSkyrmions.value
        return rate;
    });
    globalBus.on("update", diff => {
        pions.value = Decimal.times(genRate.value, diff).plus(pions.value);
        spinors.value = Decimal.times(genRate.value, diff).plus(spinors.value);
    });

    const minAmount = computed(() => Decimal.min(pions.value, spinors.value));
    const minResource = createResource<DecimalSource>(minAmount, "Pions and Spinors");

    const conversion = createIndependentConversion(() => ({
        scaling: createExponentialScaling(10, 1),
        baseResource: minResource,
        gainResource: skyrmions,
        buyMax: false,
        convert() {
            conversion.gainResource.value = unref((conversion as GenericConversion).currentGain);
            const cost = Decimal.div(conversion.nextAt.value, 10);
            pions.value = Decimal.sub(pions.value, cost);
            spinors.value = Decimal.sub(spinors.value, cost);
        }
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => []
    }));

    const skyrmionUpgrades = {
        fome: createSkyrmionUpgrade({
            display: {
                title: "Condensation",
                description: "Begin Foam generation"
            },
            cost: 10
        }),
        autoGain: createSkyrmionUpgrade({
            display: {
                title: "Reformation",
                description: `Automatically gain Skyrmions; they don't cost Pions or Spinors`
            },
            cost: 16
        }),
        alpha: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 20),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Alteration",
                description: "Autobuy α upgrades. α upgrades no longer consume Pions or Spinors"
            },
            cost: 24
        }),
        beta: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 25),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Benediction",
                description: "Autobuy β upgrades. β upgrades no longer consume Pions or Spinors"
            },
            cost: 28
        }),
        gamma: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 30),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Consolidation",
                description: "Autobuy γ upgrades. γ upgrades no longer consume Pions or Spinors"
            },
            cost: 32
        }),
        delta: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 35),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Diversification",
                description: "Autobuy δ upgrades. δ upgrades no longer consume Pions or Spinors"
            },
            cost: 36
        }),
        epsilon: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 40),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Encapsulation",
                description: "Autobuy ε upgrades. ε upgrades no longer consume Pions or Spinors"
            },
            cost: 42
        }),
        zeta: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 45),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Fabrication",
                description: "Autobuy ζ upgrades. ζ upgrades no longer consume Pions or Spinors"
            },
            cost: 48
        }),
        eta: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 50),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Germination",
                description: "Autobuy η upgrades. η upgrades no longer consume Pions or Spinors"
            },
            cost: 52
        }),
        theta: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 55),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Hesitation",
                description: "Autobuy θ upgrades. θ upgrades no longer consume Pions or Spinors"
            },
            cost: 56
        }),
        iota: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 60),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Immitation",
                description: "Autobuy ι upgrades. ι upgrades no longer consume Pions or Spinors"
            },
            cost: 64
        }),
        kappa: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 65),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Juxtaposition",
                description: "Autobuy κ upgrades. κ upgrades no longer consume Pions or Spinors"
            },
            cost: 69
        }),
        lambda: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 70),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Lateralization",
                description: "Autobuy λ upgrades. λ upgrades no longer consume Pions or Spinors"
            },
            cost: 72
        }),
        mu: createSkyrmionUpgrade({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 75),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Materialization",
                description: "Autobuy μ upgrades. μ upgrades no longer consume Pions or Spinors"
            },
            cost: 92
        }),
        nu: createUpgrade(() => ({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 80),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Neutralization",
                description: "Autobuy ν upgrades. ν upgrades no longer consume Pions or Spinors"
            },
            style: {
                "clip-path": "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
                border: 0
            }
        })),
        xi: createUpgrade(() => ({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 85),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Externalization",
                description: "Autobuy ξ upgrades. ξ upgrades no longer consume Pions or Spinors"
            },
            style: {
                "clip-path": "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
                border: 0
            }
        })),
        pi: createUpgrade(() => ({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 90),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Prioritization",
                description: "Autobuy π upgrades. π upgrades no longer consume Pions or Spinors"
            },
            style: {
                "clip-path": "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
                border: 0
            }
        })),
        rho: createUpgrade(() => ({
            visibility() {
                return showIf(
                    this.bought.value || Decimal.gte(skyrmions.value, 95),
                    Visibility.Hidden
                );
            },
            display: {
                title: "Obfuscation",
                description: "Autobuy ρ upgrades. ρ upgrades no longer consume Pions or Spinors"
            },
            style: {
                "clip-path": "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
                border: 0
            }
        }))
    };

    const pionUpgrades = {
        amount: createResource<DecimalSource>(0, "Pion Upgrades"),
        alpha: createPionUpgrade({
            name: "α",
            cost(amount) {
                let cost: Decimal;
                if (Decimal.gte(amount, 90)) cost = Decimal.pow(187.5, amount).times(2.65e77);
                else if (Decimal.gte(amount, 25)) cost = Decimal.pow(9.5, amount).times(9.5);
                else cost = Decimal.pow(1.2, amount).times(0.1e2);
                return cost;
            },
            effect(amount) {
                return Decimal.pow(1.5, amount);
            },
            costModifier(cost) {
                return cost;
            }, //.times(fomeEffect(protoversal[1])) }
            bonusAmount() {
                return 0; /*fomeEffect(protoversal, 1)*/
            },
            isFree: skyrmionUpgrades.alpha.bought
        }),
        beta: createPionUpgrade({
            name: "β",
            cost(amount: DecimalSource) {
                let cost: Decimal;
                if (Decimal.gte(amount, 45)) cost = Decimal.pow(292.5, amount).times(3.01e39);
                else if (Decimal.gte(amount, 15)) cost = Decimal.pow(10, amount).times(6);
                else cost = Decimal.pow(1.3, amount).times(0.1);
                return cost;
            },
            effect(amount) {
                return Decimal.pow(0.9, amount);
            },
            effectDisplay(effect) {
                return `Spinor upgrade cost nerf reduced to ${formatSmall(
                    Decimal.times(effect, 100)
                )}%`;
            },
            costModifier(cost) {
                return Decimal.add(cost, 0.9);
            },
            bonusAmount() {
                return 0; /*fomeEffect(protoversal, 2)*/
            },
            isFree: skyrmionUpgrades.alpha.bought
        })
    };

    const spinorUpgrades = {
        amount: createResource<DecimalSource>(0, "Spinor Upgrades")
    };

    const treeNode = createLayerTreeNode(() => ({
        display: "S",
        layerID: id,
        color,
        reset
    }));

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    return {
        id,
        name,
        color,
        skyrmions,
        pions,
        spinors,
        display: jsx(() => (
            <>
                <MainDisplay resource={skyrmions} color={color} />
                <div v-show={false}>
                    Your Subspatial Foam is granting an additional{" "}
                    <span color={color}>{format(3)}</span> Skyrmions
                </div>
                {render(resetButton)}
                <Spacer />
                <Skyrmion upgrades={Object.values(skyrmionUpgrades)} />
                <Spacer />
                <div>
                    You have <span color={color}>{format(pions.value)}</span> Pions
                </div>
                <Spacer />
                <div>
                    You have <span color={color}>{format(spinors.value)}</span> Spinors
                </div>
                <Spacer />
            </>
        )),
        treeNode
    };

    interface SkyrmionUpgradeData {
        [key: string]: any;
        visibility?: Computable<Visibility>;
        display: {
            title: string;
            description: string;
        };
        cost: DecimalSource;
    }

    function createSkyrmionUpgrade(data: SkyrmionUpgradeData) {
        return createUpgrade(
            () =>
                ({
                    visibility: data.visibility,
                    tooltip: jsx(() => (
                        <>
                            {coerceComponent(data.display.description)}
                            <Spacer />
                            Requires: {displayResource(skyrmions, data.cost)}{" "}
                            {skyrmions.displayName}
                        </>
                    )),
                    display: data.display.title,
                    onPurchase() {
                        if (this.resource && this.cost)
                            this.resource.value = Decimal.add(
                                this.resource.value,
                                unref(this.cost)
                            );
                    },
                    resource: skyrmions,
                    cost: data.cost,
                    style: {
                        "clip-path":
                            "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
                        border: 0
                    }
                } as Upgrade<UpgradeOptions>)
        );
    }

    interface SkyrmionBuyableData {
        name: string;
        cost: (amount: DecimalSource) => DecimalSource;
        effect: (amount: DecimalSource) => any;
        effectDisplay?: (effect: any) => CoercableComponent;
        isFree: Computable<boolean>;
        bonusAmount?: Computable<DecimalSource>;
        visibility?: Computable<Visibility>;
        costModifier?: (cost: DecimalSource) => DecimalSource;
    }

    interface SkyrmionBuyableOptions extends BuyableOptions {
        effect?: Computable<any>;
        bonusAmount?: Computable<DecimalSource>;
    }

    type SkyrmionBuyable = Replace<
        SkyrmionBuyableOptions & Buyable<SkyrmionBuyableOptions>,
        {
            effect: GetComputableType<SkyrmionBuyableOptions["effect"]>;
            bonusAmount: GetComputableTypeWithDefault<SkyrmionBuyableOptions["bonusAmount"], 0>;
        }
    >;

    function createPionUpgrade(data: SkyrmionBuyableData) {
        return createSkyrmionBuyable(pions, data);
    }

    function createSpinorUpgrade(data: SkyrmionBuyableData) {
        return createSkyrmionBuyable(spinors, data);
    }

    function createSkyrmionBuyable(resource: Resource<DecimalSource>, data: SkyrmionBuyableData) {
        if (!data.effectDisplay) data.effectDisplay = effect => `${formatSmall(effect)}x`;
        return createBuyable(
            () =>
                ({
                    display() {
                        return {
                            description: data.name,
                            effectDisplay: data.effectDisplay?.(this.effect)
                        };
                    },
                    bonusAmount: data.bonusAmount ?? 0,
                    isFree: data.isFree,
                    cost() {
                        let cost = data.cost(this.amount.value);
                        if (data.costModifier) cost = data.costModifier(cost);
                        return cost;
                    },
                    effect() {
                        return data.effect(Decimal.add(this.amount.value, unref(this.bonusAmount)));
                    },
                    resource: resource,
                    visibility: data.visibility
                } as SkyrmionBuyable)
        );
    }
});

export default layer;
