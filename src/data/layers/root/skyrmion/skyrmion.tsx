import SpacerVue from "components/layout/Spacer.vue";
import { Buyable, BuyableOptions, createBuyable } from "features/buyable";
import { CoercableComponent, jsx, Replace, showIf, Visibility } from "features/feature";
import { createResource, displayResource, Resource } from "features/resources/resource";
import { createUpgrade, Upgrade, UpgradeOptions } from "features/upgrades/upgrade";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall } from "util/break_eternity";
import { Computable, GetComputableTypeWithDefault } from "util/computed";
import { coerceComponent } from "util/vue";
import { unref } from "vue";
import fome, { FomeTypes } from "../fome";

export const skyrmions = createResource<DecimalSource>(1, "Skyrmions");
export const pions = createResource<DecimalSource>(0, "Pions");
export const spinors = createResource<DecimalSource>(0, "Spinors");

export const skyrmionUpgrades = {
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
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 20));
        },
        display: {
            title: "Alteration",
            description: "Autobuy α upgrades. α upgrades no longer consume Pions or Spinors"
        },
        cost: 24
    }),
    beta: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 25));
        },
        display: {
            title: "Benediction",
            description: "Autobuy β upgrades. β upgrades no longer consume Pions or Spinors"
        },
        cost: 28
    }),
    gamma: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 30));
        },
        display: {
            title: "Consolidation",
            description: "Autobuy γ upgrades. γ upgrades no longer consume Pions or Spinors"
        },
        cost: 32
    }),
    delta: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 35));
        },
        display: {
            title: "Diversification",
            description: "Autobuy δ upgrades. δ upgrades no longer consume Pions or Spinors"
        },
        cost: 36
    }),
    epsilon: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 40));
        },
        display: {
            title: "Encapsulation",
            description: "Autobuy ε upgrades. ε upgrades no longer consume Pions or Spinors"
        },
        cost: 42
    }),
    zeta: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 45));
        },
        display: {
            title: "Fabrication",
            description: "Autobuy ζ upgrades. ζ upgrades no longer consume Pions or Spinors"
        },
        cost: 48
    }),
    eta: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 50));
        },
        display: {
            title: "Germination",
            description: "Autobuy η upgrades. η upgrades no longer consume Pions or Spinors"
        },
        cost: 52
    }),
    theta: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 55));
        },
        display: {
            title: "Hesitation",
            description: "Autobuy θ upgrades. θ upgrades no longer consume Pions or Spinors"
        },
        cost: 56
    }),
    iota: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 60));
        },
        display: {
            title: "Immitation",
            description: "Autobuy ι upgrades. ι upgrades no longer consume Pions or Spinors"
        },
        cost: 64
    }),
    kappa: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 65));
        },
        display: {
            title: "Juxtaposition",
            description: "Autobuy κ upgrades. κ upgrades no longer consume Pions or Spinors"
        },
        cost: 69
    }),
    lambda: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 70));
        },
        display: {
            title: "Lateralization",
            description: "Autobuy λ upgrades. λ upgrades no longer consume Pions or Spinors"
        },
        cost: 72
    }),
    mu: createSkyrmionUpgrade({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 75));
        },
        display: {
            title: "Materialization",
            description: "Autobuy μ upgrades. μ upgrades no longer consume Pions or Spinors"
        },
        cost: 92
    }),
    nu: createUpgrade(() => ({
        visibility() {
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 80));
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
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 85));
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
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 90));
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
            return showIf(this.bought.value || Decimal.gte(skyrmions.value, 95));
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

