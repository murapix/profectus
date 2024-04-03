import Spacer from "components/layout/Spacer.vue";
import { CoercableComponent, Visibility, jsx } from "features/feature";
import Resource from "features/resources/Resource.vue";
import { createResource, displayResource } from "features/resources/resource";
import { BaseLayer, createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { noPersist } from "game/persistence";
import { createCostRequirement, requirementsMet } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall } from "util/break_eternity";
import { Computable } from "util/computed";
import { createModifierModal } from "util/util";
import { render } from "util/vue";
import { ComputedRef, computed, unref } from "vue";
import acceleron from "../acceleron/acceleron";
import entropy from "../acceleron/entropy";
import { getFomeBoost } from "../fome/boost";
import fome, { FomeTypes } from "../fome/fome";
import inflaton from "../inflaton/inflaton";
import Spinor from "./Spinor.vue";
import abyss from "./abyss";
import pion from "./pion";
import { SkyrmionRepeatable, createSkyrmionRepeatable } from "./repeatable";
import skyrmion from "./skyrmion";
import settings from "game/settings";
import entangled from "../entangled/entangled";

const id = "spinor";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Spinors";
    
    const spinors = createResource<DecimalSource>(0, { displayName: name, singularName: "Spinor", small: true });
    const productionModifiers = createSequentialModifier(() => [
        ...skyrmion.production,
        createMultiplicativeModifier(() => ({
            multiplier: pion.upgrades.gamma.effect,
            enabled: () => Decimal.gt(unref(pion.upgrades.gamma.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Pion Upgrade γ ({format(unref(pion.upgrades.gamma.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: pion.upgrades.mu.effect as Computable<DecimalSource>,
            enabled: () => Decimal.gt(unref(pion.upgrades.mu.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Pion Upgrade μ ({format(unref(pion.upgrades.mu.totalAmount))})</>))
        }))
    ]);
    const production = computed(() => productionModifiers.apply(unref(skyrmion.totalSkyrmions).times(0.01)));
    skyrmion.on("preUpdate", (diff: number) => {
        const delta = unref(acceleron.timeMult).times(diff);
        spinors.value = delta.times(unref(production)).plus(spinors.value);
    });

    const upgradeCount = computed(() => Object.values(upgrades).map(upgrade => unref(upgrade.amount)).reduce((a: Decimal, b) => a.plus(b), Decimal.dZero));
    const effectiveUpgradeCount: ComputedRef<Decimal> = computed(() => unref(upgradeCount).minus(getFomeBoost(FomeTypes.subspatial, 2)));
    const costNerf = computed(() => {
        const amount = unref(abyss.challenge.active) ? unref(abyss.upgradeCount) : unref(pion.upgradeCount);
        const base = amount.times(0.2).times(unref(pion.upgrades.beta.effect)).plus(1).clampMin(1);
        const exponent = amount.times(0.25).times(getFomeBoost(FomeTypes.quantum, 2)).clampMin(0);
        return base.pow(exponent);
    });
    const nextCostNerf = computed(() => {
        const amount = unref(abyss.challenge.active) ? unref(abyss.nextUpgradeCount) : unref(pion.upgradeCount).plus(1);
        const beta = unref(pion.upgrades.beta.isHovered) ? unref(pion.upgrades.beta.nextEffect)! : unref(pion.upgrades.beta.effect);
        const base = amount.times(0.2).times(beta).plus(1).clampMin(1);
        const exponent = amount.times(0.25).times(getFomeBoost(FomeTypes.quantum, 2)).clampMin(0);
        return base.pow(exponent);
    });
    const upgrades = (() => {
        const alpha = createUpgrade({
            cost(amount) {
                let cost = amount.pow_base(1.2).times(0.1);
                if (amount.gt(25)) cost = amount.pow_base(7.9).times(3.42e-23).times(cost);
                if (amount.gt(90)) cost = amount.pow_base(19.75).times(2.08e-104).times(cost);
                return cost.times(getFomeBoost(FomeTypes.infinitesimal, 2));
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.alpha.bought),
            display: {
                name: "α",
                description: <>Reduce the cost of {skyrmion.skyrmions.displayName} by 33%</>,
                effect: (effect, nextEffect) => `/${format(effect)}${(settings.showNextValues && nextEffect) ? ` → /${format(nextEffect)}` : ``}`
            },
            effect: amount => Decimal.pow(1.5, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[2].effect
        });
        const beta = createUpgrade({
            cost(amount) {
                let cost = amount.pow_base(1.3).times(0.1);
                if (amount.gt(15)) cost = amount.pow_base(7.7).times(6e-14).times(cost);
                if (amount.gt(45)) cost = amount.pow_base(29.25).times(1e-39).times(cost);
                return cost.plus(0.9);
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.beta.bought),
            display: {
                name: "β",
                description: <>Reduce the nerf to Pion upgrade cost by 10%</>,
                effect: (effect, nextEffect) => `Pion upgrade cost nerf reduced to ${formatSmall(Decimal.times(effect as DecimalSource, 100))}%${(settings.showNextValues && nextEffect) ? ` → ${formatSmall(Decimal.times(nextEffect, 100))}%` : ``}`
            },
            effect: amount => Decimal.pow(0.9, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[3].effect
        });
        const gamma = createUpgrade({
            cost(amount) {
                let cost = amount.pow_base(1.7).times(0.1);
                if (amount.gt(10)) cost = amount.pow_base(7.35).times(2.68e-9).times(cost);
                if (amount.gt(60)) cost = amount.pow_base(29.4).times(8.9e-74).times(cost);
                return cost.plus(4.9).times(getFomeBoost(FomeTypes.infinitesimal, 5));
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.gamma.bought),
            display: {
                name: "γ",
                description: <>Gain 75% more Pions</>
            },
            effect: amount => Decimal.pow(1.75, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[4].effect
        });
        const delta = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(entangled.branchOrder) !== '',
                () => Decimal.gt(unref(fome[FomeTypes.protoversal].boosts[1].total), 0)
            ],
            cost(amount) {
                let cost = amount.pow_base(6).times(30);
                if (amount.gt(60)) cost = amount.pow_base(37.5).times(2.7e-71).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.delta.bought),
            display: {
                name: "δ",
                description: <>Gain 70% more Protoversal Boost 1 effect</>
            },
            effect: amount => Decimal.pow(1.7, amount),
            bonusAmount: fome[FomeTypes.subplanck].boosts[2].effect
        });
        const epsilon = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(entangled.branchOrder) !== '',
                () => Decimal.gt(unref(fome[FomeTypes.infinitesimal].upgrades.reform.amount), 0)
            ],
            cost(amount) {
                let cost = amount.pow_base(5).times(50);
                if (amount.gt(60)) cost = amount.pow_base(28.8).times(1.77e-65).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.epsilon.bought),
            display: {
                name: "ε",
                description: <>Increase Infinitesimal Foam gain by 50% per order of magnitude of Protoversal Foam</>
            },
            effect: amount => Decimal.max(unref(fome[FomeTypes.protoversal].amount), 0).plus(1).log10().times(amount).times(0.5).plus(1),
            bonusAmount: () => Decimal.add(getFomeBoost(FomeTypes.subplanck, 3), unref(pion.upgrades.eta.effect))
        });
        const zeta = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(entangled.branchOrder) !== '',
                () => Decimal.gt(unref(fome[FomeTypes.subspatial].upgrades.reform.amount), 0)
            ],
            cost(amount) {
                let cost = amount.pow_base(5.5).times(5e3);
                if (amount.gt(60)) cost = amount.pow_base(35.64).times(1e-68).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.zeta.bought),
            display: {
                name: "ζ",
                description: <>Increase Pion and Spinor gain by 30% per order of magnitude of Subspatial Foam</>
            },
            effect: amount => Decimal.max(unref(fome[FomeTypes.subspatial].amount), 0).plus(1).log10().times(amount).times(0.3).plus(1),
            bonusAmount: fome[FomeTypes.subplanck].boosts[4].effect
        });
        const eta = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(entangled.branchOrder) !== '',
                () => Decimal.gt(unref(fome[FomeTypes.protoversal].upgrades.reform.amount), 1)
            ],
            cost(amount) {
                let cost = amount.pow_base(5).times(3e5);
                if (amount.gt(60)) cost = amount.pow_base(28.8).times(1.77e-64).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.eta.bought),
            display: {
                name: "η",
                description: <>Gain 120% increased Foam generation</>
            },
            effect: amount => Decimal.times(amount, 1.2).plus(1),
            bonusAmount: fome[FomeTypes.subplanck].boosts[5].effect
        });
        const theta = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(entangled.branchOrder) !== '',
                () => Decimal.gt(unref(fome[FomeTypes.subplanck].upgrades.reform.amount), 0)
            ],
            cost(amount) {
                let cost = amount.pow_base(6.5).times(7e5);
                if (amount.gt(45)) cost = amount.pow_base(26).times(5.45e-34).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.theta.bought),
            display: {
                name: "θ",
                description: <>Increase Subspatial Foam gain by 30% per order of magnitude of Protoversal and Infinitesimal Foam</>
            },
            effect: amount => Decimal.add(Decimal.max(unref(fome[FomeTypes.protoversal].amount), 0).plus(1).log10(), Decimal.max(unref(fome[FomeTypes.infinitesimal].amount), 0).plus(1).log10()).times(amount).times(0.3).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[4].effect
        });
        const iota = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(entangled.branchOrder) !== '',
                () => Decimal.gt(unref(fome[FomeTypes.protoversal].upgrades.reform.amount), 2)
            ],
            cost(amount) {
                let cost = amount.pow_base(7.5).times(4e8);
                if (amount.gt(45)) cost = amount.pow_base(30).times(5.95e-48).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.iota.bought),
            display: {
                name: "ι",
                description: <>Your Pions increase Infinitesimal Foam generation by 2% per order of magnitude</>
            },
            effect: amount => Decimal.max(unref(pion.pions), 0).plus(1).log10().times(amount).times(0.02).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[4].effect
        });
        const kappa = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(entangled.branchOrder) !== '',
                () => Decimal.gt(unref(fome[FomeTypes.infinitesimal].upgrades.reform.amount), 1)
            ],
            cost(amount) {
                let cost = amount.pow_base(7).times(5e9);
                if (amount.gt(45)) cost = amount.pow_base(26).times(1.45e-43).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.kappa.bought),
            display: {
                name: "κ",
                description: <>Increase Subplanck Boost 1 effect by 40% per order of magnitude of Subplanck Foam</>
            },
            effect: amount => Decimal.max(unref(fome[FomeTypes.subplanck].amount), 0).plus(1).log10().times(amount).times(0.4).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[4].effect
        });
        const lambda = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(acceleron.upgrades.skyrmion.bought)
            ],
            cost(amount) {
                let cost = amount.pow_base(5).times(7e10);
                if (amount.gt(45)) cost = amount.pow_base(20).times(1e-35).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.lambda.bought),
            display: {
                name: "λ",
                description: <>ln(Best Accelerons) increases Pion and Spinor gain</>
            },
            effect: amount => Decimal.max(unref(acceleron.bestAccelerons), 0).plus(1).ln().times(amount).plus(1)
        });
        const mu = createUpgrade({
            visibility: [
                () => unref(abyss.challenge.active),
                () => unref(inflaton.upgrades.skyrmionUpgrades.bought)
            ],
            cost(amount) {
                let cost = amount.pow_base(5).times(7e10);
                if (amount.gt(45)) cost = amount.pow_base(20).times(1e-35).times(cost);
                return cost;
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.mu.bought),
            display: {
                name: "μ",
                description: <>Gain 2% more Pions per order of magnitude<sup>2</sup> of stored Inflatons</>
            },
            effect: amount => Decimal.clamp(unref(inflaton.inflatons), 1, unref(inflaton.buildings.buildings.storage.effect)).plus(9).log10().log10().times(0.02).plus(1).pow(amount)
        });
        const nu = createUpgrade({
            visibility: () => unref(abyss.challenge.active) || unref(skyrmion.upgrades.nu.bought),
            cost(amount) {
                return amount.pow_base(150).times(1e50);
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.nu.bought),
            display: {
                name: "ν",
                description: <>Add {formatSmall(0.00025)} to a repeatable research cost divider per order of magnitude of Spinors</>
            },
            effect: amount => Decimal.clampMin(unref(spinors), 0).plus(1).log10().times(amount).times(0.00025).plus(1)
        });
        const xi = createUpgrade({
            visibility: () => unref(abyss.challenge.active) || unref(skyrmion.upgrades.xi.bought),
            cost(amount) {
                return amount.pow_base(135).times(1e50);
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.xi.bought),
            display: {
                name: "ξ",
                description: <>Decrease the magnitude of the Entangled String Inflaton requirement by 5%</>
            },
            effect: amount => Decimal.pow(0.95, amount)
        });
        const pi = createUpgrade({
            visibility: () => unref(abyss.challenge.active) || unref(skyrmion.upgrades.pi.bought),
            cost(amount) {
                return amount.pow_base(160).times(1e50);
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.pi.bought),
            display: {
                name: "π",
                description: <>Increase Pion and Spinor gain by 0.25% per total {entropy.entropy.displayName}</>
            },
            effect: amount => Decimal.times(amount, 0.0025).times(unref(entropy.maxEntropy)).plus(1)
        });
        const rho = createUpgrade({
            visibility: () => unref(abyss.challenge.active) || unref(skyrmion.upgrades.rho.bought),
            cost(amount) {
                return amount.pow_base(175).times(1e50);
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.rho.bought),
            display: {
                name: "ρ",
                description: <>Increase effective Subspace building count by 0.1%</>,
                effect: (effect, nextEffect) => `${format(Decimal.times(effect, 100), 1)}%${nextEffect ? ` → ${format(Decimal.times(nextEffect, 100), 1)}%` : ``}`
            },
            effect: amount => Decimal.times(amount, 0.001)
        });

        return {
            alpha, beta, gamma, delta, epsilon, zeta, eta, theta, iota, kappa, lambda, mu, nu, xi, pi, rho
        }
    })();

    const modifierModal = createModifierModal("Spinor Modifiers", () => [
        {
            title: spinors.displayName,
            modifier: productionModifiers,
            base: () => unref(skyrmion.totalSkyrmions).times(0.01),
            baseText: jsx(() => <>[{skyrmion.name}] Total {skyrmion.skyrmions.displayName}</>)
        }
    ]);
    
    const showNext = computed(() => {
        if (!settings.showNextValues) return false;
        if (Object.values(pion.upgrades).some(upgrade => unref(upgrade.isHovered))) return true;
        if (!unref(abyss.challenge.active)) return false;
        return Object.values(upgrades).some(upgrade => unref(upgrade.isHovered));
    });
    return {
        name,
        spinors,
        upgradeCount: effectiveUpgradeCount,
        upgrades,
        display: jsx(() => (
            <div class="table" style="width: 600px; align-items: flex-start">
                <div class="col" style="align-items: flex-start">
                    <div>You have <Resource resource={spinors} color="var(--feature-background)" tag="h3" includeName={true} /> (+{displayResource(spinors, production.value)}/s){render(modifierModal)}</div>
                    <div style="font-size: 12px">Your Pion upgrades are increasing Spinor upgrade costs by {formatSmall(unref(costNerf).minus(1).times(100))}%{
                        unref(showNext) ? <> → {formatSmall(unref(nextCostNerf).minus(1).times(100))}%</> : undefined
                    }</div>
                    <Spacer />
                    <Spinor />
                </div>
            </div>
        ))
    }

    interface SpinorRepeatableData {
        visibility?: Computable<Visibility | boolean> | Computable<Visibility | boolean>[];
        cost(amount: Decimal): Decimal;
        shouldAutobuy: Computable<boolean>;
        display: {
            name: string;
            description: JSX.Element;
            effect?(effect: DecimalSource, nextEffect?: DecimalSource): CoercableComponent;
        };
        effect?(amount: DecimalSource): DecimalSource;
        bonusAmount?: Computable<DecimalSource>;
    }

    function createUpgrade(
        data: SpinorRepeatableData
    ): SkyrmionRepeatable {
        const { visibility, cost, shouldAutobuy, display, effect, bonusAmount } = data;
        const repeatable = createSkyrmionRepeatable({
            visibility,
            display,
            bonusAmount,
            effect,

            requirements: createCostRequirement(() => ({
                resource: noPersist(spinors),
                cost: () => cost(Decimal.sub(unref(repeatable.amount), getFomeBoost(FomeTypes.subplanck, 5))).times(unref(costNerf)),
                requiresPay: () => !unref(shouldAutobuy),
                canMaximize: false
            }))
        });
        skyrmion.on("update", () => {
            if (unref(abyss.challenge.active)) return;
            if (unref(shouldAutobuy) && requirementsMet(repeatable.requirements)) {
                repeatable.onClick();
            }
        });
        return repeatable;
    }
})

export default layer;