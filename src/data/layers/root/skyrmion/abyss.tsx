import { createChallenge } from "features/challenges/challenge";
import { jsx } from "features/feature";
import { Resource, createResource } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import { createCostRequirement } from "game/requirements";
import { computed, unref, watch } from "vue";
import skyrmion from "./skyrmion";
import { render } from "util/vue";
import { persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import pion from "./pion";
import spinor from "./spinor"

const id = "abyss";
const layer = createLayer(id, function (this: BaseLayer) {
    const color = "#ff0000";

    const challenge = createChallenge(feature => ({
        style: {
            border: 0,
            borderRadius: 0,
            clipPath: "polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%)",
            marginHorizontal: "50px",
            width: "250px",
            minWidth: "250px",
            minHeight: "250px",
            boxShadow: "0"
        },
        requirements: createCostRequirement(() => ({
            cost: feature.completions,
            resource: upgradeCount
        })),
        completionLimit: 4
    }));

    const challengeUpgradeCount = computed(() => Decimal.add(unref(pion.upgradeCount), unref(spinor.upgradeCount)).times(0.75));

    const upgradeCount: Resource<number> = createResource(computed(() =>
        [
            skyrmion.upgrades.nu,
            skyrmion.upgrades.pi,
            skyrmion.upgrades.xi,
            skyrmion.upgrades.rho
        ].filter(upgrade => unref(upgrade.bought)).length
    ), "Abyssal Skyrmion Upgrades");
    this.on("update", () => {
        if (Decimal.lt(unref(challenge.completions), unref(upgradeCount))) {
            challenge.completions.value = new Decimal(unref(upgradeCount));
        }
    })

    const swapData = {
        skyrmion: {
            conversion: { amoung: persistent<DecimalSource>(0) },
            pion: {
                pions: persistent<DecimalSource>(0),
                upgrades: Object.fromEntries(Object.keys(pion.upgrades).map(id => [id, { amount: persistent<DecimalSource>(0) }]))
            },
            spinor: {
                spinors: persistent<DecimalSource>(0),
                upgrades: Object.fromEntries(Object.keys(spinor.upgrades).map(id => [id, { amount: persistent<DecimalSource>(0) }]))
            }
        }
    }

    return {
        color,
        challenge,
        upgradeCount: challengeUpgradeCount,
        swapData,
        display: jsx(() => (
            <>
                {render(challenge)}
            </>
        ))
    }
});

export default layer;