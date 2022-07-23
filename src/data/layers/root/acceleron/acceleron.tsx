import SpacerVue from "components/layout/Spacer.vue";
import { createLayerTreeNode, createResetButton } from "data/common";
import { root } from "data/projEntry";
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
import { CoercableComponent, jsx, showIf } from "features/feature";
import { createReset } from "features/reset";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource, trackBest, trackTotal } from "features/resources/resource";
import { createUpgrade, GenericUpgrade, UpgradeOptions } from "features/upgrades/upgrade";
import { globalBus } from "game/events";
import { createLayer, BaseLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatTime, formatWhole } from "util/break_eternity";
import { ProcessedComputable } from "util/computed";
import { render, renderCol, renderColJSX, renderRow, renderRowJSX } from "util/vue";
import { computed, ComputedRef, unref } from "vue";
import fome, { FomeTypes } from "../fome/fome";
import skyrmion from "../skyrmion/skyrmion";
import timecube from "../timecube/timecube";
import { createLoop, GenericLoop } from "./loop";
import LoopsVue from "./Loops.vue";
import UpgradeRingVue from "./UpgradeRing.vue";

const id = "acceleron";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Accelerons";
    const color = "#0f52ba";

    const accelerons = createResource<DecimalSource>(0, "Accelerons");
    const bestAccelerons = trackBest(accelerons);
    const totalAccelerons = trackTotal(accelerons);

    const entropy = createResource<DecimalSource>(0, "Entropy");
    const bestEntropy = trackBest(entropy);

    const timeMult = computed(() => {
        let mult = Decimal.max(unref(bestAccelerons), 0).plus(1);
        mult = mult.gte(1e12) ? mult.log10().times(5e5/6) : mult.sqrt();
        return mult.times(1) // timecube upgrade 12
                   .times(1) // acceleron upgrade 113
                   .times(1) // back time square
                   .times(1) // timecube upgrade 35
                   .div(1) // active back timeline
                   .times(1) // passive back timeline
                   .max(1)
                   .times(1) // negate if constructing
    })
    
    const conversions = [
        createCumulativeConversion(() => ({
            scaling: createPolynomialScaling(1e6, 0.1),
            baseResource: fome.amounts[FomeTypes.quantum],
            gainResource: accelerons,
            costModifier: createSequentialModifier(
                createMultiplicativeModifier(upgrades.reformToAcceleronGain.effect, '', upgrades.reformToAcceleronGain.bought),
                createMultiplicativeModifier(upgrades.loopToAcceleronGain.effect, '', upgrades.loopToAcceleronGain.bought)
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

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => []
        /*
         * first milestone: keep protoversal fome upgrades and boosts
         * second milestone: keep infinitesimal fome upgrades and boosts
         * third milestone: keep subspatial fome upgrades and boosts
         * fifth milestone: keep subplanck fome upgrades and boosts
         * sixth milestone: keep quantum fome upgrades and boosts
         */
    }));

    const treeNode = createLayerTreeNode(() => ({
        display: "A",
        layerID: id,
        color,
        reset
    }));

    const resetTime = persistent<DecimalSource>(0);
    const resetButtons = conversions.map(conversion => 
        createResetButton(() => ({
            conversion,
            tree: root.tree,
            treeNode,
            resetTime: resetTime,
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
                description: jsx(() => (<></>))
            },
            effect() { return Decimal.add(0.001, 1) // acceleron upgrade 123
                                     .div(1) // active timeline right effect
                                     .times(1) // passive timeline right bonus
                                     .plus(1)
            },
            trigger(intervals = Decimal.dOne) {
                let gain = new Decimal(unref(conversions[unref(unlockOrder)].currentGain));
                gain = gain.times(unref(this.effect));
                gain = gain.times(intervals);
                if (false) gain = gain.max(1); // timecube upgrade 44

                accelerons.value = Decimal.add(unref(accelerons), gain);
            }
        })),
        instantProduction: createLoop(() => ({
            visibility() { return showIf(unref(this.built) || unref(loops.acceleron.built)) },
            buildRequirement: new Decimal(360),
            triggerRequirement: new Decimal(60),
            display: () => ({
                color: unref(skyrmion.color),
                width: 10,
                description: jsx(() => (<></>))
            }),
            effect() { return Decimal.plus(1, 1) // acceleron upgrade 111
                                     .div(1) // active right timeline effect
                                     .times(1) // passive right timeline bonus
            },
            trigger(intervals = Decimal.dOne) {
                const gain = new Decimal(unref(this.triggerRequirement as ProcessedComputable<DecimalSource>)).times(unref(this.effect)).times(intervals);
                skyrmion.pions.value = gain.times(unref(skyrmion.pionRate)).plus(unref(skyrmion.pions));
                skyrmion.spinors.value = gain.times(unref(skyrmion.spinorRate)).plus(unref(skyrmion.spinors));
                Object.values(FomeTypes).forEach(type => fome.amounts[type].value = gain.times(unref(fome.rates[type])).plus(unref(fome.amounts[type])));
            }
        })),
        timecube: createLoop(() => ({
            visibility() { return showIf(unref(this.built) || unref(loops.instantProduction.built)) },
            buildRequirement: new Decimal(600),
            triggerRequirement: new Decimal(3600),
            display: {
                color: timecube.color,
                width: 10,
                description: jsx(() => (<></>))
            },
            effect() { return new Decimal(1) // timecube upgrade 11
                                .times(1) // acceleron upgrade 22
                                .times(1) // acceleron upgrade 141
                                .times(1) // front time square
                                .div(1) // active right timeline effect
                                .times(1) // passive right timeline bonus
                                .div(1) // active front timeline effect
                                .times(1) // passive front timeline bonus
            },
            trigger(intervals = Decimal.dOne) {
                timecube.timecubes.value = unref(this.effect).times(intervals).plus(unref(timecube.timecubes))
            }
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
        reformToAcceleronGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.fomeGain.bought)) },
            display: jsx(() => {
                let upgrade = upgrades.reformToAcceleronGain;
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
        skyrmionUpgradeUnlock: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.fomeGain.bought)) },
            display: jsx(() => {
                let upgrade = upgrades.skyrmionUpgradeUnlock;
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
            visibility() { return showIf(unref(this.bought) || unref(upgrades.skyrmionUpgradeUnlock.bought)) },
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
        loopToAcceleronGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || false) },
            display: "Temporal Fluctuation",
            cost: Decimal.dInf,
            resource: accelerons
        })),
        enhancementUnlock: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || false) },
            display: "Unstable Expansion",
            cost: Decimal.dInf,
            resource: accelerons
        })),
        loopToTimecubeGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || false) },
            display: "Stability Conversion",
            cost: Decimal.dInf,
            resource: accelerons
        })),
        subspatialGain: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || false) },
            display: "Subspatial Alacrity",
            cost: Decimal.dInf,
            resource: accelerons
        })),
        passiveAcceleron: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || false) },
            display: "Cubic Tetration",
            cost: Decimal.dInf,
            resource: accelerons
        })),
        inflatonUnlock: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || false) },
            display: "Temporal Mastery",
            cost: Decimal.dInf,
            resource: accelerons
        }))
    }
    const left = [
        upgrades.fomeGain,
        upgrades.loopToAcceleronGain,
        upgrades.passiveAcceleron,
        upgrades.loopToTimecubeGain,
        upgrades.skyrmionUpgradeUnlock
    ];
    const right = [
        upgrades.reformToAcceleronGain,
        upgrades.enhancementUnlock,
        upgrades.inflatonUnlock,
        upgrades.subspatialGain,
        upgrades.loopBuilding
    ]
    
    return {
        name,
        color,
        accelerons,
        bestAccelerons,
        totalAccelerons,
        entropy,
        bestEntropy,
        timeMult,
        resetTime,
        display: jsx(() => (
            <>
                <MainDisplayVue resource={accelerons} color={color} effectDisplay={jsx(() => <>which are causing time to go {format(unref(timeMult))}x faster<br />
                For every second in real time, {formatTime(unref(timeMult))} passes</>)}/>
                {render(resetButtons[0])}
                <SpacerVue height="50px" />
                <UpgradeRingVue radius={192} width={60} distance={150} top={4} right={right} bottom={4} left={left} />
                <SpacerVue />
                <LoopsVue radius={175} bars={[loops.acceleron, loops.instantProduction]} />
            </>
        )),
        treeNode,
        conversions,
        loops,
        upgrades
    }
})

export default layer;