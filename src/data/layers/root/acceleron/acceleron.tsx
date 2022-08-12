import SpacerVue from "components/layout/Spacer.vue";
import { createResetButton } from "data/common";
import { createAchievement } from "features/achievements/achievement";
import { createClickable } from "features/clickables/clickable";
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
import { jsx, showIf, Visibility } from "features/feature";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource, trackBest, trackTotal } from "features/resources/resource";
import { createTab } from "features/tabs/tab";
import { createTabFamily } from "features/tabs/tabFamily";
import { createUpgrade, GenericUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import { createLayer, BaseLayer, Layer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { Persistent, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall, formatTime, formatWhole } from "util/break_eternity";
import { ProcessedComputable } from "util/computed";
import { render } from "util/vue";
import { computed, ComputedRef, unref } from "vue";
import fome, { FomeTypes } from "../fome/fome";
import skyrmion from "../skyrmion/skyrmion";
import timecube from "../timecube/timecube";
import entropy from "./entropy";
import { createLoop, GenericLoop } from "./loop";
import LoopDescriptionsVue from "./LoopDescriptions.vue";
import LoopsVue from "./Loops.vue";
import UpgradeRingVue from "./UpgradeRing.vue";

const id = "acceleron";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Accelerons";
    const color = "#0f52ba";

    const accelerons = createResource<DecimalSource>(0, "Accelerons");
    const bestAccelerons = trackBest(accelerons);
    const totalAccelerons = trackTotal(accelerons);

    const timeMult = computed(() => {
        let mult = Decimal.max(unref(bestAccelerons), 0).plus(1);
        mult = mult.gte(1e12) ? mult.log10().times(5e5/6) : mult.sqrt();
        return mult.times(getUpgradeEffect(timecube.upgrades.time))
                   .times(getUpgradeEffect(entropy.enhancements.dilation))
                   .times(1) // back time square
                   .times(1) // timecube upgrade 35
                   .div(1) // active back timeline
                   .times(1) // passive back timeline
                   .max(1)
                   .times(unref(loopToggle) ? -1 : 1) // negate if constructing
    })
    
    const conversions = [
        createCumulativeConversion(() => ({
            scaling: createPolynomialScaling(1e6, 0.1),
            baseResource: fome.amounts[FomeTypes.quantum],
            gainResource: accelerons,
            costModifier: createSequentialModifier(
                createMultiplicativeModifier(upgrades.rfToAccGain.effect, '', upgrades.rfToAccGain.bought),
                createMultiplicativeModifier(upgrades.lpToAccGain.effect, '', upgrades.lpToAccGain.bought)
            )
        })),
        createCumulativeConversion(() => ({
            scaling: createPolynomialScaling(1e80, 0.05),
            baseResource: fome.amounts[FomeTypes.quantum],
            gainResource: accelerons
        }))
    ];
    const unlockOrder: ComputedRef<0|1> = computed(() => {
        return false ? 1 : 0; // inflaton points without acceleron mastery upgrade
    });

    const time = persistent<DecimalSource>(0);
    this.on("preUpdate", (diff) => {
        time.value = Decimal.add(diff, unref(time));
    })
    const resetButtons = conversions.map(conversion => 
        createResetButton(() => ({
            conversion,
            style: {
                width: 'fit-content',
                padding: '5px 10px',
                minHeight: '60px'
            }
        }))
    );

    const loops: {[key: string]: GenericLoop} = {
        acceleron: createLoop(() => ({
            visibility() { return showIf(unref(upgrades.loopBuilding.bought)); },
            buildRequirement: new Decimal(60),
            triggerRequirement: Decimal.dOne,
            display: {
                color: color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every second, gain <span style={{color: unref(unref(loops.acceleron.display).color)}}>
                            {formatSmall(unref(loops.acceleron.effect).times(100), 1)}%
                        </span> of your Acceleron gain.
                        Currently: <span style={{color: unref(unref(loops.acceleron.display).color)}}>
                            {format(Decimal.times(unref(conversions[unref(unlockOrder)].currentGain), unref(timeMult)).times(unref(loops.acceleron.effect)).div(unref(loops.acceleron.triggerRequirement)))}
                        </span> Accelerons/s
                    </>
                ))
            },
            effect() { return Decimal.add(0.001, getUpgradeEffect(entropy.enhancements.acceleration, 0))
                                     .div(1) // active timeline right effect
                                     .times(0 + 1) // passive timeline right bonus
            },
            trigger(intervals) {
                let gain = new Decimal(unref(conversions[unref(unlockOrder)].currentGain));
                gain = gain.times(unref(this.effect));
                gain = gain.times(intervals);
                if (false) gain = gain.max(1); // timecube upgrade 44

                accelerons.value = Decimal.add(unref(accelerons), gain);
            }
        })),
        instantProd: createLoop(() => ({
            visibility() { return showIf(unref(this.built) || unref(loops.acceleron.built)) },
            buildRequirement: new Decimal(360),
            triggerRequirement: new Decimal(60),
            display: () => ({
                color: unref(skyrmion.color),
                width: 10,
                description: jsx(() => (
                    <>
                        Every minute, gain <span style={{color: unref(unref(loops.instantProd.display).color)}}>
                            {formatSmall(unref(loops.instantProd.effect))}
                        </span> minutes of Foam and Skyrmion production.
                        Currently: <span style={{color: unref(unref(loops.instantProd.display).color)}}>
                            {format(Decimal.times(unref(loops.instantProd.effect), unref(timeMult)).div(unref(loops.instantProd.triggerRequirement)))}
                        </span> minutes/s
                    </>
                ))
            }),
            effect() { return Decimal.plus(1, getUpgradeEffect(entropy.enhancements.expansion, 0))
                                     .div(1) // active right timeline effect
                                     .times(1) // passive right timeline bonus
            },
            trigger(intervals) {
                const gain = new Decimal(unref(this.triggerRequirement as ProcessedComputable<DecimalSource>)).times(unref(this.effect)).times(intervals);
                skyrmion.pions.value = gain.times(unref(skyrmion.pionRate)).plus(unref(skyrmion.pions));
                skyrmion.spinors.value = gain.times(unref(skyrmion.spinorRate)).plus(unref(skyrmion.spinors));
                Object.values(FomeTypes).forEach(type => fome.amounts[type].value = gain.times(unref(fome.rates[type])).plus(unref(fome.amounts[type])));
            }
        })),
        timecube: createLoop(() => ({
            visibility() { return showIf(unref(this.built) || unref(loops.instantProd.built)) },
            buildRequirement: new Decimal(600),
            triggerRequirement: new Decimal(3600),
            display: {
                color: timecube.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every hour, gain <span style={{color: unref(unref(loops.timecube.display).color)}}>
                            {format(unref(loops.timecube.effect))}
                        </span> Time Cubes.
                        Currently: <span style={{color: unref(unref(loops.timecube.display).color)}}>
                            {format(Decimal.times(unref(loops.timecube.effect), unref(timeMult)).div(unref(loops.timecube.triggerRequirement)))}
                        </span> Time Cubes/s
                    </>
                ))
            },
            effect() { return new Decimal(getUpgradeEffect(timecube.upgrades.tile))
                                .times(getUpgradeEffect(upgrades.lpToTCGain))
                                .times(getUpgradeEffect(entropy.enhancements.tesselation))
                                .times(1) // front time square
                                .div(1) // active right timeline effect
                                .times(1) // passive right timeline bonus
                                .div(1) // active front timeline effect
                                .times(1) // passive front timeline bonus
            },
            trigger(intervals) {
                timecube.timecubes.value = unref(this.effect).times(intervals).plus(unref(timecube.timecubes))
            }
        })),
        tempFoam: createLoop(() => ({
            persistentBoost: true,
            visibility() { return showIf(unref(this.built) || unref(upgrades.passiveAcceleron.bought) || unref(timecube.upgrades.tiny.bought)) },
            buildRequirement: new Decimal(250000),
            triggerRequirement: new Decimal(86400),
            display: {
                color: fome.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every day, gain a decaying boost to Foam production. Currently: <span style={{color: unref(unref(loops.tempFoam.display).color)}}>
                            {format(unref(loops.tempFoam.currentBoost!))}
                        </span>x
                    </>
                ))
            },
            effect() { return new Decimal(1e6) },
            trigger(intervals) {
                this.currentBoost!.value = unref(this.effect).div(Decimal.div(1/* right timeline effect */, 1/* right timeline bonus */)).times(intervals)
            }
        })),
        tempAcceleron: createLoop(() => ({
            persistentBoost: true,
            visibility() { return showIf(unref(this.built) || (unref(upgrades.passiveAcceleron.bought)) && unref(loops.tempFoam.built)) },
            buildRequirement: new Decimal(1e11),
            triggerRequirement: new Decimal(31536000),
            display: {
                color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every year, gain a decaying boost to Acceleron production. Currently: <span style={{color: unref(unref(loops.tempAcceleron.display).color)}}>
                            {format(unref(loops.tempAcceleron.currentBoost!))}
                        </span>x
                    </>
                ))
            },
            effect() { return new Decimal(1e3) },
            trigger(intervals) {
                this.currentBoost!.value = unref(this.effect).div(Decimal.div(1/* right timeline effect */, 1/* right timeline bonus */)).times(intervals)
            }
        })),
        tempSkyrmion: createLoop(() => ({
            persistentBoost: true,
            visibility() { return showIf(unref(this.built) || (unref(upgrades.passiveAcceleron.bought) && unref(timecube.upgrades.tiny.bought) && unref(loops.tempAcceleron.built))) },
            buildRequirement: new Decimal(4e17),
            triggerRequirement: new Decimal(315360000),
            display: {
                color: skyrmion.color,
                width: 10,
                description: jsx(() => (
                    <>
                        Every decade, gain a decaying boost to Pion and Spinor production. Currently: <span style={{color: unref(unref(loops.tempSkyrmion.display).color)}}>
                            {format(unref(loops.tempSkyrmion.currentBoost!))}
                        </span>x
                    </>
                ))
            },
            effect() { return new Decimal(1e9) },
            trigger(intervals) {
                this.currentBoost!.value = unref(this.effect).div(Decimal.div(1/* right timeline effect */, 1/* right timeline bonus */)).times(intervals)
            }
        }))
    }
    const numBuiltLoops = computed(() => Object.values(loops).filter(loop => unref(loop.built)).length);
    const nextLoop = computed(() => Object.values(loops).find(loop => unref(loop.visibility) === Visibility.Visible && !unref(loop.built)));
    this.on("postUpdate", diff => {
        const power = Decimal.pow(0.2, diff);
        if (Decimal.lte(unref(loops.tempFoam.currentBoost!), unref(loops.tempFoam.effect))) {
            loops.tempFoam.currentBoost!.value = Decimal.times(unref(loops.tempFoam.currentBoost!), power).max(1)
        }
        if (Decimal.lte(unref(loops.tempAcceleron.currentBoost!), unref(loops.tempAcceleron.effect))) {
            loops.tempAcceleron.currentBoost!.value = Decimal.times(unref(loops.tempAcceleron.currentBoost!), power).max(1)
        }
        if (Decimal.lte(unref(loops.tempSkyrmion.currentBoost!), unref(loops.tempSkyrmion.effect))) {
            loops.tempSkyrmion.currentBoost!.value = Decimal.times(unref(loops.tempSkyrmion.currentBoost!), power).max(1)
        }
    })

    const loopToggleButton = createClickable(() => ({
        visibility() { return showIf(unref(upgrades.loopBuilding.bought)) },
        canClick() { return unref(nextLoop) !== undefined },
        onClick() { loopToggle.value = !unref(loopToggle) },
        display: jsx(() => (
            <>
                <h3>{unref(loopToggle) ? "Halt" : "Begin"}
                <br/>Construction</h3>
            </>
        )),
        style() {
            return {
                borderRadius: '50%',
                borderColor: unref(this.canClick) ? 'var(--layer-color)' : 'var(--locked)',

                backgroundColor: '#0000',
                color: unref(this.canClick) ? 'var(--layer-color)' : 'var(--locked)'
            }
        }
    }));
    const loopToggle = persistent<boolean>(false);
    this.on("update", (diff) => {
        if (!unref(loopToggle)) return;
        let loop = unref(nextLoop);
        if (loop === undefined) {
            loopToggle.value = false;
        }
        else {
            let remaining = Decimal.minus(unref(loop.buildRequirement), unref(loop.buildProgress));
            let buildSpeed = unref(timeMult).times(diff).negate()
                                            .times(getUpgradeEffect(entropy.enhancements.construction))
                                            .times(getUpgradeEffect(timecube.upgrades.buildSpeed))
                                            .times(1) // pion upgrade 44
                                            .times(1) // right time square effect
                                            .min(unref(accelerons))
                                            .min(remaining);
            loop.buildProgress.value = Decimal.add(unref(loop.buildProgress), buildSpeed).min(unref(loop.buildRequirement));
            accelerons.value = Decimal.subtract(unref(accelerons), buildSpeed.times(getUpgradeEffect(entropy.enhancements.development)));
            if (unref(loop.built)) {
                loopToggle.value = false;
            }
        }
    });
    this.on("preUpdate", (diff) => {
        if (unref(loopToggle)) return;
        let progress = unref(timeMult).times(diff);
        for (let loop of Object.values(loops).filter(loop => unref(loop.built))) {
            loop.triggerProgress.value = progress.plus(unref(loop.triggerProgress));
            let numIntervals = Decimal.divide(unref(loop.triggerProgress), unref(loop.triggerRequirement)).floor();
            if (numIntervals.gte(1)) {
                loop.triggerProgress.value = Decimal.sub(unref(loop.triggerProgress), numIntervals.times(unref(loop.triggerRequirement)));
                loop.trigger(numIntervals);
            }
        }
    })

    const achievements = {
        protoversal: createAchievement(() => ({ // keep protoversal fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 1) }
        })),
        infinitesimal: createAchievement(() => ({ // keep infinitesimal fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 2) }
        })),
        subspatial: createAchievement(() => ({ // keep subspatial fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 3) }
        })),
        skyrmion: createAchievement(() => ({ // start with 10 skyrmions
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 5) }
        })),
        subplanck: createAchievement(() => ({ // keep subplanck fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 7) }
        })),
        quantum: createAchievement(() => ({ // keep quantum fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 10) }
        }))
    }

    const upgrades: {[key: string]: GenericUpgrade} = {
        fomeGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || Decimal.gte(unref(totalAccelerons), 4)) },
            display: jsx(() => (
                <>
                    <h3>Minute Acceleration</h3><br /><br />
                    Time speed massively multiplies Foam generation<br /><br />
                    Currently: {format(unref(upgrades.fomeGain.effect))}x<br />
                    Cost: {formatWhole(unref(upgrades.fomeGain.cost!))} {upgrades.fomeGain.resource!.displayName}
                </>
            )),
            effect() { return unref(timeMult).abs().sqrt().times(1000) },
            cost: Decimal.dOne,
            resource: accelerons
        })),
        rfToAccGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.fomeGain.bought)) },
            display: jsx(() => {
                let upgrade = upgrades.rfToAccGain;
                return <>
                    <h3>Quantum Translation</h3><br /><br />
                    Each Foam re-formation increases Acceleron gain by 100%<br /><br />
                    Currently: {formatWhole(unref(upgrade.effect))}x<br />
                    Cost: {formatWhole(unref(upgrade.cost!))} {upgrade.resource!.displayName}
                </>
            }),
            effect() { return Object.values(fome.reformUpgrades).map(upgrade => unref(upgrade.amount)).reduce((a,b) => Decimal.add(a, b)) },
            cost: new Decimal(5),
            resource: accelerons
        })),
        skyrmionUpgrade: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.fomeGain.bought)) },
            display: jsx(() => {
                let upgrade = upgrades.skyrmionUpgrade;
                return <>
                    <h3>Superpositional Acceleration</h3><br /><br />
                    Gain a new Pion upgrade<br />
                    Gain a new Spinor upgrade<br /><br />
                    <br />
                    Cost: {formatWhole(unref(upgrade.cost!))} {upgrade.resource!.displayName}
                </>
            }),
            cost: new Decimal(25),
            resource: accelerons
        })),
        loopBuilding: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.skyrmionUpgrade.bought)) },
            display: jsx(() => (
                <>
                    <h3>Quasi-temporal Superstructures</h3><br /><br />
                    Consume the past to build the future<br /><br /><br />
                    <br />
                    Cost: {formatWhole(unref(upgrades.loopBuilding.cost!))} {upgrades.loopBuilding.resource!.displayName}
                </>
            )),
            cost: new Decimal(50),
            resource: accelerons
        })),
        lpToAccGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(loops.acceleron.built)) },
            display: jsx(() => (
                <>
                    <h3>Temporal Fluctuation</h3><br /><br />
                    Each Entropic Loop multiplies Acceleron gain<br /><br />
                    Currently: {formatWhole(unref(upgrades.lpToAccGain.effect))}x<br />
                    Cost: {formatWhole(unref(upgrades.lpToAccGain.cost!))} {upgrades.lpToAccGain.resource!.displayName}
                </>
            )),
            effect() { return unref(numBuiltLoops) + 1 },
            cost: new Decimal(100),
            resource: accelerons
        })),
        enhancement: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(loops.instantProd.built)) },
            display: jsx(() => (
                <>
                    <h3>Unstable Expansion</h3><br /><br />
                    Unlock Entropic Enhancements<br /><br /><br />
                    <br />
                    Cost: {formatWhole(unref(upgrades.enhancement.cost!))} {upgrades.enhancement.resource!.displayName}
                </>
            )),
            cost: new Decimal(300),
            resource: accelerons
        })),
        lpToTCGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(loops.timecube.built)) },
            display: jsx(() => (
                <>
                    <h3>Stability Conversion</h3><br /><br />
                    Each Entropic Loop multiplies Time Cube gain<br /><br />
                    Currently: {formatWhole(unref(upgrades.lpToTCGain.effect))}x<br />
                    Cost: {formatWhole(unref(upgrades.lpToTCGain.cost!))} {upgrades.lpToTCGain.resource!.displayName}
                </>
            )),
            effect() { return unref(numBuiltLoops) + 1 },
            cost: new Decimal(150000),
            resource: accelerons
        })),
        subspatialGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.lpToTCGain.bought)) },
            display: jsx(() => (
                <>
                    <h3>Subspatial Alacrity</h3><br /><br />
                    Increase Subspatial Foam gain by {formatWhole(unref(upgrades.subspatialGain.effect))}x<br /><br />
                    <br />
                    Cost: {formatWhole(unref(upgrades.subspatialGain.cost!))} {upgrades.subspatialGain.resource!.displayName}
                </>
            )),
            effect: new Decimal(1e4),
            cost: new Decimal(2e6),
            resource: accelerons
        })),
        passiveAcceleron: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.subspatialGain.bought)) },
            display: jsx(() => (
                <>
                    <h3>Cubic Tetration</h3><br /><br />
                    Remove the ability to Acceleron reset<br />
                    Unlock two additional Entropic Loops<br /><br />
                    <br />
                    Cost: {formatWhole(unref(upgrades.passiveAcceleron.cost!))} {upgrades.passiveAcceleron.resource!.displayName}
                </>
            )),
            cost: new Decimal(1e8),
            resource: accelerons
        })),
        inflation: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.passiveAcceleron.bought)) },
            display: jsx(() => (
                <>
                    <h3>Temporal Mastery</h3><br /><br />
                    Unlock {unref(unlockOrder) == 0 ? 'Inflatons': 'Entangled Strings'}<br /><br /><br />
                    <br />
                    Cost: {formatWhole(unref(upgrades.inflation.cost!))} {upgrades.inflation.resource!.displayName}
                </>
            )),
            cost: new Decimal(1e19),
            resource: accelerons
        }))
    }
    const left = [
        upgrades.fomeGain,
        upgrades.lpToAccGain,
        upgrades.passiveAcceleron,
        upgrades.lpToTCGain,
        upgrades.skyrmionUpgrade
    ];
    const right = [
        upgrades.rfToAccGain,
        upgrades.enhancement,
        upgrades.inflation,
        upgrades.subspatialGain,
        upgrades.loopBuilding
    ]
    
    const tabs = createTabFamily({
        loops: () => ({
            display: "Entropic Loops",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        <MainDisplayVue resource={accelerons} color={color} effectDisplay={jsx(() => <>which are causing time to go {format(unref(timeMult))}x faster<br />
                        For every second in real time, {formatTime(unref(timeMult))} passes</>)}/>
                        {unref(upgrades.passiveAcceleron.bought) ? <SpacerVue height="70px" /> : render(resetButtons[unref(unlockOrder)])}
                        <SpacerVue height="50px" />
                        <UpgradeRingVue radius={192} width={60} distance={150} top={4} right={right} bottom={4} left={left} />
                        <SpacerVue />
                        <LoopsVue radius={175} bars={Object.values(loops)} buildButton={loopToggleButton} />
                        <SpacerVue height="67px" />
                        <LoopDescriptionsVue />
                    </>
                ))
            }))
        }),
        enhancements: () => ({
            display: "Entropic Enhancements",
            tab: createTab(() => ({
                display: entropy.display
            }))
        })
    })

    return {
        name,
        color,
        accelerons,
        bestAccelerons,
        totalAccelerons,
        timeMult,
        time,
        tabs,
        display: jsx(() => (
            <>
                {unref(upgrades.enhancement.bought)
                    ? render(tabs)
                    : render(unref(tabs.tabs.loops.tab))}
            </>
        )),
        conversions,
        loops,
        loopToggle,
        numBuiltLoops,
        upgrades,
        achievements,
        resetButtons,
        unlockOrder
    }
})

export default layer;