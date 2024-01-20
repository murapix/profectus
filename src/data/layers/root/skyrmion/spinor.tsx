import { CoercableComponent, Visibility, jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import skyrmion from "./skyrmion";
import acceleron from "../acceleron/acceleron";
import { ComputedRef, computed, unref } from "vue";
import pion from "./pion";
import { Computable } from "util/computed";
import { SkyrmionRepeatable, createSkyrmionRepeatable } from "./repeatable";
import Formula from "game/formulas/formulas";
import { GenericFormula } from "game/formulas/types";
import { noPersist } from "game/persistence";
import { createCostRequirement, requirementsMet } from "game/requirements";
import fome, { FomeTypes } from "../fome/fome";
import ColumnVue from "components/layout/Column.vue";
import ResourceVue from "features/resources/Resource.vue";
import { format, formatSmall } from "util/break_eternity";
import SpacerVue from "components/layout/Spacer.vue";
import SpinorVue from "./Spinor.vue";
import abyss from "./abyss";
import { getFomeBoost } from "../fome/boost";
import { displayResource } from "features/resources/resource";

const id = "spinor";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Spinors";
    
    const spinors = createResource<DecimalSource>(0, name, undefined, true);
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
        const base = amount.times(0.2).times(unref(pion.upgrades.beta.effect as ComputedRef<DecimalSource>)).plus(1);
        const exponent = amount.times(0.25).times(getFomeBoost(FomeTypes.quantum, 2));
        return base.pow(exponent);
    });
    const upgrades: Record<string, SkyrmionRepeatable> = {
        alpha: createUpgrade({
            cost(amount) {
                return amount.pow_base(1.2).times(0.1)
                             .if(() => Decimal.gt(amount.evaluate(), 25), value => value.times(value.pow_base(7.9)).times(3.42e-23))
                             .if(() => Decimal.gt(amount.evaluate(), 90), value => value.times(value.pow_base(19.75)).times(2.08e-104))
                             .times(getFomeBoost(FomeTypes.infinitesimal, 2));
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.alpha.bought),
            display: {
                name: "α",
                description: <>Gain 50% more Skyrmions</>
            },
            effect: amount => Decimal.pow(1.5, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[2].effect
        }),
        beta: createUpgrade({
            cost(amount) {
                return amount.pow_base(1.3).times(0.1)
                             .if(() => Decimal.gt(amount.evaluate(), 15), value => value.times(value.pow_base(7.7)).times(6e-14))
                             .if(() => Decimal.gt(amount.evaluate(), 45), value => value.times(value.pow_base(29.25)).times(1e-39))
                             .plus(0.9);
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.beta.bought),
            display: {
                name: "β",
                description: <>Reduce the nerf to Pion upgrade cost by 10%</>,
                effect: effect => `Pion upgrade cost nerf reduced to ${formatSmall(Decimal.times(effect as DecimalSource, 100))}%`
            },
            effect: amount => Decimal.pow(0.9, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[3].effect
        }),
        gamma: createUpgrade({
            cost(amount) {
                return amount.pow_base(1.7).times(0.1)
                             .if(() => Decimal.gt(amount.evaluate(), 10), value => value.times(value.pow_base(7.35)).times(2.68e-9))
                             .if(() => Decimal.gt(amount.evaluate(), 60), value => value.times(value.pow_base(29.4)).times(8.9e-74))
                             .plus(4.9).times(getFomeBoost(FomeTypes.infinitesimal, 5));
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.gamma.bought),
            display: {
                name: "γ",
                description: <>Gain 75% more Pions</>
            },
            effect: amount => Decimal.pow(1.75, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[4].effect
        }),
        delta: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.protoversal].boosts[1].total), 0),
            cost(amount) {
                return amount.pow_base(6).times(30)
                             .if(() => Decimal.gt(amount.evaluate(), 60), value => value.times(value.pow_base(37.5)).times(2.7e-71))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.delta.bought),
            display: {
                name: "δ",
                description: <>Gain 70% more Protoversal Boost 1 effect</>
            },
            effect: amount => Decimal.pow(1.7, amount),
            bonusAmount: fome[FomeTypes.subplanck].boosts[2].effect
        }),
        epsilon: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.infinitesimal].upgrades.reform.amount), 0),
            cost(amount) {
                return amount.pow_base(5).times(50)
                             .if(() => Decimal.gt(amount.evaluate(), 60), value => value.times(value.pow_base(28.8)).times(1.77e-65))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.epsilon.bought),
            display: {
                name: "ε",
                description: <>Increase Infinitesimal Foam gain by 50% per order of magnitude of Protoversal Foam</>
            },
            effect: amount => Decimal.max(unref(fome[FomeTypes.protoversal].amount), 0).plus(1).log10().times(amount).times(0.5).plus(1),
            // bonusAmount: () => Decimal.add(unref(fome[FomeTypes.subplanck].boosts[3].effect))
            bonusAmount: () => Decimal.add(getFomeBoost(FomeTypes.subplanck, 3), unref(pion.upgrades.eta.effect))
        }),
        zeta: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.subspatial].upgrades.reform.amount), 0),
            cost(amount) {
                return amount.pow_base(5.5).times(5e3)
                             .if(() => Decimal.gt(amount.evaluate(), 60), value => value.times(value.pow_base(35.64)).times(1e-68))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.zeta.bought),
            display: {
                name: "ζ",
                description: <>Increase Pion and Spinor gain by 30% per order of magnitude of Subspatial Foam</>
            },
            effect: amount => Decimal.max(unref(fome[FomeTypes.subspatial].amount), 0).plus(1).log10().times(amount).times(0.3).plus(1),
            bonusAmount: fome[FomeTypes.subplanck].boosts[4].effect
        }),
        eta: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.protoversal].upgrades.reform.amount), 1),
            cost(amount) {
                return amount.pow_base(5).times(3e5)
                             .if(() => Decimal.gt(amount.evaluate(), 60), value => value.times(value.pow_base(28.8)).times(1.77e-64))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.eta.bought),
            display: {
                name: "η",
                description: <>Gain 120% increased Foam generation</>
            },
            effect: amount => Decimal.times(amount, 1.2).plus(1),
            bonusAmount: fome[FomeTypes.subplanck].boosts[5].effect
        }),
        theta: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.subplanck].upgrades.reform.amount), 0),
            cost(amount) {
                return amount.pow_base(6.5).times(7e5)
                             .if(() => Decimal.gt(amount.evaluate(), 45), value => value.times(value.pow_base(26)).times(5.45e-34))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.theta.bought),
            display: {
                name: "θ",
                description: <>Increase Subspatial Foam gain by 30% per order of magnitude of Protoversal and Infinitesimal Foam</>
            },
            effect: amount => Decimal.add(Decimal.max(unref(fome[FomeTypes.protoversal].amount), 0).plus(1).log10(), Decimal.max(unref(fome[FomeTypes.infinitesimal].amount), 0).plus(1).log10()).times(amount).times(0.3).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[2].effect
        }),
        iota: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.protoversal].upgrades.reform.amount), 2),
            cost(amount) {
                return amount.pow_base(7.5).times(4e8)
                             .if(() => Decimal.gt(amount.evaluate(), 45), value => value.times(value.pow_base(30)).times(5.95e-48))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.iota.bought),
            display: {
                name: "ι",
                description: <>Your Pions increase Infinitesimal Foam generation by 2% per order of magnitude</>
            },
            effect: amount => Decimal.max(unref(pion.pions), 0).plus(1).log10().times(amount).times(0.02).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[4].effect
        }),
        kappa: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.infinitesimal].upgrades.reform.amount), 1),
            cost(amount) {
                return amount.pow_base(7).times(5e9)
                             .if(() => Decimal.gt(amount.evaluate(), 45), value => value.times(value.pow_base(26)).times(1.45e-43))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.kappa.bought),
            display: {
                name: "κ",
                description: <>Increase Subplanck Boost 1 effect by 40% per order of magnitude of Subplanck Foam</>
            },
            effect: amount => Decimal.max(unref(fome[FomeTypes.subplanck].amount), 0).plus(1).log10().times(amount).times(0.4).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[4].effect
        }),
        lambda: createUpgrade({
            visibility: noPersist(acceleron.upgrades.skyrmion.bought),
            cost(amount) {
                return amount.pow_base(5).times(7e10)
                             .if(() => Decimal.gt(amount.evaluate(), 45), value => value.times(value.pow_base(20)).times(1e-35))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.lambda.bought),
            display: {
                name: "λ",
                description: <>ln(Best Accelerons) increases Pion and Spinor gain</>
            },
            effect: amount => Decimal.max(unref(acceleron.bestAccelerons), 0).plus(1).ln().times(amount).plus(1)
        }),
        mu: createUpgrade({
            visibility: () => false,
            cost(amount) {
                return amount.pow_base(5).times(7e10)
                             .if(() => Decimal.gt(amount.evaluate(), 45), value => value.times(value.pow_base(20)).times(1e-35))
            },
            shouldAutobuy: noPersist(skyrmion.upgrades.mu.bought),
            display: {
                name: "μ",
                description: <>Gain 2% more Pions per order of magnitude<sup>2</sup> of stored Inflatons</>
            },
            effect: amount => Decimal.clamp(1, 1, 1).plus(9).log10().log10().times(0.02).plus(1).pow(amount)
        })
    }
    
    return {
        name,
        spinors,
        upgradeCount: effectiveUpgradeCount,
        upgrades,
        display: jsx(() => (
            <ColumnVue>
                <div>You have <ResourceVue resource={spinors} color={skyrmion.color} tag="h3" /> {spinors.displayName} (+{displayResource(spinors, production.value)}/s)</div>
                <div style="font-size: 12px">Your Pion upgrades are increasing Spinor upgrade costs by {formatSmall(unref(costNerf).minus(1).times(100))}%</div>
                <SpacerVue />
                <SpinorVue />
            </ColumnVue>
        ))
    }

    interface SpinorRepeatableData {
        visibility?: Computable<Visibility | boolean>;
        cost(amount: GenericFormula): GenericFormula;
        shouldAutobuy: Computable<boolean>;
        display: {
            name: string;
            description: JSX.Element;
            effect?(effect: unknown): CoercableComponent;
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
                cost: cost(Formula.variable(repeatable.amount)).times(costNerf),
                requiresPay: () => !unref(shouldAutobuy),
                canMaximize: false
            }))
        });
        skyrmion.on("update", () => {
            if (unref(shouldAutobuy) && requirementsMet(repeatable.requirements)) {
                repeatable.onClick();
            }
        });
        return repeatable;
    }
})

export default layer;