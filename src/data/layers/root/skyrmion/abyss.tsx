import { createChallenge } from "features/challenges/challenge";
import { jsx } from "features/feature";
import { Resource, createResource } from "features/resources/resource";
import { BaseLayer, createLayer, layers } from "game/layers";
import { persistent } from "game/persistence";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { clonePersistentData, swapPersistentData } from "util/util";
import { computed, unref, watch } from "vue";
import acceleron from "../acceleron/acceleron";
import fome from "../fome/fome";
import inflaton from "../inflaton/inflaton";
import timecube from "../timecube/timecube";
import AbyssChallenge from "./AbyssChallenge.vue";
import pion from "./pion";
import skyrmion from "./skyrmion";
import spinor from "./spinor";

const id = "abyss";
const layer = createLayer(id, function (this: BaseLayer) {
    const theme = {
        "--feature-background": "#ff0000"
    };

    const challenge = createChallenge(feature => ({
        requirements: createCostRequirement(() => ({
            cost: () => Decimal.add(unref(feature.completions), 1),
            resource: upgradeCount,
            requiresPay: false
        })),
        completionLimit: 4,
        onEnter() {
            swapPersistentData(layers, swapData);
            if (Decimal.lt(unref(fome.protoversal.upgrades.reform.amount), 1)) {
                fome.protoversal.upgrades.reform.amount.value = 1;
            }
        },
        onExit() {
            swapPersistentData(layers, swapData);
            if (Decimal.lt(unref(fome.protoversal.upgrades.reform.amount), 1)) {
                fome.protoversal.upgrades.reform.amount.value = 1;
            }
        }
    }));

    const challengeUpgradeCount = computed(() => Decimal.add(unref(pion.upgradeCount), unref(spinor.upgradeCount)).times(0.75));

    const upgradeCount: Resource<number> = createResource(computed(() =>
        [ skyrmion.upgrades.nu, skyrmion.upgrades.xi, skyrmion.upgrades.pi, skyrmion.upgrades.rho ].filter(upgrade => unref(upgrade.bought)).length
    ), { displayName: "Abyssal Skyrmion Upgrades", singularName: "Abyssal Skyrmion Upgrade" });
    watch(upgradeCount, count => challenge.completions.value = Decimal.max(unref(challenge.completions), count));

    const swapData: Record<string, unknown> = (() => {
        const swapData = {
            skyrmion: {
                conversion: { amount: persistent<DecimalSource>(1) },
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
        theme,
        challenge,
        upgradeCount: challengeUpgradeCount,
        abyssUpgradeCount: upgradeCount,
        swapData,
        display: jsx(() => (
            <>
                <AbyssChallenge challenge={challenge} />
            </>
        ))
    }
});

export default layer;