export const pionUpgrades = {
    amount: createResource<DecimalSource>(0, "Pion Upgrades"),
    alpha: createPionUpgrade({
        name: "α",
        cost: generateCostFunction(
            [
                { multi: 2.65e77, base: 187.5, softcap: 90 },
                { multi: 9.5, base: 9.5, softcap: 25 },
                { multi: 0.1, base: 1.2 }
            ],
            cost => cost.times(fome.getFomeBoost(FomeTypes.protoversal, 1))
        ),
        effect(amount) {
            return Decimal.pow(1.5, amount);
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.protoversal, 2);
        },
        isFree: skyrmionUpgrades.alpha.bought
    }),
    beta: createPionUpgrade({
        name: "β",
        cost(amount: DecimalSource) {
            const cost: Decimal = (() => {
                if (Decimal.gte(amount, 45)) return Decimal.pow(292.5, amount).times(3.01e39);
                else if (Decimal.gte(amount, 15)) return Decimal.pow(10, amount).times(6);
                else return Decimal.pow(1.3, amount).times(0.1);
            })();
            return cost.plus(0.9);
        },
        effect(amount) {
            return Decimal.pow(0.9, amount);
        },
        effectDisplay(effect) {
            return `Spinor upgrade cost nerf reduced to ${formatSmall(
                Decimal.times(effect, 100)
            )}%`;
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.protoversal, 3);
        },
        isFree: skyrmionUpgrades.beta.bought
    }),
    gamma: createPionUpgrade({
        name: "γ",
        cost(amount: DecimalSource) {
            const cost: Decimal = (() => {
                if (Decimal.gte(amount, 60)) return Decimal.pow(367.5, amount).times(1.97e71);
                else if (Decimal.gte(amount, 25)) return Decimal.pow(12.5, amount).times(25);
                else return Decimal.pow(1.7, amount).times(0.1);
            })();
            return cost.plus(4.9).times(fome.getFomeBoost(FomeTypes.infinitesimal, 5));
        },
        effect(amount) {
            return Decimal.pow(1.75, amount);
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.protoversal, 4);
        },
        isFree: skyrmionUpgrades.gamma.bought
    }),
    delta: createPionUpgrade({
        name: "δ",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 60)) return Decimal.pow(225, amount).times(1.1e72);
            else return Decimal.pow(6, amount).times(30);
        },
        effect(amount) {
            return Decimal.pow(1.7, amount);
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.subplanck, 2);
        },
        isFree: skyrmionUpgrades.delta.bought,
        visibility() {
            return showIf(fome.boosts.protoversal[1].amount.value > 0);
        }
    }),
    epsilon: createPionUpgrade({
        name: "ε",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 60)) return Decimal.pow(144, amount).times(2.82e66);
            else return Decimal.pow(5, amount).times(50);
        },
        effect(amount) {
            return Decimal.max(fome.amounts.infinitesimal.value, 0)
                .plus(1)
                .log10()
                .times(amount)
                .times(0.5)
                .plus(1);
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.subplanck, 3);
        },
        isFree: skyrmionUpgrades.epsilon.bought,
        visibility() {
            return showIf(fome.expansions.infinitesimal.value > 0);
        }
    }),
    zeta: createPionUpgrade({
        name: "ζ",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 60)) return Decimal.pow(196, amount).times(1.71e73);
            else return Decimal.pow(5.5, amount).times(5e3);
        },
        effect(amount) {
            return fome
                .getFomeBoost(FomeTypes.subspatial, 4)
                .plus(skyrmions.value)
                .times(amount)
                .times(0.05)
                .plus(1);
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.subplanck, 4);
        },
        isFree: skyrmionUpgrades.zeta.bought,
        visibility() {
            return showIf(fome.expansions.subspatial.value > 0);
        }
    }),
    eta: createPionUpgrade({
        name: "η",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 60)) return Decimal.pow(144, amount).times(1.69e71);
            else return Decimal.pow(5, amount).times(3e5);
        },
        effect: amount => amount,
        effectDisplay(effect) {
            return `${format(effect)} free levels`;
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.subplanck, 5);
        },
        isFree: skyrmionUpgrades.eta.bought,
        visibility() {
            return showIf(fome.expansions.protoversal.value > 1);
        }
    }),
    theta: createPionUpgrade({
        name: "θ",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 45)) return Decimal.pow(169, amount).times(6.86e72);
            else return Decimal.pow(6.5, amount).times(7e5);
        },
        effect(amount) {
            return Decimal.max(fome.amounts.subspatial.value, 0)
                .plus(1)
                .log10()
                .times(amount)
                .plus(1);
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.quantum, 2);
        },
        isFree: skyrmionUpgrades.theta.bought,
        visibility() {
            return showIf(fome.expansions.subplanck.value > 0);
        }
    }),
    iota: createPionUpgrade({
        name: "ι",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 45)) return Decimal.pow(225, amount).times(1.68e67);
            else return Decimal.pow(7.5, amount).times(4e8);
        },
        effect(amount) {
            return Decimal.max(spinors.value, 0).plus(1).log10().times(amount).times(0.02).plus(1);
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.quantum, 4);
        },
        isFree: skyrmionUpgrades.iota.bought,
        visibility() {
            return showIf(fome.expansions.protoversal.value > 2);
        }
    }),
    kappa: createPionUpgrade({
        name: "κ",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 45))
                return Decimal.pow(182, Decimal.sub(amount, 45)).times(3.66e68);
            else return Decimal.pow(7, amount).times(5e9);
        },
        effect(amount) {
            return Decimal.add(
                unref(fome.boosts.protoversal[1].amount),
                unref(fome.boosts.protoversal[1].bonus)
            )
                .times(amount)
                .times(0.3)
                .plus(1);
        },
        bonusAmount() {
            return fome.getFomeBoost(FomeTypes.quantum, 4);
        },
        isFree: skyrmionUpgrades.kappa.bought,
        visibility() {
            return showIf(fome.expansions.infinitesimal.value > 1);
        }
    }),
    lambda: createPionUpgrade({
        name: "λ",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 45))
                return Decimal.pow(100, Decimal.pow(amount, 1.1).minus(45)).times(4.92e76);
            else return Decimal.pow(5, Decimal.pow(amount, 1.1)).times(7e2);
        },
        effect(amount) {
            return Decimal.pow(2, amount);
        },
        isFree: skyrmionUpgrades.lambda.bought,
        visibility() {
            return showIf(false);
        }
    }),
    mu: createPionUpgrade({
        name: "μ",
        cost(amount: DecimalSource) {
            if (Decimal.gte(amount, 45)) return Decimal.pow(100, amount).times(7e65);
            else return Decimal.pow(5, amount).times(7e10);
        },
        effect(amount) {
            return Decimal.clamp(1, 1, 1).plus(9).log10().log10().times(0.02).plus(1).pow(amount);
        },
        isFree: skyrmionUpgrades.mu.bought,
        visibility() {
            return showIf(false);
        }
    })
};

