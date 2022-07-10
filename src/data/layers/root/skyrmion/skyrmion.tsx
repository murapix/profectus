import { createExponentialScaling, createIndependentConversion } from "features/conversion";
import { CoercableComponent, jsx, Replace, showIf, StyleValue, Visibility } from "features/feature";
import { createReset } from "features/reset";
import { createResource, displayResource, Resource } from "features/resources/resource";
import { BaseLayer, createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall, formatWhole } from "util/break_eternity";
import { render } from "util/vue";
import { computed, ComputedRef, CSSProperties, Ref, unref, watch } from "vue";
import { createLayerTreeNode, createResetButton } from "../../../common";
import { root } from "../../../projEntry";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import SpacerVue from "components/layout/Spacer.vue";
import SkyrmionVue from "./Skyrmion.vue";
import PionVue from "./Pion.vue";
import RowVue from "components/layout/Row.vue";
import ColumnVue from "components/layout/Column.vue";
import SpinorVue from "./Spinor.vue";
import ResourceVue from "features/resources/Resource.vue";
import { createUpgrade, GenericUpgrade, Upgrade, UpgradeOptions } from "features/upgrades/upgrade";
import fome, { FomeTypes } from "../fome/fome";
import { Computable, GetComputableTypeWithDefault, processComputable } from "util/computed";
import { Buyable, BuyableOptions, createBuyable } from "features/buyable";
import { addTooltip } from "features/tooltips/tooltip";
import { Direction } from "util/common";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { createChallenge } from "features/challenges/challenge";
import acceleron from "../acceleron/acceleron";

interface SkyrmionUpgradeData {
    visibility?: Visibility | Ref<Visibility> | ((this: GenericUpgrade) => Visibility);
    display: {
        title: string;
        description: JSX.Element;
    };
    cost: DecimalSource;
    onPurchase?: () => void;
}

interface SkyrmionBuyableData {
    name: string;
    description: JSX.Element;
    cost: (amount: DecimalSource) => DecimalSource;
    effect: (amount: DecimalSource) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
    effectDisplay?: (effect: any) => CoercableComponent; // eslint-disable-line @typescript-eslint/no-explicit-any
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

const id = "skyrmion";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Skyrmions";
    const color = computed(() => unref(abyssChallenge.active) ? "#ff0000" : "#37d7ff");

    const skyrmions = createResource<DecimalSource>(1, "Skyrmions");
    const pions = createResource<DecimalSource>(0, "Pions");
    const spinors = createResource<DecimalSource>(0, "Spinors");

    const totalSkyrmions = computed(() => Decimal.add(unref(skyrmions), 0));
    const genRate = computed(() => unref(totalSkyrmions)
                                    .times(unref(pionUpgrades.alpha.effect))
                                    .times(unref(spinorUpgrades.zeta.effect))
                                    .times(unref(spinorUpgrades.lambda.effect)));
    const pionRate = computed(() => unref(genRate)
                                    .times(unref(spinorUpgrades.gamma.effect))
                                    .times(unref(spinorUpgrades.mu.effect)))
    const spinorRate = computed(() => unref(genRate)
                                    .times(unref(pionUpgrades.gamma.effect))
                                    .times(unref(pionUpgrades.mu.effect)))    
    
    this.on("preUpdate", diff => {
        const modifiedDiff = Decimal.times(diff, unref(acceleron.timeMult));
        pions.value = modifiedDiff.times(unref(pionRate)).plus(unref(pions));
        spinors.value = modifiedDiff.times(unref(spinorRate)).plus(unref(spinors));
    });
    this.on("update", () => {
        if (unref(skyrmionUpgrades.autoGain.bought))
            skyrmions.value = Decimal.max(unref(conversion.currentGain), unref(skyrmions));
            
        (Object.keys(skyrmionUpgrades) as Array<keyof typeof skyrmionUpgrades>)
            .filter(key => unref(skyrmionUpgrades[key].bought))
            .forEach(key => {
                pionUpgrades?.[key as keyof Omit<typeof pionUpgrades, "amount">]?.purchase();
                spinorUpgrades?.[key as keyof Omit<typeof spinorUpgrades, "amount">]?.purchase();
            });
    });

