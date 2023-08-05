import { isVisible, jsx } from "features/feature";
import { getUpgradeEffect } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { formatSmall, format, formatWhole } from "util/break_eternity";
import { ProcessedComputable } from "util/computed";
import { ComputedRef, computed, unref } from "vue";
import entropy from "./entropy";
import fome, { FomeTypes } from "../fome/fome";
import skyrmion from "../skyrmion/skyrmion";
import acceleronLayer from "./acceleron";
import timecubeLayer from "../timecube/timecube";
import { GenericLoop, LoopOptions, createLoop } from "./loop";
import { GenericPersistentLoop, persistentDecorator } from "./persistentLoopDecorator";
import { createClickable } from "features/clickables/clickable";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import LoopsVue from "./Loops.vue";
import SpacerVue from "components/layout/Spacer.vue";
import LoopDescriptionsVue from "./LoopDescriptions.vue";

const id = "loops";
const layer = createLayer(id, function (this: BaseLayer) {
    const isBuilding = persistent<boolean>(false);

    const toggleBuilding = createClickable(() => ({
        visibility: acceleronLayer.upgrades.superstructures.bought,
        canClick() { return unref(nextLoop) !== undefined; },
        onClick() { isBuilding.value = !unref(isBuilding); },
        display: jsx(() => ( <h3>{unref(isBuilding) ? "Halt" : "Begin"}<br/>Construction</h3> )),
        style() {
            return {
                borderRadius: '50%',
                borderColor: unref(this.canClick) ? 'var(--layer-color)' : 'var(--locked)',

                backgroundColor: '#0000',
                color: unref(this.canClick) ? 'var(--layer-color)' : 'var(--locked)'
            }
        }
    }));

    const buildSpeedModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.construction.effect,
            enabled: entropy.enhancements.construction.bought,
            description: jsx(() => <>[{acceleronLayer.name}] Entropic Construction</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: timecubeLayer.upgrades.ten.effect,
            enabled: timecubeLayer.upgrades.ten.bought,
            description: jsx(() => <>[{timecubeLayer.name}] Ten</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 1,
            enabled: false,
            description: jsx(() => <>[{skyrmion.name}] 4th abyssal pion buyable</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 1,
            enabled: false,
            description: jsx(() => <>[{timecubeLayer.name}] Right Time Squares</>)
        }))
    ]);
    const buildSpeed = computed(() => buildSpeedModifiers.apply(unref(acceleronLayer.timeMult)));
    const buildCostModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.development.effect,
            enabled: entropy.enhancements.development.bought,
            description: jsx(() => <>[{acceleronLayer.name}] Entropic Development</>),
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

    acceleronLayer.on("update", diff => {
        if (!unref(isBuilding)) return;
        const loop = unref(nextLoop);
        if (loop === undefined) {
            isBuilding.value = false;
            return;
        }
        const remaining = unref(remainingBuildAmount);
        const acceleronBuildAmount = Decimal.div(unref(acceleronLayer.accelerons), unref(buildCost));
        const buildAmount = Decimal.times(unref(buildSpeed), diff).clampMax(remaining).clampMax(acceleronBuildAmount);
        
        loop.buildProgress.value = buildAmount.plus(unref(loop.buildProgress)).clampMax(unref(loop.buildRequirement));
        acceleronLayer.accelerons.value = Decimal.subtract(unref(acceleronLayer.accelerons), buildAmount.times(unref(buildCost))).clampMin(0);
        if (unref(loop.built)) {
            isBuilding.value = false;
        }
    });
    acceleronLayer.on("preUpdate", diff => {
        if (unref(isBuilding)) return;
        const progress = unref(acceleronLayer.timeMult).times(diff);
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
        const acceleron = createLoop<LoopOptions<Decimal>, Decimal>(loop => ({
            visibility: acceleronLayer.upgrades.superstructures.bought,
            buildRequirement: new Decimal(60),
            triggerRequirement: Decimal.dOne,
            display: {
                color: acceleronLayer.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every second, gain <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {formatSmall(unref((loop as GenericLoop<Decimal>).effect).times(100), 1)}%
                        </span> of your Acceleron gain.
                        Currently: <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {format(Decimal.times(unref(acceleronLayer.conversion.currentGain), unref(acceleronLayer.timeMult)).times(unref((loop as GenericLoop<Decimal>).effect)).div(unref((loop as GenericLoop<Decimal>).triggerRequirement)))}
                        </span> Accelerons/s
                    </>
                ))
            },
            effect() { return Decimal.add(0.001, getUpgradeEffect(entropy.enhancements.acceleration, 0))
                                     .div(1) // active timeline right effect
                                     .times(0 + 1) // passive timeline right bonus
            },
            trigger(intervals) {
                let gain = new Decimal(unref(acceleronLayer.conversion.currentGain));
                gain = gain.times(unref((loop as GenericLoop<Decimal>).effect));
                gain = gain.times(intervals);
                if (false) gain = gain.max(1); // timecube upgrade 44

                acceleronLayer.accelerons.value = Decimal.add(unref(acceleronLayer.accelerons), gain);
            }
        })) as GenericLoop<Decimal>;
        const instantProd = createLoop<LoopOptions<Decimal>, Decimal>(loop => ({
            visibility() { return unref(loop.built) || unref(acceleron.built) },
            buildRequirement: new Decimal(360),
            triggerRequirement: new Decimal(60),
            display: () => ({
                color: skyrmion.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every minute, gain <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {formatSmall(unref((loop as GenericLoop<Decimal>).effect))}
                        </span> minutes of Foam and Skyrmion production.
                        Currently: <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {format(Decimal.times(unref((loop as GenericLoop<Decimal>).effect), unref(acceleronLayer.timeMult)).div(unref((loop as GenericLoop<Decimal>).triggerRequirement)))}
                        </span> minutes/s
                    </>
                ))
            }),
            effect() { return Decimal.plus(1, getUpgradeEffect(entropy.enhancements.expansion, 0))
                                     .div(1) // active right timeline effect
                                     .times(1) // passive right timeline bonus
            },
            trigger(intervals) {
                const gain = new Decimal(unref(this.triggerRequirement as ProcessedComputable<DecimalSource>)).times(unref((loop as GenericLoop<Decimal>).effect)).times(intervals);
                skyrmion.pion.pions.value = gain.times(unref(1)).plus(unref(skyrmion.pion.pions));
                skyrmion.spinor.spinors.value = gain.times(unref(1)).plus(unref(skyrmion.spinor.spinors));
                Object.values(FomeTypes).forEach(type => fome[type].amount.value = gain.times(unref(fome[type].production)).plus(unref(fome[type].amount)));
            }
        })) as GenericLoop<Decimal>;
        const timecube = createLoop<LoopOptions<Decimal>, Decimal>(loop => ({
            visibility() { return unref(this.built) || unref(instantProd.built) },
            buildRequirement: new Decimal(600),
            triggerRequirement: new Decimal(3600),
            display: {
                color: timecubeLayer.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every hour, gain <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {format(unref((loop as GenericLoop<Decimal>).effect))}
                        </span> Time Cubes.
                        Currently: <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {format(Decimal.times(unref((loop as GenericLoop<Decimal>).effect), unref(acceleronLayer.timeMult)).div(unref((loop as GenericLoop<Decimal>).triggerRequirement)))}
                        </span> Time Cubes/s
                    </>
                ))
            },
            effect() { return new Decimal(getUpgradeEffect(timecubeLayer.upgrades.tile))
                                .times(getUpgradeEffect(acceleronLayer.upgrades.conversion))
                                .times(getUpgradeEffect(entropy.enhancements.tesselation))
                                .times(1) // front time square
                                .div(1) // active right timeline effect
                                .times(1) // passive right timeline bonus
                                .div(1) // active front timeline effect
                                .times(1) // passive front timeline bonus
            },
            trigger(intervals) {
                timecubeLayer.timecubes.value = unref((loop as GenericLoop<Decimal>).effect).times(intervals).plus(unref(timecubeLayer.timecubes))
            }
        })) as GenericLoop<Decimal>;
        const tempFome = createLoop<LoopOptions<Decimal>, Decimal>(loop => ({
            visibility() { return unref(this.built) || unref(acceleronLayer.upgrades.tetration.bought) || unref(timecubeLayer.upgrades.tiny.bought) },
            buildRequirement: new Decimal(250000),
            triggerRequirement: new Decimal(86400),
            display: {
                color: fome.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every day, gain a decaying boost to Foam production. Currently: <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {format(unref((loop as GenericPersistentLoop<Decimal>).value))}
                        </span>x
                    </>
                ))
            },
            effect() { return new Decimal(1e6) },
            trigger(intervals) {
                (this as GenericPersistentLoop<Decimal>).value.value = unref((loop as GenericLoop<Decimal>).effect).div(
                    Decimal.div(1/* right timeline effect */,
                                1/* right timeline bonus */))
                            .times(intervals)
            }
        }), persistentDecorator) as GenericPersistentLoop<Decimal>;
        const tempAcceleron = createLoop<LoopOptions<Decimal>, Decimal>(loop => ({
            visibility() { return unref(this.built) || (unref(acceleronLayer.upgrades.tetration.bought)) && unref(tempFome.built) },
            buildRequirement: new Decimal(1e11),
            triggerRequirement: new Decimal(31536000),
            display: {
                color: acceleronLayer.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every year, gain a decaying boost to Acceleron production. Currently: <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {format(unref((loop as GenericPersistentLoop<Decimal>).value))}
                        </span>x
                    </>
                ))
            },
            effect() { return new Decimal(1e3) },
            trigger(intervals) {
                (this as GenericPersistentLoop<Decimal>).value.value = unref((loop as GenericLoop<Decimal>).effect).div(Decimal.div(1/* right timeline effect */, 1/* right timeline bonus */)).times(intervals)
            }
        }), persistentDecorator) as GenericPersistentLoop<Decimal>;
        const tempSkyrmion = createLoop<LoopOptions<Decimal>, Decimal>(loop => ({
            visibility() { return unref(this.built) || (unref(acceleronLayer.upgrades.tetration.bought) && unref(timecubeLayer.upgrades.tiny.bought) && unref(tempAcceleron.built)) },
            buildRequirement: new Decimal(4e17),
            triggerRequirement: new Decimal(315360000),
            display: {
                color: skyrmion.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every decade, gain a decaying boost to Pion and Spinor production. Currently: <span style={{color: unref(unref((loop as GenericLoop<Decimal>).display).color)}}>
                            {format(unref((loop as GenericPersistentLoop<Decimal>).value))}
                        </span>x
                    </>
                ))
            },
            effect() { return new Decimal(1e9) },
            trigger(intervals) {
                (this as GenericPersistentLoop<Decimal>).value.value = unref((loop as GenericLoop<Decimal>).effect).div(Decimal.div(1/* right timeline effect */, 1/* right timeline bonus */)).times(intervals)
            }
        }), persistentDecorator) as GenericPersistentLoop<Decimal>;

        return { acceleron, instantProd, timecube, tempFome, tempAcceleron, tempSkyrmion };
    })();

    const numBuiltLoops = computed(() => Object.values(loops).filter(loop => unref(loop.built)).length);
    const nextLoop = computed(() => Object.values(loops).find(loop => isVisible(loop.visibility) && !unref(loop.built)));
    acceleronLayer.on("postUpdate", diff => {
        const power = Decimal.pow(0.2, diff);
        for (const loop of [ loops.tempFome, loops.tempAcceleron, loops.tempSkyrmion ]) {
            if (Decimal.lte(unref(loop.value), unref(loop.effect))) {
                loop.value.value = power.times(unref(loop.value)).clampMin(1);
            }
        }
    })

    return {
        isBuilding,
        loops,
        numBuiltLoops,
        upperDisplay: jsx(() => (
            <>
                {(unref(nextLoop) === undefined)
                    ? <SpacerVue height="50px" />
                    : (<>
                        <SpacerVue height="18px" />
                        <div style={{fontSize: '12px', color: 'var(--link)'}}>
                            Construction Progress: {formatWhole(unref(unref(nextLoop)?.buildProgress ?? 0))} / {formatWhole(unref(unref(nextLoop)?.buildRequirement ?? 0))}<br />
                            Construction will consume {formatWhole(unref(remainingBuildCost))} {acceleronLayer.accelerons.displayName}
                        </div>
                    </>)
                }
            </>
        )),
        lowerDisplay: jsx(() => (
            <>
                <LoopsVue radius={175} loops={Object.values(loops)} buildButton={toggleBuilding} />
                <SpacerVue />
                <LoopDescriptionsVue loops={Object.values(loops)}/>
            </>
        )),
        display: "This page intentionally left blank"
    }
})

export default layer;