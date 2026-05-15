import Spacer from "components/layout/Spacer.vue";
import { createClickable } from "features/clickables/clickable";
import { isVisible } from "features/feature";
import NamedResource from "features/resources/NamedResource.vue";
import { createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { noPersist, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { render } from "util/vue";
import { CSSProperties, ComputedRef, computed, ref, unref } from "vue";
import fome, { FomeTypes } from "../../fome/fome";
import skyrmion from "../../skyrmion/skyrmion";
import timecube from "../../timecube/timecube";
import timelines from "../../timecube/timelines";
import { Sides } from "../../timecube/timesquares";
import LoopDescriptions from "./LoopDescriptions.vue";
import Loops from "./Loops.vue";
import acceleron from "../acceleron";
import entropy from "../enhancements/entropy";
import { createLoop } from "./loop";
import { getUpgradeEffect } from "features/clickables/upgrade";
import { inAbyss } from "data/projEntry";

const id = "loops";
const layer = createLayer(id, () => {
    const isBuilding = persistent<boolean>(false);

    const toggleBuilding = createClickable(() => ({
        visibility: noPersist(acceleron.upgrades.superstructures.bought),
        canClick() { return unref(nextLoop) !== undefined; },
        onClick() { isBuilding.value = !unref(isBuilding); },
        display: () => ( <h3>{unref(isBuilding) ? "Halt" : "Begin"}<br/>Construction</h3> ),
        style(): CSSProperties {
            return {
                borderRadius: '50%',
                borderColor: unref(toggleBuilding.canClick) ? 'var(--feature-background)' : 'var(--locked)',

                backgroundColor: 'var(--transparent)',
                color: unref(toggleBuilding.canClick) ? 'var(--feature-background)' : 'var(--locked)'
            }
        }
    }));

    const buildSpeedModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.construction.effect!,
            enabled: noPersist(entropy.enhancements.construction.bought),
            description: () => <>[{acceleron.name}] Entropic Construction</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: timecube.upgrades.ten.effect,
            enabled: noPersist(timecube.upgrades.ten.bought),
            description: () => <>[{timecube.name}] Ten</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.pi.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.pi.totalAmount), 0),
            description: () => <>[{skyrmion.name}] {unref(skyrmion.pion.pions.singularName)} Upgrade π ({format(unref(skyrmion.pion.upgrades.pi.totalAmount))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: timecube.getTimesquareEffect(Sides.RIGHT),
            enabled: () => Decimal.gt(unref(timecube.timesquares.squares[Sides.RIGHT].square.amount), 0),
            description: () => <>[{timecube.name}] Right Time Squares ({formatWhole(unref(timecube.timesquares.squares[Sides.RIGHT].square.amount))})</>
        }))
    ]);
    const buildSpeed = computed(() => buildSpeedModifiers.apply(unref(acceleron.timeMult)));
    const buildCostModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.development.effect!,
            enabled: noPersist(entropy.enhancements.development.bought),
            description: () => <>[{acceleron.name}] Entropic Development</>,
            smallerIsBetter: true
        }))
    ]);
    const buildCost: ComputedRef<DecimalSource> = computed(() => buildCostModifiers.apply(1));
    const remainingBuildAmount = computed(() => {
        const loop = unref(nextLoop);
        if (loop === undefined) return Decimal.dZero;
        return Decimal.minus(unref(loop.buildRequirement), unref(loop.buildProgress));
    })
    const remainingBuildCost = computed(() => unref(remainingBuildAmount).times(unref(buildCost)));

    acceleron.on("update", diff => {
        if (!unref(isBuilding)) return;
        const loop = unref(nextLoop);
        if (loop === undefined) {
            isBuilding.value = false;
            return;
        }
        const remaining = unref(remainingBuildAmount);
        const acceleronBuildAmount = Decimal.div(unref(acceleron.accelerons), unref(buildCost));
        const buildAmount = Decimal.times(unref(buildSpeed), diff).clampMax(remaining).clampMax(acceleronBuildAmount);
        
        loop.buildProgress.value = buildAmount.plus(unref(loop.buildProgress)).clampMax(unref(loop.buildRequirement));
        acceleron.accelerons.value = Decimal.subtract(unref(acceleron.accelerons), buildAmount.times(unref(buildCost))).clampMin(0);
        if (unref(loop.built)) {
            isBuilding.value = false;
        }
    });
    acceleron.on("preUpdate", diff => {
        if (unref(isBuilding)) return;
        const progress = unref(acceleron.timeMult).times(diff);
        for (const loop of Object.values(loops).filter(loop => unref(loop.built))) {
            loop.triggerProgress.value = progress.plus(unref(loop.triggerProgress));
            const numIntervals = Decimal.divide(unref(loop.triggerProgress), unref(loop.triggerRequirement)).floor();
            if (numIntervals.gte(1)) {
                loop.triggerProgress.value = Decimal.sub(unref(loop.triggerProgress), numIntervals.times(unref(loop.triggerRequirement)));
                loop.trigger(numIntervals);
            }
        }
    });

    const loops = (() => {
        const acceleronLoop = createLoop<Decimal>(() => ({
            visibility: (): boolean => unref(acceleron.upgrades.superstructures.bought),
            buildRequirement: 60,
            triggerRequirement: 1,
            display: {
                color: (): string => unref(inAbyss) ? "var(--feature-background)" : unref(acceleron.theme!)["--feature-background"],
                width: 10,
                description: () => (
                    <>
                        Every second, gain <span style={{color: unref(acceleronLoop.display.color)}}>
                            {formatSmall(unref(acceleronLoop.effect).times(100), 1)}%
                        </span> of your Acceleron gain.
                        Currently: <span style={{color: unref(acceleronLoop.display.color)}}>
                            {format(Decimal.times(unref(acceleron.conversion.currentGain), unref(acceleron.timeMult)).times(1/*unref(acceleronLoop.effect)*/).div(1/*unref(acceleronLoop.triggerRequirement)*/))}
                        </span> Accelerons/s
                    </>
                )
            },
            effect(): Decimal { return Decimal.add(0.001, getUpgradeEffect(entropy.enhancements.acceleration, 0))
                                              .div(unref(timelines.nerfs[Sides.LEFT]))
                                              .times(unref(timelines.buffs[Sides.LEFT]))
            },
            trigger(intervals) {
                let gain = new Decimal(unref(acceleron.conversion.currentGain));
                gain = gain.times(unref(acceleronLoop.effect));
                gain = gain.times(intervals);
                if (unref(timecube.upgrades.tempo.bought)) gain = gain.clampMin(1);

                acceleron.accelerons.value = Decimal.add(unref(acceleron.accelerons), gain);
            }
        }));
        const instantProd = createLoop<Decimal>(() => ({
            visibility(): boolean { return unref(instantProd.built) || unref(acceleronLoop.built) },
            buildRequirement: 360,
            triggerRequirement: 60,
            display: {
                color: (): string => unref(inAbyss) ? "var(--feature-background)" : unref(skyrmion.theme!)["--feature-background"],
                width: 10,
                description: () => (
                    <>
                        Every minute, gain <span style={{color: unref(instantProd.display.color)}}>
                            {formatSmall(unref(instantProd.effect))}
                        </span> minutes of Foam and Skyrmion production.
                        Currently: <span style={{color: unref(instantProd.display.color)}}>
                            {format(Decimal.times(unref(instantProd.effect), unref(acceleron.timeMult)).div(unref(instantProd.triggerRequirement)))}
                        </span> minutes/s
                    </>
                )
            },
            effect(): Decimal { return Decimal.plus(1, getUpgradeEffect(entropy.enhancements.expansion, 0))
                                     .div(unref(timelines.nerfs[Sides.LEFT]))
                                     .times(unref(timelines.buffs[Sides.LEFT]))
            },
            trigger(intervals) {
                const gain = new Decimal(unref(this.triggerRequirement)).times(unref(instantProd.effect)).times(intervals);
                skyrmion.pion.pions.value = gain.times(unref(1)).plus(unref(skyrmion.pion.pions));
                skyrmion.spinor.spinors.value = gain.times(unref(1)).plus(unref(skyrmion.spinor.spinors));
                Object.values(FomeTypes).forEach(type => fome[type].amount.value = gain.times(unref(fome[type].production)).plus(unref(fome[type].amount)));
            }
        }));
        const timecubeLoop = createLoop<Decimal>(() => ({
            visibility(): boolean { return unref(timecubeLoop.built) || unref(instantProd.built) },
            buildRequirement: 600,
            triggerRequirement: 60*60,
            display: {
                color: () => unref(inAbyss) ? "var(--feature-background)" : unref(timecube.theme!)["--feature-background"],
                width: 10,
                description: () => (
                    <>
                        Every hour, gain <span style={{color: unref(timecubeLoop.display.color)}}>
                            {format(unref(timecubeLoop.effect))}
                        </span> Time Cubes.
                        Currently: <span style={{color: unref(timecubeLoop.display.color)}}>
                            {format(Decimal.times(unref(timecubeLoop.effect), unref(acceleron.timeMult)).div(unref(timecubeLoop.triggerRequirement)))}
                        </span> Time Cubes/s
                    </>
                )
            },
            effect() { return new Decimal(unref(timecube.production))
                                .div(unref(timelines.nerfs[Sides.LEFT]))
                                .times(unref(timelines.buffs[Sides.LEFT]))
            },
            trigger(intervals) {
                timecube.timecubes.value = unref(timecubeLoop.effect).times(intervals).plus(unref(timecube.timecubes))
            }
        }));
        const tempFome = createLoop<Decimal>(() => ({
            visibility(): boolean { return unref(tempFome.built) || unref(acceleron.upgrades.tetration.bought) || unref(timecube.upgrades.tiny.bought) },
            buildRequirement: 250000,
            triggerRequirement: 60*60*24,
            display: {
                color: () => unref(inAbyss) ? "var(--feature-background)" : unref(fome.theme!)["--feature-background"],
                width: 10,
                description: () => (
                    <>
                        Every day, gain a decaying boost to Foam production. Currently: <span style={{color: unref(tempFome.display.color)}}>
                            {format(Decimal.gte(unref(acceleron.timeMult), unref(tempFome.triggerRequirement))
                                ? unref(averageLoopValues[tempFome.id])
                                : unref(tempFome.value!))}
                        </span>×
                    </>
                )
            },
            effect() { return new Decimal(1e6) },
            trigger(intervals) {
                this.value!.value = unref(tempFome.effect).div(
                    Decimal.div(unref(timelines.nerfs[Sides.LEFT]),
                                unref(timelines.buffs[Sides.LEFT])))
                            .times(intervals)
            }
        }), persistent<DecimalSource>(0));
        const tempAcceleron = createLoop<Decimal>(() => ({
            visibility(): boolean { return unref(tempAcceleron.built) || (unref(acceleron.upgrades.tetration.bought)) && unref(tempFome.built) },
            buildRequirement: 1e11,
            triggerRequirement: 60*60*24*365,
            display: {
                color: (): string => unref(inAbyss) ? "var(--feature-background)" : unref(acceleron.theme!)["--feature-background"],
                width: 10,
                description: () => (
                    <>
                        Every year, gain a decaying boost to Acceleron gain. Currently: <span style={{color: unref(tempAcceleron.display.color)}}>
                            {format(Decimal.gte(unref(acceleron.timeMult), unref(tempAcceleron.triggerRequirement))
                                ? unref(averageLoopValues[tempAcceleron.id])
                                : unref(tempAcceleron.value!))}
                        </span>×
                    </>
                )
            },
            effect() { return new Decimal(1000) },
            trigger(intervals) {
                this.value!.value = unref(tempAcceleron.effect).div(Decimal.div(unref(timelines.nerfs[Sides.LEFT]), unref(timelines.buffs[Sides.LEFT]))).times(intervals)
            }
        }));
        const tempSkyrmion = createLoop<Decimal>(() => ({
            visibility(): boolean { return unref(tempSkyrmion.built) || (unref(acceleron.upgrades.tetration.bought) && unref(timecube.upgrades.tiny.bought) && unref(tempAcceleron.built)) },
            buildRequirement: 4e17,
            triggerRequirement: 60*60*24*365*10,
            display: {
                color: (): string => unref(inAbyss) ? "var(--feature-background)" : unref(skyrmion.theme!)["--feature-background" as keyof typeof skyrmion.theme],
                width: 10,
                description: () => (
                    <>
                        Every decade, gain a decaying boost to Pion and Spinor production. Currently: <span style={{color: unref(tempSkyrmion.display.color)}}>
                            {format(Decimal.gte(unref(acceleron.timeMult), unref(tempSkyrmion.triggerRequirement))
                                ? unref(averageLoopValues[tempSkyrmion.id])
                                : unref(tempSkyrmion.value!))}
                        </span>×
                    </>
                )
            },
            effect() { return new Decimal(1e9) },
            trigger(intervals) {
                this.value!.value = unref(tempSkyrmion.effect).div(Decimal.div(unref(timelines.nerfs[Sides.LEFT]), unref(timelines.buffs[Sides.LEFT]))).times(intervals)
            }
        }));

        return { acceleron: acceleronLoop, instantProd, timecube: timecubeLoop, tempFome, tempAcceleron, tempSkyrmion };
    })();

    const numBuiltLoops = computed(() => Object.values(loops).filter(loop => unref(loop.built)).length);
    const nextLoop = computed(() => Object.values(loops).find(loop => isVisible(loop.visibility) && !unref(loop.built)));

    const priorLoopValues = {
        [loops.tempFome.id]: ref<DecimalSource[]>([]),
        [loops.tempAcceleron.id]: ref<DecimalSource[]>([]),
        [loops.tempSkyrmion.id]: ref<DecimalSource[]>([])
    };
    const averageLoopValues = Object.fromEntries(
        Object.entries(priorLoopValues)
            .map(([id, values]) => [id,
                computed(() => unref(values).reduce((sum: Decimal, value) => sum.plus(value), Decimal.dZero).dividedBy(unref(values).length || 1).plus(1))
            ])
    );

    acceleron.on("postUpdate", diff => {
        const timePerSecond = unref(acceleron.timeMult);
        const power = Decimal.pow(0.2, diff);
        for (const loop of [ loops.tempFome, loops.tempAcceleron, loops.tempSkyrmion ]) {
            priorLoopValues[loop.id].value = [...unref(priorLoopValues[loop.id]).slice(-9), loop.value!.value];
            if (Decimal.gte(timePerSecond, unref(loop.triggerRequirement))) continue;
            loop.value!.value = power.times(unref(loop.value!)).clampMin(1);
        }
    });

    const modifiersModal = createModifierModal(
        "Entropic Loop Modifiers",
        () => [{
            title: "Build Speed",
            modifier: buildSpeedModifiers,
            base: acceleron.timeMult,
            baseText: () => <>[{acceleron.name}] Time Speed</>
        },
        {
            title: "Build Cost",
            modifier: buildCostModifiers,
            base: 1,
            baseText: () => <>[{acceleron.name}] {unref(acceleron.accelerons.displayName)}/sec</>,
            smallerIsBetter: true
        }]
    );

    return {
        isBuilding,
        loops,
        averageLoopValues,
        numBuiltLoops,
        upperDisplay: () => (
            <>
                {(unref(nextLoop) === undefined)
                    ? <Spacer height="50px" />
                    : (<>
                        <Spacer height="18px" />
                        <div style={{fontSize: '12px', color: 'var(--link)'}}>
                            Construction Progress: {formatWhole(unref(unref(nextLoop)?.buildProgress ?? 0))} / {formatWhole(unref(unref(nextLoop)?.buildRequirement ?? 0))}{render(modifiersModal)}<br />
                            Construction will consume <NamedResource resource={acceleron.accelerons} override={unref(remainingBuildCost)} />
                        </div>
                    </>)
                }
            </>
        ),
        lowerDisplay: () => (
            <>
                <Loops radius={175} loops={Object.values(loops)} buildButton={toggleBuilding} />
                <Spacer />
                <LoopDescriptions loops={Object.values(loops)}/>
            </>
        ),
        display: "This page intentionally left blank"
    }
})

export default layer;