    const effectiveUpgrades = {
        pion: computed(() => Decimal.sub(unref(pionUpgrades.amount), fome.getFomeBoost(FomeTypes.subspatial, 2))),
        spinor: computed(() => Decimal.sub(unref(spinorUpgrades.amount), fome.getFomeBoost(FomeTypes.subspatial, 2))),
    }
    const effectiveAbyssUpgrades = computed(() => Decimal.add(unref(effectiveUpgrades.pion), unref(effectiveUpgrades.spinor)).times(0.75))
    const pionCostNerf: ComputedRef<Decimal> = computed(() => {
        const amount = unref(abyssChallenge.active) ? unref(effectiveAbyssUpgrades) : unref(effectiveUpgrades.spinor);
        return Decimal.pow(amount.times(0.2).times(unref(spinorUpgrades.beta.effect)).plus(1), amount.times(0.25).times(fome.getFomeBoost(FomeTypes.quantum, 2)));
    })
    const spinorCostNerf: ComputedRef<Decimal> = computed(() => {
        const amount = unref(abyssChallenge.active) ? unref(effectiveAbyssUpgrades) : unref(effectiveUpgrades.pion);
        return Decimal.pow(amount.times(0.2).times(unref(pionUpgrades.beta.effect)).plus(1), amount.times(0.25).times(fome.getFomeBoost(FomeTypes.quantum, 2)));
    })

    const hexStyle = {
        position: "absolute",
        top: 0,
        left: 0,
        margin: 0,
        border: 0,
        borderRadius: 0,
        clipPath: "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
        width: "var(--upgrade-width)",
        minHeight: "var(--upgrade-width)",
    }

    const abyssChallenge = createChallenge(() => ({
        style: {
            border: 0,
            borderRadius: 0,
            clipPath: "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
            marginHorizontal: "50px",
            width: "250px",
            minWidth: "250px",
            minHeight: "250px",
            boxShadow: "0"
        } as StyleValue,
        visibility: computed(() => showIf(true)),
        completionLimit: 4,
        canComplete() { return unref(abyssUpgradeCount) > unref(this.completions); },
        onEnter() { /* no-op */ },
        onExit() { /* no-op */ }
    }))
    const abyssUpgradeCount = computed(() => {
        return (['nu', 'pi', 'xi', 'rho'] as (keyof typeof skyrmionUpgrades)[])
            .map(upgrade => unref(skyrmionUpgrades?.[upgrade].bought ?? false))
            .filter(bought => bought)
            .length
    })
    watch(abyssUpgradeCount, () => abyssChallenge.completions.value = new Decimal(unref(abyssUpgradeCount)));

    const minAmount = computed(() => Decimal.min(unref(pions), unref(spinors)));
    const minResource = createResource<DecimalSource>(minAmount, "Pions and Spinors");

    const conversion = createIndependentConversion(() => ({
        scaling: createExponentialScaling(10, 1),
        baseResource: minResource,
        gainResource: skyrmions,
        buyMax: true,
        convert() {
            conversion.gainResource.value = unref(conversion.currentGain);
            if (!unref(skyrmionUpgrades.autoGain.bought)) {
                const cost = unref(conversion.currentAt);
                pions.value = Decimal.sub(unref(pions), cost);
                spinors.value = Decimal.sub(unref(spinors), cost);
            }
        },
        costModifier: createSequentialModifier(
            createMultiplicativeModifier(spinorUpgrades.alpha.effect),
            createMultiplicativeModifier(fome.boosts[FomeTypes.infinitesimal][4].effect)
        )
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => []
    }));

    const treeNode = createLayerTreeNode(() => ({
        display: "S",
        layerID: id,
        color,
        reset
    }));

    const resetButton = createResetButton(() => ({
        conversion,
        tree: root.tree,
        treeNode,
        style: {
            ...(hexStyle as CSSProperties),
            paddingHorizontal: "20px"
        },
        display: jsx(() => (
            <>
                {"Convert "}{format(unref(conversion.currentAt))}{" Pions and Spinors to "}{formatWhole(unref(skyrmions))}{" Skyrmions"}
            </>
        ))
    }));
    addTooltip(resetButton, {
        direction: Direction.Up,
        display: jsx(() => (
            <>
                {"Next at "}{format(unref(conversion.nextAt))}{" Pions and Spinors"}
            </>
        ))
    });