export const spinorUpgrades = {
    amount: createResource<DecimalSource>(0, "Spinor Upgrades"),
    alpha: createPionUpgrade({
        name: "α",
        cost(amount) {
            const cost: Decimal = (() => {
                if (Decimal.gte(amount, 90)) return Decimal.pow(187.5, amount).times(2.65e77);
                else if (Decimal.gte(amount, 25)) return Decimal.pow(9.5, amount).times(9.5);
                else return Decimal.pow(1.2, amount).times(0.1e2);
            })();
            return cost.times(fome.getFomeBoost(FomeTypes.protoversal, 2));
        },
        effect(amount) {
            return Decimal.pow(1.5, amount);
        },
        bonusAmount() {
            return 0; /*fomeEffect(protoversal, 1)*/
        },
        isFree: skyrmionUpgrades.alpha.bought
    })
};

function createSkyrmionUpgrade(data: SkyrmionUpgradeData) {
    return createUpgrade(
        () =>
            ({
                visibility: data.visibility,
                tooltip: jsx(() => (
                    <>
                        {coerceComponent(data.display.description)}
                        <SpacerVue />
                        Requires: {displayResource(skyrmions, data.cost)} {skyrmions.displayName}
                    </>
                )),
                display: data.display.title,
                onPurchase() {
                    if (this.resource && this.cost)
                        this.resource.value = Decimal.add(this.resource.value, unref(this.cost));
                },
                resource: skyrmions,
                cost: data.cost,
                style: {
                    "clip-path": "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
                    border: 0
                }
            } as Upgrade<UpgradeOptions>)
    );
}

function generateCostFunction<T extends { multi: number; base: number }>(
    data: T[],
    modifier?: (cost: Decimal) => Decimal
) {
    const costFuncs: Record<number, (amount: DecimalSource) => Decimal> = {};
    for (const line of data) {
        const func = costFunction(line);
        if ((line as T & { softcap: number }).softcap)
            costFuncs[(line as T & { softcap: number }).softcap] = func;
        else costFuncs[0] = func;
    }
    const outFunc = (amount: DecimalSource) => {
        for (const [softcap, func] of Object.entries(costFuncs))
            if (Decimal.gte(amount, softcap)) return func(amount);
        return new Decimal(amount);
    };
    if (modifier) return (amount: DecimalSource) => modifier(outFunc(amount));
    else return outFunc;
}

function costFunction<T extends { multi: number; base: number }>(data: T) {
    let amountFunc = (amount: DecimalSource) => new Decimal(amount);
    if ((data as T & { power: number }).power)
        amountFunc = (amount: DecimalSource) =>
            amountFunc(amount).pow((data as T & { power: number }).power);
    if ((data as T & { softcap: number }).softcap)
        amountFunc = (amount: DecimalSource) =>
            amountFunc(amount).minus((data as T & { softcap: number }).softcap);
    return (amount: DecimalSource) => Decimal.pow(data.base, amountFunc(amount)).times(data.multi);
}

interface SkyrmionUpgradeData {
    [key: string]: any;
    visibility?: Computable<Visibility>;
    display: {
        title: string;
        description: string;
    };
    cost: DecimalSource;
}

interface SkyrmionBuyableData {
    name: string;
    cost: (amount: DecimalSource) => DecimalSource;
    effect: (amount: DecimalSource) => any;
    effectDisplay?: (effect: any) => CoercableComponent;
    isFree: Computable<boolean>;
    bonusAmount?: Computable<DecimalSource>;
    visibility?: Computable<Visibility>;
}

interface SkyrmionBuyableOptions extends BuyableOptions {
    bonusAmount?: Computable<DecimalSource>;
}

type SkyrmionBuyable = Replace<
    SkyrmionBuyableOptions & Buyable<SkyrmionBuyableOptions>,
    {
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
                display: data.name,
                // display() {
                //     return {
                //         description: data.name,
                //         effectDisplay: data.effectDisplay?.(this.effect)
                //     };
                // },
                bonusAmount: data.bonusAmount ?? 0,
                isFree: data.isFree,
                cost() {
                    return data.cost(this.amount.value);
                },
                effect() {
                    return data.effect(Decimal.add(this.amount.value, unref(this.bonusAmount)));
                },
                resource: resource,
                visibility: data.visibility
            } as SkyrmionBuyable)
    );
}
