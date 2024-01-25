import { jsx } from "features/feature";
import { createReset } from "features/reset";
import { BaseLayer, createLayer } from "game/layers";
import skyrmion from "../skyrmion/skyrmion";
import fome, { FomeTypes } from "../fome/fome";
import acceleron from "../acceleron/acceleron";
import timecube from "./timecube";
import inflaton from "../inflaton/inflaton";
import { clonePersistentData, swapPersistentData } from "util/util";
import { createClickable } from "features/clickables/clickable";
import { isSwapping } from "util/save";

const id = "timeline";
const layer = createLayer(id, function (this: BaseLayer) {
    const originalData = {
        skyrmion: {
            skyrmions: clonePersistentData(skyrmion.conversion),
            pion: clonePersistentData(skyrmion.pion),
            spinor: clonePersistentData(skyrmion.spinor)
        },
        fome: {
            [FomeTypes.protoversal]: clonePersistentData(fome[FomeTypes.protoversal]),
            [FomeTypes.infinitesimal]: clonePersistentData(fome[FomeTypes.infinitesimal]),
            [FomeTypes.subspatial]: clonePersistentData(fome[FomeTypes.subspatial]),
            [FomeTypes.subplanck]: clonePersistentData(fome[FomeTypes.subplanck]),
            [FomeTypes.quantum]: clonePersistentData(fome[FomeTypes.quantum]),
        },
        acceleron: {
            accelerons: clonePersistentData(acceleron.accelerons),
            bestAccelerons: clonePersistentData(acceleron.bestAccelerons),
            totalAccelerons: clonePersistentData(acceleron.totalAccelerons),
            upgrades: {
                acceleration: clonePersistentData(acceleron.upgrades.acceleration),
                fluctuation: clonePersistentData(acceleron.upgrades.fluctuation),
                conversion: clonePersistentData(acceleron.upgrades.conversion),
                translation: clonePersistentData(acceleron.upgrades.translation),
                alacrity: clonePersistentData(acceleron.upgrades.alacrity)
            }
        },
        timecube: {
            timecubes: clonePersistentData(timecube.timecubes)
        },
        inflaton: {
            inflatons: clonePersistentData(inflaton.inflatons),
            buildings: {
                buildings: clonePersistentData(inflaton.buildings.buildings),
                maxSize: clonePersistentData(inflaton.buildings.maxSize)
            },
            inflating: clonePersistentData(inflaton.inflating),
            upgrades: {
                moreFome: clonePersistentData(inflaton.upgrades.moreFome)
            },
            coreResearch: {
                repeatables: {
                    buildingSize: clonePersistentData(inflaton.coreResearch.repeatables.buildingSize)
                }
            }
        }
    };

    const enterTimeline = createClickable(() => ({
        onClick() {
            isSwapping.value = true;
            swapPersistentData({skyrmion, fome, acceleron, timecube, inflaton}, originalData);
            isSwapping.value = false;
        }
    }));

    const reset = createReset(() => ({
        thingsToReset() {
            return [
                skyrmion.skyrmions,
                skyrmion.pion,
                skyrmion.spinor,

                fome[FomeTypes.protoversal],
                fome[FomeTypes.infinitesimal],
                fome[FomeTypes.subspatial],
                fome[FomeTypes.subplanck],
                fome[FomeTypes.quantum],

                acceleron.accelerons,
                acceleron.totalAccelerons,
                acceleron.upgrades.acceleration,
                acceleron.upgrades.fluctuation,
                acceleron.upgrades.conversion,
                acceleron.upgrades.translation,
                acceleron.upgrades.alacrity,
                
                timecube.timecubes,

                inflaton.inflatons,
                inflaton.buildings.buildings,
                inflaton.buildings.maxSize,
                inflaton.inflating,
                inflaton.upgrades.moreFome,
                inflaton.coreResearch.repeatables.buildingSize
            ];
        }
    }));

    return {
        display: jsx(() => <>TODO: Fill</>),

        originalData
    }
});

function saveOriginalData() {
    return 
}