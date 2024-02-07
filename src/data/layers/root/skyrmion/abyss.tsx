import { createChallenge } from "features/challenges/challenge";
import { jsx } from "features/feature";
import { Resource, createResource } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import { createCostRequirement } from "game/requirements";
import { computed, unref, watch } from "vue";
import skyrmion from "./skyrmion";
import { render } from "util/vue";
import { noPersist } from "game/persistence";
import Decimal from "lib/break_eternity";
import pion from "./pion";
import spinor from "./spinor"
import { clonePersistentData } from "util/util";
import fome from "../fome/fome";
import acceleron from "../acceleron/acceleron";
import timecube from "../timecube/timecube";
import inflaton from "../inflaton/inflaton";

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
            cost: noPersist(feature.completions),
            resource: upgradeCount
        })),
        completionLimit: 4
    }));

    const challengeUpgradeCount = computed(() => Decimal.add(unref(pion.upgradeCount), unref(spinor.upgradeCount)).times(0.75));

    const upgradeCount: Resource<number> = createResource(computed(() =>
        [ skyrmion.upgrades.nu, skyrmion.upgrades.pi, skyrmion.upgrades.xi, skyrmion.upgrades.rho ].filter(upgrade => unref(upgrade.bought)).length
    ), "Abyssal Skyrmion Upgrades");
    watch(upgradeCount, count => challenge.completions.value = Decimal.max(unref(challenge.completions), count));

    const swapData: Record<string, unknown> = (() => {
        const swapData = {
            skyrmion: {
                conversion: clonePersistentData(skyrmion.conversion),
                pion: clonePersistentData(skyrmion.pion),
                spinor: clonePersistentData(skyrmion.spinor)
            },
            fome: {
                protoversal: clonePersistentData(fome.protoversal),
                infinitesimal: clonePersistentData(fome.infinitesimal),
                subspatial: clonePersistentData(fome.subspatial),
                subplanck: clonePersistentData(fome.subplanck),
                quantum: clonePersistentData(fome.quantum)
            },
            acceleron: {
                accelerons: clonePersistentData(acceleron.accelerons),
                bestAccelerons: clonePersistentData(acceleron.bestAccelerons),
                totalAccelerons: clonePersistentData(acceleron.totalAccelerons),
                entropy: clonePersistentData(acceleron.entropy),
                loops: clonePersistentData(acceleron.loops),
                upgrades: clonePersistentData(acceleron.upgrades)
            },
            timecube: clonePersistentData(timecube),
            inflaton: clonePersistentData(inflaton)
        };

        return swapData;
    })();

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