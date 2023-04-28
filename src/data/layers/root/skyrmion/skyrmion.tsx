import { Visibility, jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import { createMultiplicativeModifier } from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { computed, unref } from "vue";
import { createSkyrmionUpgrade } from "./upgrade";
import { createCostRequirement, requirementsMet } from "game/requirements";
import { Computable } from "util/computed";
import fome, { FomeTypes } from "../fome/fome";
import pion from "./pion";
import spinor from "./spinor";
import { GenericUpgrade } from "features/upgrades/upgrade";
import SpacerVue from "components/layout/Spacer.vue";
import RowVue from "components/layout/Row.vue";
import { render } from "util/vue";
import SkyrmionVue from "./Skyrmion.vue";
import { GenericRepeatable, createRepeatable } from "features/repeatable";
import { addTooltip } from "features/tooltips/tooltip";
import { Direction } from "util/common";
import { format } from "util/break_eternity";
import abyss from "./abyss";
import ResourceVue from "features/resources/Resource.vue";
import Formula from "game/formulas/formulas";
import { getFomeBoost } from "../fome/boost";

const id = "skyrmion";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Skyrmions";
    const color = "#37d7ff";

    const conversion: GenericRepeatable = createRepeatable(feature => ({
        maximize: true,
        initialAmount: 1,
        requirements: [
            createCostRequirement(() => ({
                resource: pion.pions,
                requiresPay: () => !unref(upgrades.autoGain.bought),
                spendResources: false,
                cost: Formula.variable(feature.amount)
                             .pow10()
                             .dividedBy(fome.infinitesimal.boosts[4].effect)
                             .dividedBy(spinor.upgrades.alpha.effect)
            })),
            createCostRequirement(() => ({
                resource: spinor.spinors,
                requiresPay: () => !unref(upgrades.autoGain.bought),
                spendResources: false,
                cost: Formula.variable(feature.amount)
                             .pow10()
                             .dividedBy(fome.infinitesimal.boosts[4].effect)
                             .dividedBy(spinor.upgrades.alpha.effect)
            }))
        ],
        style: { paddingHorizontal: "20px" },
        display: jsx(() => (
            <>
                <h3>Convert 10<sup>X</sup> Pions and Spinors to X Skyrmions</h3>
            </>
        ))
    }));
    addTooltip(conversion, {
        direction: Direction.Up,
        display: jsx(() => (
            <>
                Next at 10<sup>X+1</sup> Pions and Spinors
            </>
        ))
    });
    this.on("update", () => {
        if (unref(upgrades.autoGain.bought) && requirementsMet(conversion.requirements)) {
            conversion.onClick();
        }
    })

    const skyrmions = createResource<DecimalSource>(conversion.amount, name);
    const totalSkyrmions = computed(() => Decimal.add(unref(skyrmions), 0));
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
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 20);
            },
            display: {
                title: "Alteration",
                description: <>Autobuy α upgrades<br />α upgrades no longer consume Pions or Spinors</>
            },
            cost: 24
        }),
        beta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 25);
            },
            display: {
                title: "Benediction",
                description: <>Autobuy β upgrades<br />β upgrades no longer consume Pions or Spinors</>
            },
            cost: 28
        }),
        gamma: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 30);
            },
            display: {
                title: "Consolidation",
                description: <>Autobuy γ upgrades<br />γ upgrades no longer consume Pions or Spinors</>
            },
            cost: 32
        }),
        delta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 35);
            },
            display: {
                title: "Diversification",
                description: <>Autobuy δ upgrades<br />δ upgrades no longer consume Pions or Spinors</>
            },
            cost: 36
        }),
        epsilon: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 40);
            },
            display: {
                title: "Encapsulation",
                description: <>Autobuy ε upgrades<br />ε upgrades no longer consume Pions or Spinors</>
            },
            cost: 42
        }),
        zeta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 45);
            },
            display: {
                title: "Fabrication",
                description: <>Autobuy ζ upgrades<br />ζ upgrades no longer consume Pions or Spinors</>
            },
            cost: 48
        }),
        eta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 50);
            },
            display: {
                title: "Germination",
                description: <>Autobuy η upgrades<br />η upgrades no longer consume Pions or Spinors</>
            },
            cost: 52
        }),
        theta: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 55);
            },
            display: {
                title: "Hesitation",
                description: <>Autobuy θ upgrades<br />θ upgrades no longer consume Pions or Spinors</>
            },
            cost: 56
        }),
        iota: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 60);
            },
            display: {
                title: "Immitation",
                description: <>Autobuy ι upgrades<br />ι upgrades no longer consume Pions or Spinors</>
            },
            cost: 64
        }),
        kappa: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 65);
            },
            display: {
                title: "Juxtaposition",
                description: <>Autobuy κ upgrades<br />κ upgrades no longer consume Pions or Spinors</>
            },
            cost: 69
        }),
        lambda: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 70);
            },
            display: {
                title: "Lateralization",
                description: <>Autobuy λ upgrades<br />λ upgrades no longer consume Pions or Spinors</>
            },
            cost: 72
        }),
        mu: createUpgrade({
            visibility(this: GenericUpgrade) {
                return unref(this.bought) || Decimal.gte(unref(skyrmions), 75);
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
        conversion,
        skyrmions,
        totalSkyrmions,
        production: generalProductionModifiers,
        upgrades,
        display: jsx(() => (
            <>
                You have <ResourceVue resource={skyrmions} color={color} tag="h2" /> {skyrmions.displayName}
                {Decimal.gt(getFomeBoost(FomeTypes.subspatial, 4), 0)
                ?   <><br />Your {fome.subspatial.amount.displayName} is granting an additional <h3 style={{ color, textShadow: `0px 0px 10px ${color}` }}>
                        {format(getFomeBoost(FomeTypes.subspatial, 4))}
                    </h3> {skyrmions.displayName}</>
                : undefined}
                <SpacerVue />
                <RowVue><div style={{ flexFlow: "row nowrap" }}>
                    {render(pion.display)}
                    {render(unref(abyss.display))}
                    {render(spinor.display)}
                </div></RowVue>
                <SpacerVue />
                <SkyrmionVue>{render(conversion)}</SkyrmionVue>
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
                resource: skyrmions,
                requiresPay: false
            })),
            display,
            onPurchase
        })
    }
});

export default layer;