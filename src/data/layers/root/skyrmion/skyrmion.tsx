import { Visibility, jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import { createMultiplicativeModifier } from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { computed, unref } from "vue";
import { createSkyrmionUpgrade } from "./upgrade";
import { createCostRequirement, maxRequirementsMet, requirementsMet } from "game/requirements";
import { Computable, ProcessedComputable } from "util/computed";
import fome, { FomeTypes } from "../fome/fome";
import pion from "./pion";
import spinor from "./spinor";
import { GenericUpgrade } from "features/upgrades/upgrade";
import Spacer from "components/layout/Spacer.vue";
import Row from "components/layout/Row.vue";
import { render } from "util/vue";
import Skyrmion from "./Skyrmion.vue";
import { GenericRepeatable, createRepeatable } from "features/repeatable";
import { addTooltip } from "features/tooltips/tooltip";
import { Direction } from "util/common";
import { format, formatWhole } from "util/break_eternity";
import abyss from "./abyss";
import Resource from "features/resources/Resource.vue";
import Formula, { calculateCost } from "game/formulas/formulas";
import { getFomeBoost } from "../fome/boost";
import { noPersist } from "game/persistence"
import entangled from "../entangled/entangled";

const id = "skyrmion";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Skyrmions";
    const color = "#37d7ff";

    const costFunc = (
        amount: ProcessedComputable<DecimalSource>
    ) => Formula.variable(amount)
                .pow10()
                .dividedBy(fome.infinitesimal.boosts[4].effect)
                .dividedBy(spinor.upgrades.alpha.effect);
    const skyrmions: GenericRepeatable = createRepeatable(feature => {
        return {
            initialAmount: 1,
            requirements: [
                createCostRequirement(() => ({
                    resource: noPersist(pion.pions),
                    requiresPay: () => !unref(upgrades.autoGain.bought),
                    cumulativeCost: true,
                    maxBulkAmount: 10, // TODO: Set to Decimal.dInf once integration is better
                    cost: costFunc(feature.amount)
                })),
                createCostRequirement(() => ({
                    resource: noPersist(spinor.spinors),
                    requiresPay: () => !unref(upgrades.autoGain.bought),
                    cumulativeCost: true,
                    maxBulkAmount: 10, // TODO: Set to Decimal.dInf once integration is better
                    cost: costFunc(feature.amount)
                }))
            ],
            style: { paddingHorizontal: "20px" },
            display: jsx(() => {
                const formula = costFunc(feature.amount);
                const maxAffordable = Decimal.clampMin(maxRequirementsMet(skyrmions.requirements), 1);
                const cost = calculateCost(formula, Decimal.clampMin(maxAffordable, 1), true);
                return <>
                    <h3>Convert {format(cost)} Pions and Spinors to {formatWhole(maxAffordable)} Skyrmions</h3>
                </>
            })
        }
    });
    addTooltip(skyrmions, {
        direction: Direction.Up,
        display: jsx(() => {
            const formula = costFunc(skyrmions.amount);
            const maxAffordable = maxRequirementsMet(skyrmions.requirements);
            const cost = calculateCost(formula, Decimal.add(maxAffordable, 1), true);
            return <>
                Next at {format(cost)} Pions and Spinors
            </>
        })
    });
    this.on("update", () => {
        if (unref(upgrades.autoGain.bought) && requirementsMet(skyrmions.requirements)) {
            skyrmions.onClick();
        }
    })

    const resource = createResource<DecimalSource>(skyrmions.amount, name);
    const totalSkyrmions = computed(() => Decimal.add(unref(resource), getFomeBoost(FomeTypes.subspatial, 4)));
    const generalProductionModifiers = [
        createMultiplicativeModifier(() => ({
            multiplier: pion.upgrades.alpha.effect,
            enabled: () => Decimal.gt(unref(pion.upgrades.alpha.totalAmount), 0),
            description: jsx(() => (<>[{name}] Pion Upgrade α ({format(unref(pion.upgrades.alpha.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: spinor.upgrades.zeta.effect,
            enabled: () => Decimal.gt(unref(spinor.upgrades.zeta.totalAmount), 0),
            description: jsx(() => (<>[{name}] Spinor Upgrade ζ ({format(unref(spinor.upgrades.zeta.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: spinor.upgrades.lambda.effect,
            enabled: () => Decimal.gt(unref(spinor.upgrades.lambda.totalAmount), 0),
            description: jsx(() => (<>[{name}] Spinor Upgrade λ ({format(unref(spinor.upgrades.lambda.totalAmount))})</>))
        }))
    ];

    const upgrades = {
        fome: createUpgrade({
            display: {
                title: "Condensation",
                description: <>Begin Foam generation</>
            },
            cost: 10,
            onPurchase() { fome.protoversal.upgrades.reform.amount.value = Decimal.dOne }
        }),
        autoGain: createUpgrade({
            display: {
                title: "Reformation",
                description: <>Automatically gain Skyrmions; they don't cost Pions or Spinors</>
            },
            cost: 16
        }),
        alpha: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 20);
            },
            display: {
                title: "Alteration",
                description: <>Autobuy α upgrades<br />α upgrades no longer consume Pions or Spinors</>
            },
            cost: 24
        }),
        beta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 25);
            },
            display: {
                title: "Benediction",
                description: <>Autobuy β upgrades<br />β upgrades no longer consume Pions or Spinors</>
            },
            cost: 28
        }),
        gamma: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 30);
            },
            display: {
                title: "Consolidation",
                description: <>Autobuy γ upgrades<br />γ upgrades no longer consume Pions or Spinors</>
            },
            cost: 32
        }),
        delta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 35);
            },
            display: {
                title: "Diversification",
                description: <>Autobuy δ upgrades<br />δ upgrades no longer consume Pions or Spinors</>
            },
            cost: 36
        }),
        epsilon: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 40);
            },
            display: {
                title: "Encapsulation",
                description: <>Autobuy ε upgrades<br />ε upgrades no longer consume Pions or Spinors</>
            },
            cost: 42
        }),
        zeta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 45);
            },
            display: {
                title: "Fabrication",
                description: <>Autobuy ζ upgrades<br />ζ upgrades no longer consume Pions or Spinors</>
            },
            cost: 48
        }),
        eta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 50);
            },
            display: {
                title: "Germination",
                description: <>Autobuy η upgrades<br />η upgrades no longer consume Pions or Spinors</>
            },
            cost: 52
        }),
        theta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 55);
            },
            display: {
                title: "Hesitation",
                description: <>Autobuy θ upgrades<br />θ upgrades no longer consume Pions or Spinors</>
            },
            cost: 56
        }),
        iota: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 60);
            },
            display: {
                title: "Immitation",
                description: <>Autobuy ι upgrades<br />ι upgrades no longer consume Pions or Spinors</>
            },
            cost: 64
        }),
        kappa: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 65);
            },
            display: {
                title: "Juxtaposition",
                description: <>Autobuy κ upgrades<br />κ upgrades no longer consume Pions or Spinors</>
            },
            cost: 69
        }),
        lambda: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 70);
            },
            display: {
                title: "Lateralization",
                description: <>Autobuy λ upgrades<br />λ upgrades no longer consume Pions or Spinors</>
            },
            cost: 72
        }),
        mu: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(resource), 75);
            },
            display: {
                title: "Materialization",
                description: <>Autobuy μ upgrades<br />μ upgrades no longer consume Pions or Spinors</>
            },
            cost: 92
        }),
        nu: createUpgrade({
            visibility(this: GenericUpgrade) {
                return false;
            },
            display: {
                title: "Neutralization",
                description: <>Autobuy ν upgrades<br />ν upgrades no longer consume Pions or Spinors</>
            },
            cost: Decimal.dInf
        }),
        xi: createUpgrade({
            visibility(this: GenericUpgrade) {
                return false;
            },
            display: {
                title: "Externalization",
                description: <>Autobuy ξ upgrades<br />ξ upgrades no longer consume Pions or Spinors</>
            },
            cost: Decimal.dInf
        }),
        pi: createUpgrade({
            visibility(this: GenericUpgrade) {
                return false;
            },
            display: {
                title: "Prioritization",
                description: <>Autobuy π upgrades<br />π upgrades no longer consume Pions or Spinors</>
            },
            cost: Decimal.dInf
        }),
        rho: createUpgrade({
            visibility(this: GenericUpgrade) {
                return false;
            },
            display: {
                title: "Obfuscation",
                description: <>Autobuy ρ upgrades<br />ρ upgrades no longer consume Pions or Spinors</>
            },
            cost: Decimal.dInf
        })
    }

    return {
        name,
        color,
        conversion: skyrmions,
        skyrmions: resource,
        totalSkyrmions,
        production: generalProductionModifiers,
        upgrades,
        display: jsx(() => (
            <>
                You have <Resource resource={resource} color={color} tag="h2" /> {resource.displayName}
                {Decimal.gt(getFomeBoost(FomeTypes.subspatial, 4), 0)
                ?   <><br />Your {fome.subspatial.amount.displayName} is granting an additional <h3 style={{ color, textShadow: `0px 0px 10px ${color}` }}>
                        {format(getFomeBoost(FomeTypes.subspatial, 4))}
                    </h3> {resource.displayName}</>
                : undefined}
                <Spacer />
                <div class="row" style={{ flexFlow: "row nowrap" }}>
                    {render(pion.display)}
                    {unref(entangled.expansions.skyrmion.bought) ? render(unref(abyss.display)) : <Spacer width='250px' height='250px' />}
                    {render(spinor.display)}
                </div>
                <Spacer />
                <Skyrmion>{render(skyrmions)}</Skyrmion>
            </>
        )),
        
        pion,
        spinor,
        abyss
    }

    interface SkyrmionUpgradeData {
        visibility?: Computable<Visibility | boolean>;
        cost: DecimalSource;
        display: {
            title: string,
            description: JSX.Element;
        };
        onPurchase?(): void;
    }

    function createUpgrade(data: SkyrmionUpgradeData): GenericUpgrade {
        const { visibility, cost, display, onPurchase } = data;
        return createSkyrmionUpgrade({
            visibility,
            requirements: createCostRequirement(() => ({
                cost,
                resource: noPersist(resource),
                requiresPay: false
            })),
            display,
            onPurchase
        })
    }
});

export default layer;