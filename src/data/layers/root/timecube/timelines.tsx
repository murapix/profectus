import { StyleValue, jsx } from "features/feature";
import { createReset } from "features/reset";
import { BaseLayer, createLayer } from "game/layers";
import skyrmion from "../skyrmion/skyrmion";
import fome, { FomeTypes } from "../fome/fome";
import acceleron from "../acceleron/acceleron";
import timecube from "./timecube";
import inflaton from "../inflaton/inflaton";
import { GenericClickable, createClickable } from "features/clickables/clickable";
import { render, renderRow } from "util/vue";
import { Sides } from "./timesquares";
import { Persistent, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import SpacerVue from "components/layout/Spacer.vue";
import { format } from "util/break_eternity";
import { ComputedRef, computed, unref } from "vue";
import { createExponentialModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { createTimeline } from "./timeline";

const id = "timeline";
const layer = createLayer(id, function (this: BaseLayer) {
    
    const timelines = {
        topLeft: createTimeline({sides: [Sides.TOP, Sides.LEFT]}),
        topFront: createTimeline({sides: [Sides.TOP, Sides.FRONT]}),
        topBack: createTimeline({sides: [Sides.TOP, Sides.BACK]}),
        topRight: createTimeline({sides: [Sides.TOP, Sides.RIGHT]}),
        frontLeft: createTimeline({sides: [Sides.FRONT, Sides.LEFT]}),
        frontRight: createTimeline({sides: [Sides.FRONT, Sides.RIGHT]}),
        backLeft: createTimeline({sides: [Sides.BACK, Sides.LEFT]}),
        backRight: createTimeline({sides: [Sides.BACK, Sides.RIGHT]}),
        bottomLeft: createTimeline({sides: [Sides.BOTTOM, Sides.LEFT]}),
        bottomFront: createTimeline({sides: [Sides.BOTTOM, Sides.FRONT]}),
        bottomBack: createTimeline({sides: [Sides.BOTTOM, Sides.BACK]}),
        bottomRight: createTimeline({sides: [Sides.BOTTOM, Sides.RIGHT]})
    };

    const inTimeline = computed(() => Object.values(timelines).some(timeline => unref(timeline.active)));
    const depths: Record<Sides, ComputedRef<number>> = {
        [Sides.FRONT]: computed(() => [timelines.topFront, timelines.frontLeft, timelines.frontRight, timelines.bottomFront].filter(timeline => unref(timeline.active)).length),
        [Sides.RIGHT]: computed(() => [timelines.topRight, timelines.frontRight, timelines.backRight, timelines.bottomRight].filter(timeline => unref(timeline.active)).length),
        [Sides.TOP]: computed(() => [timelines.topLeft, timelines.topFront, timelines.topBack, timelines.topRight].filter(timeline => unref(timeline.active)).length),
        [Sides.BACK]: computed(() => [timelines.topBack, timelines.backLeft, timelines.backRight, timelines.bottomBack].filter(timeline => unref(timeline.active)).length),
        [Sides.LEFT]: computed(() => [timelines.topLeft, timelines.frontLeft, timelines.backLeft, timelines.bottomLeft].filter(timeline => unref(timeline.active)).length),
        [Sides.BOTTOM]: computed(() => [timelines.bottomLeft, timelines.bottomFront, timelines.bottomBack, timelines.bottomRight].filter(timeline => unref(timeline.active)).length)
    };

    const currentScoreModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier() { return [unref(skyrmion.pion.pions), unref(skyrmion.spinor.spinors)]
                .map(amount => Decimal.add(amount, 1).log10())
                .reduce((pions, spinors) => pions.plus(spinors))
                .dividedBy(10)
            },
            description: jsx(() => <>1/10th of the magnitude of {skyrmion.pion.pions.displayName} and {skyrmion.spinor.spinors.displayName}</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier() { return [FomeTypes.protoversal, FomeTypes.infinitesimal, FomeTypes.subspatial, FomeTypes.subplanck, FomeTypes.quantum]
                .map(type => Decimal.add(unref(fome[type].amount), 1).log10())
                .reduce((sum, magnitude) => sum.plus(magnitude), Decimal.dZero)
                .dividedBy(50)
            },
            description: jsx(() => <>1/50th of the magnitude of all types of Foam</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier() { return Decimal.add(unref(acceleron.accelerons), 1).log10() },
            description: jsx(() => <>The magnitude of {acceleron.accelerons.displayName}</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier() { return Decimal.add(unref(inflaton.buildings.buildings.storage.effect), 10).log10().log10().times(5) },
            description: jsx(() => <>5x the magnitude<sup>2</sup> of Stored {inflaton.inflatons.displayName}</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier() { return Decimal.add(unref(timecube.timecubes), 1).log10() },
            description: jsx(() => <>The magnitude of {timecube.timecubes.displayName}</>)
        })),
        createExponentialModifier(() => ({
            exponent() { return Object.values(timelines).filter(timeline => unref(timeline.active)).length / 2 },
            description: jsx(() => <>Number of active Timelines</>)
        }))
    ]);
    const currentScore = currentScoreModifiers.apply(1e-4);

    const enterTimeline = createClickable(() => ({
        display: 'Enter Timeline',
        onClick() {
            const score = new Decimal(unref(currentScore));
            for (const timeline of Object.values(timelines)) {
                if (!unref(timeline.active)) continue;
                if (score.gt(unref(timeline.score))) timeline.score.value = score;
            }
            reset.reset();
            fome.protoversal.upgrades.reform.amount.value = Decimal.dOne;
            for (const timeline of Object.values(timelines)) {
                timeline.active.value = unref(timeline.next);
            }
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
        timelines,
        display: jsx(() => (
            <>
                {render(enterTimeline)}
                <SpacerVue />
                {renderRow(timelines.topLeft, timelines.topFront, timelines.topBack, timelines.topRight)}
                {renderRow(timelines.frontLeft, timelines.frontRight, timelines.backLeft, timelines.backRight)}
                {renderRow(timelines.bottomLeft, timelines.bottomFront, timelines.bottomBack, timelines.bottomRight)}
            </>
        ))
    }
});

export default layer;