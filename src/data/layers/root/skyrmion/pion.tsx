import { CoercableComponent, Visibility, jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import skyrmion from "./skyrmion";
import acceleron from "../acceleron-old/acceleron";
import { ComputedRef, computed, unref } from "vue";
import spinor from "./spinor";
import { GenericFormula } from "game/formulas/types";
import { Computable } from "util/computed";
import { SkyrmionRepeatable, createSkyrmionRepeatable } from "./repeatable"
import { createCostRequirement, requirementsMet } from "game/requirements";
import { noPersist } from "game/persistence";
import Formula from "game/formulas/formulas";
import fome, { FomeTypes } from "../fome/fome";
import ColumnVue from "components/layout/Column.vue";
import ResourceVue from "features/resources/Resource.vue";
import { format, formatSmall } from "util/break_eternity";
import SpacerVue from "components/layout/Spacer.vue";
import PionVue from "./Pion.vue";
import abyss from "./abyss";
import { getFomeBoost } from "../fome/boost";

const id = "pion";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Pions";
    
    const pions = createResource<DecimalSource>(0, name, undefined, true);
    const productionModifiers = createSequentialModifier(() => [
        ...skyrmion.production,
        createMultiplicativeModifier(() => ({
            multiplier: spinor.upgrades.gamma.effect,
            enabled: () => Decimal.gt(unref(spinor.upgrades.gamma.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Spinor Upgrade γ ({format(unref(spinor.upgrades.gamma.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: spinor.upgrades.mu.effect,
            enabled: () => Decimal.gt(unref(spinor.upgrades.mu.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Spinor Upgrade μ ({format(unref(spinor.upgrades.mu.totalAmount))})</>))
        }))
    ]);
    const production = computed(() => productionModifiers.apply(unref(skyrmion.totalSkyrmions).times(0.01)));
    skyrmion.on("preUpdate", (diff: number) => {
        const delta = unref(acceleron.timeMult).times(diff);
        pions.value = delta.times(unref(production)).plus(pions.value);
    });

    const upgradeCount = computed(() => Object.values(upgrades).map(upgrade => unref(upgrade.amount)).reduce((a: Decimal, b) => a.plus(b), Decimal.dZero));
    const effectiveUpgradeCount: ComputedRef<Decimal> = computed(() => unref(upgradeCount).minus(getFomeBoost(FomeTypes.subspatial, 2)));
    const costNerf = computed(() => {
        const amount = unref(abyss.challenge.active) ? unref(abyss.upgradeCount) : unref(spinor.upgradeCount);
        const base = amount.times(0.2).times(unref(spinor.upgrades.beta.effect as ComputedRef<DecimalSource>)).plus(1);
        const exponent = amount.times(0.25).times(getFomeBoost(FomeTypes.quantum, 2) as DecimalSource);
        return base.pow(exponent);
    });
    const upgrades: Record<string, SkyrmionRepeatable> = {
        alpha: createUpgrade({
            cost(amount) {
                return amount.pow_base(1.2).times(0.1)
                             .step(25, value => value.times(value.pow_base(7.9)).times(3.42e-23))
                             .step(90, value => value.times(value.pow_base(19.75)).times(2.08e-104))
                             .times(getFomeBoost(FomeTypes.infinitesimal, 2) as DecimalSource);
            },
            shouldAutobuy: skyrmion.upgrades.alpha.bought,
            display: {
                name: "α",
                description: <>Gain 50% more Pions and Spinors</>
            },
            effect: amount => Decimal.pow(1.5, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[2].effect
        }),
        beta: createUpgrade({
            cost(amount) {
                return amount.pow_base(1.3).times(0.1)
                             .step(15, value => value.times(value.pow_base(7.7)).times(6e-14))
                             .step(45, value => value.times(value.pow_base(29.25)).times(1e-39))
                             .plus(0.9);
            },
            shouldAutobuy: skyrmion.upgrades.beta.bought,
            display: {
                name: "β",
                description: <>Reduce the nerf to Spinor upgrade cost by 10%</>,
                effect: effect => `Spinor upgrade cost nerf reduced to ${formatSmall(Decimal.times(effect as DecimalSource, 100))}%`
            },
            effect: amount => Decimal.pow(0.9, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[3].effect
        }),
        gamma: createUpgrade({
            cost(amount) {
                return amount.pow_base(1.7).times(0.1)
                             .step(10, value => value.times(value.pow_base(7.35)).times(2.68e-9))
                             .step(60, value => value.times(value.pow_base(29.4)).times(8.9e-74))
                             .plus(4.9).times(getFomeBoost(FomeTypes.infinitesimal, 5));
            },
            shouldAutobuy: skyrmion.upgrades.gamma.bought,
            display: {
                name: "γ",
                description: <>Gain 75% more Spinors</>
            },
            effect: amount => Decimal.pow(1.75, amount),
            bonusAmount: fome[FomeTypes.protoversal].boosts[4].effect
        }),
        delta: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.protoversal].boosts[1].total), 0),
            cost(amount) {
                return amount.pow_base(6).times(30)
                             .step(60, value => value.times(value.pow_base(37.5)).times(2.7e-71))
            },
            shouldAutobuy: skyrmion.upgrades.delta.bought,
            display: {
                name: "δ",
                description: <>Gain 70% more Protoversal Foam from Skyrmions</>
            },
            effect: amount => Decimal.pow(amount, 1.7),
            bonusAmount: fome[FomeTypes.subplanck].boosts[2].effect
        }),
        epsilon: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.infinitesimal].upgrades.reform.amount), 0),
            cost(amount) {
                return amount.pow_base(5).times(50)
                             .step(60, value => value.times(value.pow_base(28.8)).times(1.77e-65))
            },
            shouldAutobuy: skyrmion.upgrades.epsilon.bought,
            display: {
                name: "ε",
                description: <>Increase Protoversal Foam gain by 50% per order of magnitude of Infinitesimal Foam</>
            },
            effect: amount => Decimal.max(unref(fome[FomeTypes.infinitesimal].amount), 0).plus(1).log10().times(amount).times(0.5).plus(1),
            bonusAmount: fome[FomeTypes.subplanck].boosts[3].effect
        }),
        zeta: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.subspatial].upgrades.reform.amount), 0),
            cost(amount) {
                return amount.pow_base(5.5).times(5e3)
                             .step(60, value => value.times(value.pow_base(35.64)).times(1e-68))
            },
            shouldAutobuy: skyrmion.upgrades.zeta.bought,
            display: {
                name: "ζ",
                description: <>Increase Subspatial Foam gain by 5% per Skyrmion</>
            },
            effect: amount => unref(skyrmion.totalSkyrmions).times(amount).times(0.05).plus(1),
            bonusAmount: fome[FomeTypes.subplanck].boosts[4].effect
        }),
        eta: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.protoversal].upgrades.reform.amount), 1),
            cost(amount) {
                return amount.pow_base(5).times(3e5)
                             .step(60, value => value.times(value.pow_base(28.8)).times(1.77e-64))
            },
            shouldAutobuy: skyrmion.upgrades.eta.bought,
            display: {
                name: "η",
                description: <>Gain a free level of <b>Spinor Upgrade ε</b></>,
                effect: effect => `${format(effect as DecimalSource)} free levels`
            },
            bonusAmount: fome[FomeTypes.subplanck].boosts[5].effect
        }),
        theta: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.subplanck].upgrades.reform.amount), 0),
            cost(amount) {
                return amount.pow_base(6.5).times(7e5)
                             .step(45, value => value.times(value.pow_base(26)).times(5.45e-34))
            },
            shouldAutobuy: skyrmion.upgrades.theta.bought,
            display: {
                name: "θ",
                description: <>Increase Protoversal Foam gain by 100% per order of magnitude of Subspatial Foam</>
            },
            effect: amount => Decimal.max(unref(fome[FomeTypes.subspatial].amount), 0).plus(1).log10().times(amount).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[2].effect
        }),
        iota: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.protoversal].upgrades.reform.amount), 2),
            cost(amount) {
                return amount.pow_base(7.5).times(4e8)
                             .step(45, value => value.times(value.pow_base(30)).times(5.95e-48))
            },
            shouldAutobuy: skyrmion.upgrades.iota.bought,
            display: {
                name: "ι",
                description: <>Your Spinors increase Infinitesimal Foam generation by 2% per order of magnitude</>
            },
            effect: amount => Decimal.max(unref(spinor.spinors), 0).plus(1).log10().times(amount).times(0.02).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[4].effect
        }),
        kappa: createUpgrade({
            visibility: () => Decimal.gt(unref(fome[FomeTypes.infinitesimal].upgrades.reform.amount), 1),
            cost(amount) {
                return amount.pow_base(7).times(5e9)
                             .step(45, value => value.times(value.pow_base(26)).times(1.45e-43))
            },
            shouldAutobuy: skyrmion.upgrades.kappa.bought,
            display: {
                name: "κ",
                description: <>Protoversal Boost 1 levels each increase other Foam Boost 1 effects by 30%</>
            },
            effect: amount => Decimal.times(unref(fome[FomeTypes.protoversal].boosts[1].total), amount).times(0.3).plus(1),
            bonusAmount: fome[FomeTypes.quantum].boosts[4].effect
        }),
        lambda: createUpgrade({
            visibility: acceleron.upgrades.skyrmion.bought,
            cost(amount) {
                return amount.pow(1.1).pow_base(5).times(7e2)
                             .step(45, value => value.times(value.pow(1.1).pow_base(20)).times(7e-17))
            },
            shouldAutobuy: skyrmion.upgrades.lambda.bought,
            display: {
                name: "λ",
                description: <>Double the Infinitesimal Foam Boost 1 effect</>
            },
            effect: amount => Decimal.pow(2, amount)
        }),
        mu: createUpgrade({
            visibility: () => false,
            cost(amount) {
                return amount.pow_base(5).times(7e10)
                             .step(45, value => value.times(value.pow_base(20)).times(1e-35))
            },
            shouldAutobuy: skyrmion.upgrades.mu.bought,
            display: {
                name: "μ",
                description: <>Gain 2% more Spinors per order of magnitude<sup>2</sup> of stored Inflatons</>
            },
            effect: amount => Decimal.clamp(1, 1, 1).plus(9).log10().log10().times(0.02).plus(1).pow(amount)
        })
    }

    return {
        name,
        pions,
        upgradeCount: effectiveUpgradeCount,
        upgrades,
        display: jsx(() => (
            <ColumnVue>
                <div>You have <ResourceVue resource={pions} color={skyrmion.color} tag="h3" /> {pions.displayName}</div>
                <div style="font-size: 12px">Your Spinor upgrades are increasing Pion upgrade costs by {formatSmall(unref(costNerf).minus(1).times(100))}%</div>
                <SpacerVue />
                <PionVue />
            </ColumnVue>
        ))
    }

    interface PionRepeatableData {
        visibility?: Computable<Visibility | boolean>;
        cost(amount: GenericFormula): GenericFormula;
        shouldAutobuy: Computable<boolean>;
        display: {
            name: string;
            description: JSX.Element;
            effect?(effect: DecimalSource): CoercableComponent;
        };
        effect?(amount: DecimalSource): DecimalSource;
        bonusAmount?: Computable<DecimalSource>;
    }

    function createUpgrade(
        data: PionRepeatableData
    ): SkyrmionRepeatable {
        const { visibility, cost, shouldAutobuy, display, effect, bonusAmount } = data;
        const repeatable = createSkyrmionRepeatable({
            visibility,
            display,
            bonusAmount,
            effect,

            requirements: createCostRequirement(() => ({
                resource: noPersist(pions),
                cost: cost(Formula.variable(repeatable.amount)).times(costNerf),
                requiresPay: () => !unref(shouldAutobuy),
                spendResources: false
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