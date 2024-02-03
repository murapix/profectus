import { jsx } from "features/feature";
import { createReset } from "features/reset";
import { BaseLayer, createLayer } from "game/layers";
import skyrmion from "../skyrmion/skyrmion";
import fome, { FomeTypes } from "../fome/fome";
import acceleron from "../acceleron/acceleron";
import timecube from "./timecube";
import inflaton from "../inflaton/inflaton";
import { GenericClickable, createClickable } from "features/clickables/clickable";
import { render } from "util/vue";
import { Sides } from "./timesquares";
import { Persistent, persistent } from "game/persistence";

const id = "timeline";
const layer = createLayer(id, function (this: BaseLayer) {
    
    const timelineToggles = (() => {
        const toggles = {} as Record<string, GenericClickable> & {active: Persistent<boolean>, next: Persistent<boolean>};

        const sides = [] as (keyof typeof Sides)[];
        for (const side in Sides) {
            sides.push(side as keyof typeof Sides);
        }
        for (let i = 0; i < sides.length; i++) {
            const firstSide = Sides[sides[i]];
            const firstSideName = firstSide[0].toUpperCase() + firstSide.slice(1);
            for (let j = i+1; j < sides.length; j++) {
                const otherSide = Sides[sides[j]];
                const otherSideName = otherSide[0].toUpperCase() + otherSide.slice(1);

                const active = persistent<boolean>(false);
                const next = persistent<boolean>(false);
                const button = createClickable(() => ({
                    display: `${firstSideName} ${otherSideName}`,
                    onClick() { next.value = !next.value; },
                }));
                const toggle = button as GenericClickable & {active: Persistent<boolean>, next: Persistent<boolean>};
                toggle.active = active;
                toggle.next = next;

                toggles[`${firstSide}_${otherSide}`] = toggle;
            }
        }

        return toggles;
    })();

    const enterTimeline = createClickable(() => ({
        display: 'Enter Timeline',
        onClick() {
            reset.reset();
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
        timelineToggles,
        display: jsx(() => (
            <>
                {render(enterTimeline)}
            </>
        ))
    }
});

export default layer;