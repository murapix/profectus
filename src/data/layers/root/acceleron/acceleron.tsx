import { jsx } from "features/feature";
import { createResource, trackBest, trackTotal } from "features/resources/resource";
import { BaseLayer, createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { ComputedRef, computed, unref } from "vue";
import timecube from "../timecube-old/timecube";
import { EffectUpgrade, EffectUpgradeOptions, GenericUpgrade, createUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import entropy from "./entropy";
import { format, formatTime, formatWhole } from "util/break_eternity";
import loops from "./loops";
import { noPersist, persistent } from "game/persistence";
import { createAchievement } from "features/achievements/achievement";
import { effectDecorator } from "features/decorators/common";
import { displayRequirements, createCostRequirement } from "game/requirements";
import entangled from "../entangled/entangled";
import fome, { FomeTypes } from "../fome/fome";
import inflaton from "../inflaton/inflaton";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import SpacerVue from "components/layout/Spacer.vue";
import { render, renderRow } from "util/vue";
import UpgradeRingVue from "../acceleron/UpgradeRing.vue";
import { createTabFamily } from "features/tabs/tabFamily";
import { createTab } from "features/tabs/tab";
import { createCumulativeConversion } from "features/conversion";
import { createResetButton } from "data/common";

export const id = "acceleron";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Accelerons";
    const color = "#0f52ba";

    const accelerons = createResource<DecimalSource>(0, name);
    const bestAccelerons = trackBest(accelerons);
    const totalAccelerons = trackTotal(accelerons);

    const conversion = createCumulativeConversion(() => ({
        formula: fome => fome.times(getUpgradeEffect(upgrades.translation))
                             .times(getUpgradeEffect(upgrades.fluctuation))
                             .dividedBy(computed(() => entangled.isFirstBranch(id) ? 1e6 : 1e80))
                             .pow(computed(() => entangled.isFirstBranch(id) ? 0.1 : 0.05)),
        baseResource: noPersist(fome[FomeTypes.quantum].amount),
        gainResource: noPersist(accelerons),
        onConvert() {
            if (entangled.isFirstBranch(id)) entangled.branchOrder.value = id;
        }
    }));
    const resetButton = createResetButton(() => ({
        conversion,
        style: {
            width: 'fit-content',
            padding: '5px 10px',
            minHeight: '60px'
        }
    }));

    const timeInput = computed(() => {
        let amount = Decimal.max(unref(bestAccelerons), 0).plus(1);
        return amount.gte(1e12) ? amount.log10().times(5e5/6) : amount.sqrt();
    });
    const timeModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: (timecube.upgrades.time as EffectUpgrade<DecimalSource>).effect,
            enabled: timecube.upgrades.time.bought,
            description: jsx(() => <>[{timecube.name}] Time</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.dilation.effect,
            enabled: entropy.enhancements.dilation.bought,
            description: jsx(() => <>[{name}] Entropic Dilation</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => <>[{timecube.name}] Back Time Squares ({formatWhole(Decimal.dZero)})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => <>[{timecube.name}] Timecube Upgrade 35</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => <>[{timecube.name}] Active Back Timeline Effect</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => <>[{timecube.name}] Passive Back Timeline Bonus</>)
        }))
    ]);
    const timeMult: ComputedRef<Decimal> = computed(() => new Decimal(timeModifiers.apply(unref(timeInput))));

    const time = persistent<DecimalSource>(0);
    this.on("preUpdate", (diff) => {
        time.value = Decimal.add(unref(time), diff);
    });

    const achievements = {
        protoversal: createAchievement(() => ({ // keep protoversal fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 1) },
            small: true
        })),
        infinitesimal: createAchievement(() => ({ // keep infinitesimal fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 2) },
            small: true
        })),
        subspatial: createAchievement(() => ({ // keep subspatial fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 3) },
            small: true
        })),
        skyrmion: createAchievement(() => ({ // start with 10 skyrmions
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 5) },
            small: true
        })),
        subplanck: createAchievement(() => ({ // keep subplanck fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 7) },
            small: true
        })),
        quantum: createAchievement(() => ({ // keep quantum fome upgrades and boosts
            shouldEarn() { return Decimal.gte(unref(totalAccelerons), 10) },
            small: true
        }))
    }

    const upgrades = (() => {
        const acceleration = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || Decimal.gte(unref(totalAccelerons), 4) },
            display: jsx(() => (
                <>
                    <h3>Minute Acceleration</h3><br /><br />
                    Time speed massively multiplies Foam generation<br /><br />
                    Currently: {format(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}x<br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            effect() { return unref(timeMult).abs().sqrt().times(1000) },
            requirements: createCostRequirement(() => ({
                cost: 1,
                resource: noPersist(accelerons)
            }))
        }), effectDecorator) as EffectUpgrade<Decimal>;
        const translation = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || unref(acceleration.bought) },
            display: jsx(() => (
                <>
                    <h3>Quantum Translation</h3><br /><br />
                    Each Foam re-formation increases Acceleron gain by 100%<br /><br />
                    Currently: {formatWhole(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}x<br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            effect() { return Object.values(FomeTypes).map(fomeType => unref(fome[fomeType].upgrades.reform.amount)).reduce((a: Decimal,b) => a.plus(b), Decimal.dZero) },
            requirements: createCostRequirement(() => ({
                cost: 5,
                resource: noPersist(accelerons)
            }))
        }), effectDecorator) as EffectUpgrade<Decimal>;
        const skyrmion = createUpgrade(upgrade => ({
            visibility() { return unref(this.bought) || unref(acceleration.bought) },
            display: jsx(() => (
                <>
                    <h3>Superpositional Acceleration</h3><br /><br />
                    Gain a new Pion upgrade<br />
                    Gain a new Spinor upgrade<br /><br />
                    <br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            requirements: createCostRequirement(() => ({
                cost: 25,
                resource: noPersist(accelerons)
            }))
        })) as GenericUpgrade;
        const superstructures = createUpgrade(upgrade => ({
            visibility() { return unref(this.bought) || unref(skyrmion.bought) },
            display: jsx(() => (
                <>
                    <h3>Quasi-temporal Superstructures</h3><br /><br />
                    Consume the past to build the future<br /><br /><br />
                    <br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            requirements: createCostRequirement(() => ({
                cost: 50,
                resource: noPersist(accelerons)
            }))
        })) as GenericUpgrade;
        const fluctuation = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || unref(loops.loops.acceleron.built) },
            display: jsx(() => (
                <>
                    <h3>Temporal Fluctuation</h3><br /><br />
                    Each Entropic Loop multiplies Acceleron gain<br /><br />
                    Currently: {formatWhole(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}x<br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            effect() { return unref(loops.numBuiltLoops) + 1 },
            requirements: createCostRequirement(() => ({
                cost: new Decimal(100),
                resource: noPersist(accelerons)
            }))
        }), effectDecorator) as EffectUpgrade<number>;
        const expansion = createUpgrade(upgrade => ({
            visibility() { return unref(this.bought) || unref(loops.loops.instantProd.built) },
            display: jsx(() => (
                <>
                    <h3>Unstable Expansion</h3><br /><br />
                    Unlock Entropic Enhancements<br /><br /><br />
                    <br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            requirements: createCostRequirement(() => ({
                cost: new Decimal(300),
                resource: noPersist(accelerons)
            }))
        })) as GenericUpgrade;
        const conversion = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || unref(loops.loops.timecube.built) },
            display: jsx(() => (
                <>
                    <h3>Stability Conversion</h3><br /><br />
                    Each Entropic Loop multiplies Time Cube gain<br /><br />
                    Currently: {formatWhole(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}x<br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            effect() { return unref(loops.numBuiltLoops) + 1 },
            requirements: createCostRequirement(() => ({
                cost: new Decimal(150000),
                resource: noPersist(accelerons)
            }))
        }), effectDecorator) as EffectUpgrade<number>;
        const alacrity = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || unref(conversion.bought) },
            display: jsx(() => (
                <>
                    <h3>Subspatial Alacrity</h3><br /><br />
                    Increase Subspatial Foam gain by {formatWhole(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}x<br /><br />
                    <br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            effect: 1e4,
            requirements: createCostRequirement(() => ({
                cost: 2e6,
                resource: noPersist(accelerons)
            }))
        })) as EffectUpgrade<DecimalSource>;
        const tetration = createUpgrade(upgrade => ({
            visibility() { return unref(this.bought) || unref(alacrity.bought) },
            display: jsx(() => (
                <>
                    <h3>Cubic Tetration</h3><br /><br />
                    Remove the ability to Acceleron reset<br />
                    Unlock two additional Entropic Loops<br /><br />
                    <br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            requirements: createCostRequirement(() => ({
                cost: 1e8,
                resource: noPersist(accelerons)
            }))
        })) as GenericUpgrade;
        const mastery = createUpgrade(upgrade => ({
            visibility() { return unref(this.bought) || unref(tetration.bought) },
            display: jsx(() => (
                <>
                    <h3>Temporal Mastery</h3><br /><br />
                    Unlock {entangled.isFirstBranch(id) ? inflaton.inflatons.displayName : entangled.strings.displayName}<br /><br /><br />
                    <br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            requirements: createCostRequirement(() => ({
                cost: 1e19,
                resource: noPersist(accelerons)
            }))
        })) as GenericUpgrade;

        return {
            acceleration, translation, skyrmion, superstructures, fluctuation,
            expansion, conversion, alacrity, tetration, mastery
        };
    })();
    const left = [
        upgrades.acceleration,
        upgrades.fluctuation,
        upgrades.tetration,
        upgrades.conversion,
        upgrades.skyrmion
    ];
    const right = [
        upgrades.translation,
        upgrades.expansion,
        upgrades.mastery,
        upgrades.alacrity,
        upgrades.superstructures
    ];

    const tabs = createTabFamily({
        loops: () => ({
            display: "Entropic Loops",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        <MainDisplayVue resource={accelerons} color={color} effectDisplay={jsx(() => <>which are causing time to go {format(unref(timeMult))}x faster<br />
                        For every second in real time, {formatTime(unref(timeMult))} passes</>)} />
                        {unref(upgrades.tetration.bought) ? <SpacerVue height="70px" /> : render(resetButton)}
                        {render(loops.upperDisplay)}
                        <UpgradeRingVue radius={192} width={60} distance={150} top={4} right={right} bottom={4} left={left} />
                        <SpacerVue />
                        {render(loops.lowerDisplay)}
                        <SpacerVue />
                        {renderRow(...Object.values(achievements))}
                    </>
                ))
            })),
            enhancements: () => ({
                display: "Entropic Enhancements",
                tab: createTab(() => ({
                    display: entropy.display
                }))
            })
        })
    })

    return {
        name,
        color,
        accelerons,
        bestAccelerons,
        totalAccelerons,
        conversion,
        timeMult,
        time,
        upgrades,
        achievements,
        tabs,
        display: jsx(() => (
            <>
                {unref(upgrades.expansion.bought)
                    ? render(tabs)
                    : render(unref(tabs.tabs.loops.tab))
                }
            </>
        )),

        loops,
        entropy
    }
})

export default layer;