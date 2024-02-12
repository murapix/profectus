import { jsx } from "features/feature";
import { createReset } from "features/reset";
import { BaseLayer, createLayer } from "game/layers";
import skyrmion from "../skyrmion/skyrmion";
import fome, { FomeTypes } from "../fome/fome";
import acceleron from "../acceleron/acceleron";
import timecube from "./timecube";
import inflaton from "../inflaton/inflaton";
import { createClickable } from "features/clickables/clickable";
import { render, renderRow } from "util/vue";
import { Sides } from "./timesquares";
import Decimal, { DecimalSource } from "lib/break_eternity";
import Spacer from "components/layout/Spacer.vue";
import { ComputedRef, computed, unref } from "vue";
import { createExponentialModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { GenericTimeline, createTimeline } from "./timeline";
import { createModifierModal } from "util/util";
import { format } from "util/break_eternity";

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

    const timelineSides: Record<Sides, GenericTimeline[]> = {
        [Sides.FRONT]: [timelines.topFront, timelines.frontLeft, timelines.frontRight, timelines.bottomFront],
        [Sides.RIGHT]: [timelines.topRight, timelines.frontRight, timelines.backRight, timelines.bottomRight],
        [Sides.TOP]: [timelines.topLeft, timelines.topFront, timelines.topBack, timelines.topRight],
        [Sides.BACK]: [timelines.topBack, timelines.backLeft, timelines.backRight, timelines.bottomBack],
        [Sides.LEFT]: [timelines.topLeft, timelines.frontLeft, timelines.backLeft, timelines.bottomLeft],
        [Sides.BOTTOM]: [timelines.bottomLeft, timelines.bottomFront, timelines.bottomBack, timelines.bottomRight]
    }

    const activeDepths = Object.fromEntries(
        Object.entries(timelineSides).map(
            ([side, timelines]) => [side, computed(() => (timelines as GenericTimeline[]).filter(
                timeline => unref(timeline.active)
            ).length)]
        )
    );
    const nextDepths = Object.fromEntries(
        Object.entries(timelineSides).map(
            ([side, timelines]) => [side, computed(() => (timelines as GenericTimeline[]).filter(
                timeline => unref(timeline.next)
            ).length)]
        )
    );
    const inTimeline = computed(() => Object.values(activeDepths).some(depth => unref(depth) > 0));

    const sidedScoreMulti: Record<Sides, DecimalSource> = {
        [Sides.FRONT]: 100,
        [Sides.RIGHT]: 0.01,
        [Sides.TOP]: 1,
        [Sides.BACK]: 1,
        [Sides.LEFT]: 1000,
        [Sides.BOTTOM]: 1
    };
    const scores = Object.fromEntries(
        Object.entries(timelineSides).map(
            ([side, timelines]) => [side, computed(() => (timelines as GenericTimeline[]).reduce(
                (sum, timeline) => sum.plus(unref(timeline.score)), Decimal.dZero)
            )]
        )
    );
    const passiveBuffs = Object.fromEntries(
        Object.entries(scores).map(
            ([side, score]) => [side, computed(() => unref(score).times(sidedScoreMulti[side as Sides]).plus(1))]
        )
    );

    const depthNerfs: Record<Sides, DecimalSource[]> = {
        [Sides.FRONT]: [1, 1e8, 1e80, '1e800', '1e8000'],
        [Sides.RIGHT]: [1, 1e12, 1e120, '1e1200', '1e12000'],
        [Sides.TOP]: [1, 1e3, 1e30, 1e300, '1e3000'],
        [Sides.BACK]: [1, 1e6, 1e60, '1e600', '1e6000'],
        [Sides.LEFT]: [1, 1e2, 1e20, 1e200, '1e2000'],
        [Sides.BOTTOM]: [1, 1e5, 1e50, '1e500', '1e5000']
    };
    const activeDepthNerfs = Object.fromEntries(
        Object.entries(activeDepths).map(
            ([side, depth]) => [side, computed(() => 
                unref(depthNerfs[side as Sides])[unref(depth)]
            )]
        )
    );
    const nextDepthNerfs = Object.fromEntries(
        Object.entries(nextDepths).map(
            ([side, depth]) => [side, computed(() => 
                unref(depthNerfs[side as Sides])[unref(depth)]
            )]
        )
    );
    
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
    const currentScore: ComputedRef<DecimalSource> = computed(() => currentScoreModifiers.apply(1e-4));

    const enterTimeline = createClickable(() => ({
        display() {
            if (Object.values(timelines).some(timeline => unref(timeline.next))) return 'Enter Timeline';
            if (Object.values(timelines).some(timeline => unref(timeline.active))) return 'Exit Timeline';
            return 'Enter Timeline';
        },
        canClick() {
            return Object.values(timelines).some(timeline => unref(timeline.next) || unref(timeline.active))
        },
        onClick() {
            const score = new Decimal(unref(currentScore));
            for (const timeline of Object.values(timelines)) {
                if (!unref(timeline.active)) continue;
                if (score.gt(unref(timeline.score))) timeline.score.value = score;
            }
            reset.reset();
            fome.protoversal.upgrades.reform.amount.value = Decimal.dOne;
            inflaton.inflatons.value = Decimal.dOne;
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

    const modifiersModal = createModifierModal("Timeline Score", () => [
        {
            title: "Timeline Score",
            modifier: currentScoreModifiers,
            base: 1e-4
        }
    ]);

    return {
        timelines,
        scores,
        buffs: passiveBuffs,
        nerfs: activeDepthNerfs,
        depths: activeDepths,
        scoreMultipliers: sidedScoreMulti,
        inTimeline,
        display: jsx(() => (
            <>
                {render(enterTimeline)}
                <Spacer />
                {renderRow(timelines.topLeft, timelines.topFront, timelines.topBack, timelines.topRight)}
                {renderRow(timelines.frontLeft, timelines.frontRight, timelines.backLeft, timelines.backRight)}
                {renderRow(timelines.bottomLeft, timelines.bottomFront, timelines.bottomBack, timelines.bottomRight)}
                <Spacer />
                Current Score: {format(unref(currentScore))}{render(modifiersModal)}
            </>
        ))
    }
});

export default layer;