    const skyrmionUpgrades: {[key: string]: GenericUpgrade} = {
        fome: createSkyrmionUpgrade({
            display: {
                title: "Condensation",
                description: <>Begin Foam generation</>
            },
            cost: 10,
            onPurchase() { fome.reformUpgrades.protoversal.amount.value = Decimal.dOne }
        }),
        autoGain: createSkyrmionUpgrade({
            display: {
                title: "Reformation",
                description: <>Automatically gain Skyrmions; they don't cost Pions or Spinors</>
            },
            cost: 16
        }),
        alpha: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 20));
            },
            display: {
                title: "Alteration",
                description: <>Autobuy α upgrades<br />α upgrades no longer consume Pions or Spinors</>
            },
            cost: 24
        }),
        beta: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 25));
            },
            display: {
                title: "Benediction",
                description: <>Autobuy β upgrades<br />β upgrades no longer consume Pions or Spinors</>
            },
            cost: 28
        }),
        gamma: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 30));
            },
            display: {
                title: "Consolidation",
                description: <>Autobuy γ upgrades<br />γ upgrades no longer consume Pions or Spinors</>
            },
            cost: 32
        }),
        delta: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 35));
            },
            display: {
                title: "Diversification",
                description: <>Autobuy δ upgrades<br />δ upgrades no longer consume Pions or Spinors</>
            },
            cost: 36
        }),
        epsilon: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 40));
            },
            display: {
                title: "Encapsulation",
                description: <>Autobuy ε upgrades<br />ε upgrades no longer consume Pions or Spinors</>
            },
            cost: 42
        }),
        zeta: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 45));
            },
            display: {
                title: "Fabrication",
                description: <>Autobuy ζ upgrades<br />ζ upgrades no longer consume Pions or Spinors</>
            },
            cost: 48
        }),
        eta: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 50));
            },
            display: {
                title: "Germination",
                description: <>Autobuy η upgrades<br />η upgrades no longer consume Pions or Spinors</>
            },
            cost: 52
        }),
        theta: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 55));
            },
            display: {
                title: "Hesitation",
                description: <>Autobuy θ upgrades<br />θ upgrades no longer consume Pions or Spinors</>
            },
            cost: 56
        }),
        iota: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 60));
            },
            display: {
                title: "Immitation",
                description: <>Autobuy ι upgrades<br />ι upgrades no longer consume Pions or Spinors</>
            },
            cost: 64
        }),
        kappa: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 65));
            },
            display: {
                title: "Juxtaposition",
                description: <>Autobuy κ upgrades<br />κ upgrades no longer consume Pions or Spinors</>
            },
            cost: 69
        }),
        lambda: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 70));
            },
            display: {
                title: "Lateralization",
                description: <>Autobuy λ upgrades<br />λ upgrades no longer consume Pions or Spinors</>
            },
            cost: 72
        }),
        mu: createSkyrmionUpgrade({
            visibility() {
                return showIf(unref((this as GenericUpgrade).bought) || Decimal.gte(unref(skyrmions), 75));
            },
            display: {
                title: "Materialization",
                description: <>Autobuy μ upgrades<br />μ upgrades no longer consume Pions or Spinors</>
            },
            cost: 92
        }),
        nu: createUpgrade(() => ({
            canAfford: false,
            visibility() {
                return showIf(unref(this.bought) || unref(abyssChallenge.active));
            },
            display: {
                title: "Neutralization",
                description: "Autobuy ν upgrades<br />ν upgrades no longer consume Pions or Spinors"
            },
            style: hexStyle as CSSProperties
        })),
        xi: createUpgrade(() => ({
            canAfford: false,
            visibility() {
                return showIf(unref(this.bought) || unref(abyssChallenge.active));
            },
            display: {
                title: "Externalization",
                description: "Autobuy ξ upgrades<br />ξ upgrades no longer consume Pions or Spinors"
            },
            style: hexStyle as CSSProperties
        })),
        pi: createUpgrade(() => ({
            canAfford: false,
            visibility() {
                return showIf(unref(this.bought) || unref(abyssChallenge.active));
            },
            display: {
                title: "Prioritization",
                description: "Autobuy π upgrades<br />π upgrades no longer consume Pions or Spinors"
            },
            style: hexStyle as CSSProperties
        })),
        rho: createUpgrade(() => ({
            canAfford: false,
            visibility() {
                return showIf(unref(this.bought) || unref(abyssChallenge.active));
            },
            display: {
                title: "Obfuscation",
                description: "Autobuy ρ upgrades<br />ρ upgrades no longer consume Pions or Spinors"
            },
            style: hexStyle as CSSProperties
        }))
    };

    const pionUpgrades = {
        amount: createResource<DecimalSource>(0, "Pion Upgrades"),
        alpha: createPionUpgrade({
            name: "α",
            description: <>Gain 50% more Pions and Spinors</>,
            cost(amount: DecimalSource) {
                const cost: Decimal = (() => {
                    if (Decimal.gte(amount, 90)) return Decimal.pow(187.5, Decimal.sub(amount, 90)).times(2.65e77);
                    else if (Decimal.gte(amount, 25)) return Decimal.pow(9.5, Decimal.sub(amount, 25)).times(9.5);
                    else return Decimal.pow(1.2, amount).times(0.1);
                })();
                return cost.times(fome.getFomeBoost(FomeTypes.protoversal, 1));
            },
            effect: amount => Decimal.pow(1.5, amount),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.protoversal, 2),
            isFree: skyrmionUpgrades.alpha.bought
        }),
        beta: createPionUpgrade({
            name: "β",
            description: <>Reduce the nerf to Spinor upgrade cost by 10%</>,
            cost(amount: DecimalSource) {
                const cost: Decimal = (() => {
                    if (Decimal.gte(amount, 45)) return Decimal.pow(292.5, Decimal.sub(amount, 45)).times(3.01e39);
                    else if (Decimal.gte(amount, 15)) return Decimal.pow(10, Decimal.sub(amount, 15)).times(6);
                    else return Decimal.pow(1.3, amount).times(0.1);
                })();
                return cost.plus(0.9);
            },
            effect: amount => Decimal.pow(0.9, amount),
            effectDisplay: effect => `Spinor upgrade cost nerf reduced to ${formatSmall(Decimal.times(effect, 100))}%`,
            bonusAmount: () => fome.getFomeBoost(FomeTypes.protoversal, 3),
            isFree: skyrmionUpgrades.beta.bought
        }),
        gamma: createPionUpgrade({
            name: "γ",
            description: <>Gain 75% more Spinors</>,
            cost(amount: DecimalSource) {
                const cost: Decimal = (() => {
                    if (Decimal.gte(amount, 60)) return Decimal.pow(367.5, Decimal.sub(amount, 60)).times(1.97e71);
                    else if (Decimal.gte(amount, 10)) return Decimal.pow(12.5, Decimal.sub(amount, 10)).times(25);
                    else return Decimal.pow(1.7, amount).times(0.1);
                })();
                return cost.plus(4.9).times(fome.getFomeBoost(FomeTypes.infinitesimal, 5));
            },
            effect: amount => Decimal.pow(1.75, amount),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.protoversal, 4),
            isFree: skyrmionUpgrades.gamma.bought
        }),
        delta: createPionUpgrade({
            name: "δ",
            description: <>Gain 70% more Protoversal Foam from Skyrmions</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 60)) return Decimal.pow(225, Decimal.sub(amount, 60)).times(1.1e72);
                else return Decimal.pow(6, amount).times(30);
            },
            effect: amount => Decimal.pow(1.7, amount),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.subplanck, 2),
            isFree: skyrmionUpgrades.delta.bought,
            visibility: () => showIf(unref(fome.boosts.protoversal[1].amount) > 0)
        }),
        epsilon: createPionUpgrade({
            name: "ε",
            description: <>Increase Protoversal Foam gain by 50% per order of magnitude of Infinitesimal Foam</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 60)) return Decimal.pow(144, Decimal.sub(amount, 60)).times(2.82e66);
                else return Decimal.pow(5, amount).times(50);
            },
            effect: amount => Decimal.max(unref(fome.amounts.infinitesimal), 0).plus(1).log10().times(amount).times(0.5).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.subplanck, 3),
            isFree: skyrmionUpgrades.epsilon.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.infinitesimal.amount) > 0)
        }),
        zeta: createPionUpgrade({
            name: "ζ",
            description: <>Increase Subspatial Foam gain by 5% per Skyrmion</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 60)) return Decimal.pow(196, Decimal.sub(amount, 60)).times(1.71e73);
                else return Decimal.pow(5.5, amount).times(5e3);
            },
            effect: amount => fome.getFomeBoost(FomeTypes.subspatial, 4).plus(unref(skyrmions)).times(amount).times(0.05).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.subplanck, 4),
            isFree: skyrmionUpgrades.zeta.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.subspatial.amount) > 0)
        }),
        eta: createPionUpgrade({
            name: "η",
            description: <>Gain a free level of <b>Spinor Upgrade ε</b></>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 60)) return Decimal.pow(144, Decimal.sub(amount, 60)).times(1.69e71);
                else return Decimal.pow(5, amount).times(3e5);
            },
            effect: amount => amount,
            effectDisplay: effect => `${format(effect)} free levels`,
            bonusAmount: () => fome.getFomeBoost(FomeTypes.subplanck, 5),
            isFree: skyrmionUpgrades.eta.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.protoversal.amount) > 1)
        }),
        theta: createPionUpgrade({
            name: "θ",
            description: <>Increase Protoversal Foam gain by 100% per order of magnitude of Subspatial Foam</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45)) return Decimal.pow(169, Decimal.sub(amount, 45)).times(6.86e72);
                else return Decimal.pow(6.5, amount).times(7e5);
            },
            effect: amount => Decimal.max(unref(fome.amounts.subspatial), 0).plus(1).log10().times(amount).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.quantum, 2),
            isFree: skyrmionUpgrades.theta.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.subplanck.amount) > 0)
        }),
        iota: createPionUpgrade({
            name: "ι",
            description: <>Your Spinors increase Infinitesimal Foam generation by 2% per order of magnitude</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45)) return Decimal.pow(225, Decimal.sub(amount, 45)).times(1.68e67);
                else return Decimal.pow(7.5, amount).times(4e8);
            },
            effect: amount => Decimal.max(unref(spinors), 0).plus(1).log10().times(amount).times(0.02).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.quantum, 4),
            isFree: skyrmionUpgrades.iota.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.protoversal.amount) > 2)
        }),
        kappa: createPionUpgrade({
            name: "κ",
            description: <>Protoversal Boost 1 levels each increase other Foam Boost 1 effects by 30%</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45))
                    return Decimal.pow(182, Decimal.sub(amount, 45)).times(3.66e68);
                else return Decimal.pow(7, amount).times(5e9);
            },
            effect: amount => Decimal.add(unref(fome.boosts.protoversal[1].amount), unref(fome.boosts.protoversal[1].bonus)).times(amount).times(0.3).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.quantum, 4),
            isFree: skyrmionUpgrades.kappa.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.infinitesimal.amount) > 1)
        }),
        lambda: createPionUpgrade({
            name: "λ",
            description: <>Double the Infinitesimal Foam Boost 1 effect</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45)) return Decimal.pow(100, Decimal.pow(amount, 1.1).minus(45)).times(4.92e76);
                else return Decimal.pow(5, Decimal.pow(amount, 1.1)).times(7e2);
            },
            effect: amount => Decimal.pow(2, amount),
            isFree: skyrmionUpgrades.lambda.bought,
            visibility: () => showIf(false)
        }),
        mu: createPionUpgrade({
            name: "μ",
            description: <>Gain 2% more Spinors per order of magnitude<sup>2</sup> of stored Inflatons</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45)) return Decimal.pow(100, Decimal.sub(amount, 45)).times(7e65);
                else return Decimal.pow(5, amount).times(7e10);
            },
            effect: amount => Decimal.clamp(1, 1, 1).plus(9).log10().log10().times(0.02).plus(1).pow(amount),
            isFree: skyrmionUpgrades.mu.bought,
            visibility: () => showIf(false)
        })
    };

    const spinorUpgrades = {
        amount: createResource<DecimalSource>(0, "Spinor Upgrades"),
        alpha: createSpinorUpgrade({
            name: "α",
            description: <>Gain 50% more Skyrmions</>,
            cost(amount: DecimalSource) {
                const cost: Decimal = (() => {
                    if (Decimal.gte(amount, 90)) return Decimal.pow(187.5, Decimal.sub(amount, 90)).times(2.65e77);
                    else if (Decimal.gte(amount, 25)) return Decimal.pow(9.5, Decimal.sub(amount, 25)).times(9.5);
                    else return Decimal.pow(1.2, amount).times(0.1);
                })();
                return cost.times(fome.getFomeBoost(FomeTypes.protoversal, 1));
            },
            effect: amount => Decimal.pow(1.5, amount),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.protoversal, 2),
            isFree: skyrmionUpgrades.alpha.bought
        }),
        beta: createSpinorUpgrade({
            name: "β",
            description: <>Reduce the nerf to Pion upgrade cost by 10%</>,
            cost(amount: DecimalSource) {
                const cost: Decimal = (() => {
                    if (Decimal.gte(amount, 45)) return Decimal.pow(292.5, Decimal.sub(amount, 45)).times(3.01e39);
                    else if (Decimal.gte(amount, 15)) return Decimal.pow(9.5, Decimal.sub(amount, 15)).times(6);
                    else return Decimal.pow(1.3, amount).times(0.1);
                })();
                return cost.plus(0.9);
            },
            effect: amount => Decimal.pow(0.9, amount),
            effectDisplay: effect => `Pion upgrade cost nerf reduced to ${formatSmall(Decimal.times(effect, 100))}%`,
            bonusAmount: () => fome.getFomeBoost(FomeTypes.protoversal, 3),
            isFree: skyrmionUpgrades.beta.bought
        }),
        gamma: createSpinorUpgrade({
            name: "γ",
            description: <>Gain 75% more Pions</>,
            cost(amount: DecimalSource) {
                const cost: Decimal = (() => {
                    if (Decimal.gte(amount, 60)) return Decimal.pow(367.5, Decimal.sub(amount, 60)).times(1.97e71);
                    else if (Decimal.gte(amount, 10)) return Decimal.pow(12.5, Decimal.sub(amount, 10)).times(25);
                    else return Decimal.pow(1.7, amount).times(0.1);
                })();
                return cost.plus(4.9).times(fome.getFomeBoost(FomeTypes.infinitesimal, 5));
            },
            effect: amount => Decimal.pow(1.75, amount),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.protoversal, 4),
            isFree: skyrmionUpgrades.gamma.bought
        }),
        delta: createSpinorUpgrade({
            name: "δ",
            description: <>Gain 70% more Protoversal Foam Boost 1 effect</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 60)) return Decimal.pow(225, Decimal.sub(amount, 60)).times(1.1e72);
                else return Decimal.pow(6, amount).times(30);
            },
            effect: amount => Decimal.pow(1.7, amount),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.subplanck, 2),
            isFree: skyrmionUpgrades.delta.bought,
            visibility: () => showIf(unref(fome.boosts.protoversal[1].amount) > 0)
        }),
        epsilon: createSpinorUpgrade({
            name: "ε",
            description: <>Increase Infinitesimal Foam gain by 50% per order of magnitude of Protoversal Foam</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 60)) return Decimal.pow(144, Decimal.sub(amount, 60)).times(2.82e66);
                else return Decimal.pow(5, amount).times(50);
            },
            effect: amount => Decimal.max(unref(fome.amounts.protoversal), 0).plus(1).log10().times(amount).times(0.5).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.subplanck, 3).plus(unref(pionUpgrades.eta.effect)),
            isFree: skyrmionUpgrades.epsilon.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.infinitesimal.amount) > 0)
        }),
        zeta: createSpinorUpgrade({
            name: "ζ",
            description: <>Increase Pion and Spinor gain by 30% per order of magnitude of Subspatial Foam</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 60)) return Decimal.pow(196, Decimal.sub(amount, 60)).times(1.71e73);
                else return Decimal.pow(5.5, amount).times(5e3);
            },
            effect: amount => Decimal.max(unref(fome.amounts.subspatial), 0).plus(1).log10().times(amount).times(0.3).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.subplanck, 4)
           ,
            isFree: skyrmionUpgrades.zeta.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.subspatial.amount) > 0)
        }),
        eta: createSpinorUpgrade({
            name: "η",
            description: <>Gain 120% increased Foam generation</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 60)) return Decimal.pow(144, Decimal.sub(amount, 60)).times(1.69e71);
                else return Decimal.pow(5, amount).times(3e5);
            },
            effect: amount => Decimal.times(amount, 1.2).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.subplanck, 5),
            isFree: skyrmionUpgrades.eta.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.protoversal.amount) > 1)
        }),
        theta: createSpinorUpgrade({
            name: "θ",
            description: <>Increase Subspatial Foam gain by 30% per order of magnitude of Protoversal and Infinitesimal Foam</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45)) return Decimal.pow(169, Decimal.sub(amount, 45)).times(6.86e72);
                else return Decimal.pow(6.5, amount).times(7e5);
            },
            effect: amount => Decimal.add(Decimal.max(unref(fome.amounts.protoversal), 0).plus(1).log10(), Decimal.max(unref(fome.amounts.infinitesimal), 0).plus(1).log10()).times(amount).times(0.3).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.quantum, 2),
            isFree: skyrmionUpgrades.theta.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.subplanck.amount) > 0)
        }),
        iota: createSpinorUpgrade({
            name: "ι",
            description: <>Your Pions increase Infinitesimal Foam generation by 2% per order of magnitude</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45)) return Decimal.pow(225, Decimal.sub(amount, 45)).times(1.68e67);
                else return Decimal.pow(7.5, amount).times(4e8);
            },
            effect: amount => Decimal.max(unref(pions), 0).plus(1).log10().times(amount).times(0.02).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.quantum, 4),
            isFree: skyrmionUpgrades.iota.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.protoversal.amount) > 2)
        }),
        kappa: createSpinorUpgrade({
            name: "κ",
            description: <>Increase Subplanck Boost 1 effect by 40% per order of magnitude of Subplanck Foam</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45))
                    return Decimal.pow(182, Decimal.sub(amount, 45)).times(3.66e68);
                else return Decimal.pow(7, amount).times(5e9);
            },
            effect: amount => Decimal.max(unref(fome.amounts.subplanck), 0).plus(1).log10().times(amount).times(0.4).plus(1),
            bonusAmount: () => fome.getFomeBoost(FomeTypes.quantum, 4),
            isFree: skyrmionUpgrades.kappa.bought,
            visibility: () => showIf(unref(fome.reformUpgrades.infinitesimal.amount) > 1)
        }),
        lambda: createSpinorUpgrade({
            name: "λ",
            description: <>ln(Best Accelerons) increases Pion and Spinor gain</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45)) return Decimal.pow(100, Decimal.pow(amount, 1.1).minus(45)).times(4.92e76);
                else return Decimal.pow(5, Decimal.pow(amount, 1.1)).times(7e2);
            },
            effect: amount => Decimal.max(unref(0), 0).plus(1).ln().times(amount).plus(1),
            isFree: skyrmionUpgrades.lambda.bought,
            visibility: () => showIf(false)
        }),
        mu: createSpinorUpgrade({
            name: "μ",
            description: <>Gain 2% more Pions per order of magnitude<sup>2</sup> of stored Inflatons</>,
            cost(amount: DecimalSource) {
                if (Decimal.gte(amount, 45)) return Decimal.pow(100, Decimal.sub(amount, 45)).times(7e65);
                else return Decimal.pow(5, amount).times(7e10);
            },
            effect: amount => Decimal.clamp(1, 1, 1).plus(9).log10().log10().times(0.02).plus(1).pow(amount),
            isFree: skyrmionUpgrades.mu.bought,
            visibility: () => showIf(false)
        })
    };

    return {
        name,
        color,
        skyrmions,
        skyrmionUpgrades,
        pions,
        pionRate,
        pionUpgrades,
        spinors,
        spinorRate,
        spinorUpgrades,
        abyssChallenge,
        display: jsx(() => (
            <>
                <MainDisplayVue resource={skyrmions} color={unref(color)} />
                {Decimal.gt(unref(fome.getFomeBoost(FomeTypes.subspatial, 4)), 0) ? 
                    <>Your {fome.amounts.subspatial.displayName} is granting an additional <h2 style={{ color: unref(color), textShadow: `0px 0px 10px ${unref(color)}` }}>
                        {format(unref(fome.getFomeBoost(FomeTypes.subspatial, 4)))}
                    </h2> {skyrmions.displayName}</>
                : null}
                <SpacerVue />
                <RowVue><div style={{ flexFlow: "row nowrap" }}>
                    <ColumnVue>
                        <div>You have <ResourceVue resource={pions} color={unref(color)} tag="h3" />{" "}{pions.displayName}</div>
                        <div style="font-size: 12px">Your Spinor upgrades are increasing Pion upgrade costs by {formatSmall(unref(pionCostNerf).minus(1).times(100))}%</div>
                        <SpacerVue />
                        <PionVue />
                    </ColumnVue>
                    {unref(abyssChallenge.visibility) === Visibility.Visible ? render(abyssChallenge) : <div style={{ minWidth: "250px", minHeight: "250px" }} />}
                    <ColumnVue>
                        <div>You have <ResourceVue resource={spinors} color={unref(color)} tag="h3" />{" "}{spinors.displayName}</div>
                        <div style="font-size: 12px">Your Pion upgrades are increasing Spinor upgrade costs by {formatSmall(unref(spinorCostNerf).minus(1).times(100))}%</div>
                        <SpacerVue />
                        <SpinorVue />
                    </ColumnVue>
                </div></RowVue>
                <SpacerVue />
                <div v-show={false}>
                    Your Subspatial Foam is granting an additional{" "}
                    <span color={unref(color)}>{format(3)}</span> Skyrmions
                    <SpacerVue />
                </div>
                <SkyrmionVue>{render(resetButton)}</SkyrmionVue>
            </>
        )),
        treeNode,
        conversion
    };

    function createPionUpgrade(data: SkyrmionBuyableData) {
        return createSkyrmionBuyable(pions, data);
    }

    function createSpinorUpgrade(data: SkyrmionBuyableData) {
        return createSkyrmionBuyable(spinors, data);
    }

    function createSkyrmionBuyable(resource: Resource<DecimalSource>, data: SkyrmionBuyableData, abyss = false) {
        processComputable(data, "isFree");
        processComputable(data, "bonusAmount");
        processComputable(data, "visibility");

        if (!data.effectDisplay) data.effectDisplay = effect => `${formatSmall(effect)}x`;
        let costFunc!: (cost: DecimalSource) => DecimalSource;
        switch (resource) {
            case pions: costFunc = cost => unref(pionCostNerf).times(cost); break;
            case spinors: costFunc = cost => unref(spinorCostNerf).times(cost); break;
            default: costFunc = cost => cost; break;
        }
        let buyFunc: () => void;
        switch(resource) {
            case pions: buyFunc = () => pionUpgrades.amount.value = Decimal.add(unref(pionUpgrades.amount), 1); break;
            case spinors: buyFunc = () => spinorUpgrades.amount.value = Decimal.add(unref(spinorUpgrades.amount), 1);
        }
        const buyable = createBuyable(() => ({
                display: data.name,
                bonusAmount: data.bonusAmount ?? 0,
                isFree: data.isFree,
                cost() { return costFunc(data.cost(unref(this.amount))); },
                effect() { return data.effect(Decimal.add(unref(this.amount), unref(this.bonusAmount))); },
                onPurchase(cost: DecimalSource) {
                    buyFunc?.();
                    if (unref(data.isFree)) resource.value = Decimal.add(unref(resource), cost);
                },
                resource: resource,
                visibility() { return unref(abyssChallenge.active) === abyss ? unref(data.visibility ?? Visibility.Visible) : Visibility.None; },
                style: hexStyle
            } as SkyrmionBuyable));

        addTooltip(buyable, {
            direction: Direction.Down,
            yoffset: "var(--upgrade-width)",
            display: jsx(() => <>
                {data.description}
                <br />
                {"Amount: "}{formatWhole(unref(buyable.amount))}{unref(buyable.bonusAmount) > 0 ? <>+{formatWhole(unref(buyable.bonusAmount))}</> : undefined}
                <br />
                {"Currently: "}{data.effectDisplay?.(unref(buyable.effect))}
                <br />
                {"Costs: "}{displayResource(resource, unref(buyable.cost ?? 0))}{" "}{resource.displayName}
                </>
            )
        });
        return buyable;
    }

    function createSkyrmionUpgrade(data: SkyrmionUpgradeData) {
        const upgrade = createUpgrade(() => ({
                visibility: data.visibility,
                display: data.display.title,
                onPurchase() {
                    if (this.resource && this.cost)
                        this.resource.value = Decimal.add(
                            unref(this.resource),
                            unref(this.cost)
                        );
                    data.onPurchase?.()
                },
                resource: skyrmions,
                cost: data.cost,
                style: hexStyle
            } as Upgrade<UpgradeOptions>));

        addTooltip(upgrade, {
            direction: Direction.Up,
            display: jsx(() => (
                <>
                    {data.display.description}
                    <SpacerVue />
                    Requires: {displayResource(skyrmions, data.cost)}{" "}
                    {skyrmions.displayName}
                </>
            ))
        });

        return upgrade;
    }
});

export default layer;
