import Spacer from "components/layout/Spacer.vue";
import { createResetButton } from "data/common";
import { root } from "data/projEntry";
import { BaseAchievement, createAchievement } from "features/achievements/achievement";
import { createCumulativeConversion } from "features/conversion";
import { effectDecorator } from "features/decorators/common";
import { StyleValue, jsx } from "features/feature";
import { createHotkey } from "features/hotkey";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import NamedResource from "features/resources/NamedResource.vue";
import { createResource, trackBest, trackTotal } from "features/resources/resource";
import { createTab } from "features/tabs/tab";
import { createTabFamily } from "features/tabs/tabFamily";
import { addTooltip } from "features/tooltips/tooltip";
import { EffectUpgrade, EffectUpgradeOptions, GenericUpgrade, createUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { noPersist, persistent } from "game/persistence";
import { createCostRequirement, displayRequirements, requirementsMet } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatTime, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { render, renderRow } from "util/vue";
import { ComputedRef, Ref, computed, nextTick, unref } from "vue";
import UpgradeRing from "../acceleron/UpgradeRing.vue";
import entangled from "../entangled/entangled";
import fome, { FomeTypes } from "../fome/fome";
import inflaton, { id as inflatonId } from "../inflaton/inflaton";
import skyrmion from "../skyrmion/skyrmion";
import timecube from "../timecube/timecube";
import { Sides } from "../timecube/timesquares";
import entropy from "./entropy";
import loops from "./loops";

export const id = "acceleron";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Accelerons";
    const theme = {
        "--feature-background": "#0f52ba"
    };

    const unlocked: Ref<boolean> = computed(() => {
        if (unref(entangled.milestones[1].earned)) return true;
        if (entangled.isFirstBranch(id)) return true;
        if (unref(inflaton.coreResearch.research.mastery.researched)) return true;
        return !entangled.isFirstBranch(inflatonId) && unref(fome[FomeTypes.quantum].upgrades.condense.bought);
    });

    const accelerons = createResource<DecimalSource>(0, { displayName: name, singularName: "Acceleron" });
    const bestAccelerons = trackBest(accelerons);
    const totalAccelerons = trackTotal(accelerons);

    const acceleronCostModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: 1e71,
            enabled: () => !(unref(entangled.branchOrder) === '' || entangled.isFirstBranch(id)),
            description: jsx(() => <>[{inflaton.name}] Inflational Interference</>),
            smallerIsBetter: true
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => unref(upgrades.translation.effect).reciprocate(),
            enabled: noPersist(upgrades.translation.bought),
            description: jsx(() => <>[{name}] Quantum Translation</>),
            smallerIsBetter: true
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => 1/unref(upgrades.fluctuation.effect),
            enabled: noPersist(upgrades.fluctuation.bought),
            description: jsx(() => <>[{name}] Temporal Fluctuation</>),
            smallerIsBetter: true
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => unref(loops.averageLoopValues[loops.loops.tempAcceleron.id]).reciprocate(),
            enabled: noPersist(loops.loops.tempAcceleron.built),
            description: jsx(() => <>[{name}] Entropic Loop #5</>),
            smallerIsBetter: true
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => unref(entropy.enhancements.contraction.effect).reciprocate(),
            enabled: noPersist(entropy.enhancements.contraction.bought),
            description: jsx(() => <>[{entropy.name}] Entropic Contraction</>),
            smallerIsBetter: true
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => unref(entropy.enhancements.inversion.effect).reciprocate(),
            enabled: noPersist(entropy.enhancements.inversion.bought),
            description: jsx(() => <>[{entropy.name}] Entropic Inversion</>),
            smallerIsBetter: true
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => unref(entropy.enhancements.rotation.effect).reciprocate(),
            enabled: noPersist(entropy.enhancements.rotation.bought),
            description: jsx(() => <>[{entropy.name}] Entropic Rotation</>),
            smallerIsBetter: true
        }))
    ]);
    const conversion = createCumulativeConversion(() => ({
        formula: fome => fome.dividedBy(acceleronCostModifiers.getFormula!(1e9))
                             .pow(computed(() => (unref(entangled.branchOrder) === '' || entangled.isFirstBranch(id)) ? 0.1 : 0.05)),
        baseResource: noPersist(fome[FomeTypes.quantum].amount),
        gainResource: noPersist(accelerons),
        onConvert() {
            if (unref(entangled.milestones[1].earned)) return;
            if (unref(entangled.branchOrder) === '') entangled.branchOrder.value = id;
        }
    }));
    const reset = createReset(() => ({
        thingsToReset() {
            const toReset: unknown[] = [
                skyrmion.skyrmions,
                skyrmion.pion,
                skyrmion.spinor,

                fome.protoversal.amount, fome.protoversal.upgrades.condense, fome.protoversal.upgrades.reform,
                fome.infinitesimal.amount, fome.infinitesimal.upgrades.condense, fome.infinitesimal.upgrades.reform,
                fome.subspatial.amount, fome.subspatial.upgrades.condense, fome.subspatial.upgrades.reform,
                fome.subplanck.amount, fome.subplanck.upgrades.condense, fome.subplanck.upgrades.reform,
                fome.quantum.amount, fome.quantum.upgrades.condense, fome.quantum.upgrades.reform,
            ];
            if (!unref(achievements.protoversal.earned)) {
                toReset.push(fome.protoversal)
            }
            if (!unref(achievements.infinitesimal.earned)) {
                toReset.push(fome.infinitesimal)
            }
            if (!unref(achievements.subspatial.earned)) {
                toReset.push(fome.subspatial)
            }
            if (!unref(achievements.subplanck.earned)) {
                toReset.push(fome.subplanck)
            }
            if (!unref(achievements.quantum.earned)) {
                toReset.push(fome.quantum)
            }

            return toReset;
        },
        onReset() {
            fome.protoversal.upgrades.reform.amount.value = Decimal.dOne;
            
            if (unref(achievements.skyrmion.earned)) {
                skyrmion.skyrmions.value = Decimal.dTen;
            }
        }
    }))
    const resetButton = createResetButton(() => ({
        conversion,
        style: {
            width: 'fit-content',
            padding: '5px 10px',
            minHeight: '60px'
        },
        onClick() {
            nextTick(() => {
                reset.reset();
                skyrmion.skyrmions.value = unref(achievements.skyrmion.earned) ? 10 : 1;
            });
        }
    }));

    const timeInput = computed(() => {
        let amount = Decimal.max(unref(bestAccelerons), 0).plus(1);
        return amount.gte(1e12) ? amount.log10().times(5e5/6) : amount.sqrt();
    });
    const timeModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: (timecube.upgrades.time as EffectUpgrade<DecimalSource>).effect,
            enabled: noPersist(timecube.upgrades.time.bought),
            description: jsx(() => <>[{timecube.name}] Time</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.dilation.effect,
            enabled: noPersist(entropy.enhancements.dilation.bought),
            description: jsx(() => <>[{name}] Entropic Dilation</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: timecube.getTimesquareEffect(Sides.BACK),
            enabled: () => Decimal.gt(unref(timecube.timesquares.squares[Sides.BACK].square.amount), 0),
            description: jsx(() => <>[{timecube.name}] Back Time Squares ({formatWhole(unref(timecube.timesquares.squares[Sides.BACK].square.amount))})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 2,
            enabled: timecube.upgrades.tour.bought,
            description: jsx(() => <>[{timecube.name}] Tour</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => Decimal.reciprocate(unref(timecube.timelines.nerfs[Sides.BACK])),
            enabled: () => unref(timecube.timelines.depths[Sides.BACK]) > 0,
            description: jsx(() => <>[{timecube.name}] Active Back Timeline Effect</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: timecube.timelines.buffs[Sides.BACK],
            enabled: () => unref(timecube.timelines.scores[Sides.BACK]).gt(0),
            description: jsx(() => <>[{timecube.name}] Passive Back Timeline Bonus</>)
        })),
    ]);
    const timeMult: ComputedRef<Decimal> = computed(() => new Decimal(timeModifiers.apply(unref(timeInput))));

    const time = persistent<DecimalSource>(0);
    this.on("preUpdate", (diff) => {
        time.value = Decimal.add(unref(time), diff);
    });

    const totalAcceleronResource = createResource(noPersist(totalAccelerons));
    const achievementTextStyle = {
        fontSize: '48px',
        fontWeight: 'normal'
    } as StyleValue
    const achievementStyle = (feature: BaseAchievement) => computed(() => ({
        background: 'var(--quarter-transparent)',
        border: `solid ${unref(feature.earned) ? 'var(--bought)' : 'var(--feature-background)'} 2px`,
        borderRadius: 0,
        color: unref(feature.earned) ? 'var(--bought)' : 'var(--feature-foreground)',
    }));
    const achievements = {
        protoversal: createAchievement(feature => ({ // keep protoversal fome upgrades and boosts
            display: jsx(() => <span style={achievementTextStyle}>P</span>),
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 1
            })),
            small: true,
            style: achievementStyle(feature),
            tooltip: {
                requirement: <>1 Acceleron</>,
                effect: <>Keep Protoversal Boosts and Size Upgrades on Acceleron reset<br />
                          Keep Foam Achievements on Acceleron reset</>
            }
        })),
        infinitesimal: createAchievement(feature => ({ // keep infinitesimal fome upgrades and boosts
            display: jsx(() => <span style={achievementTextStyle}>I</span>),
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 2
            })),
            small: true,
            style: achievementStyle(feature),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={2} />,
                effect: <>Keep Infinitesimal Boosts and Size Upgrades on Acceleron reset</>
            }
        })),
        subspatial: createAchievement(feature => ({ // keep subspatial fome upgrades and boosts
            display: jsx(() => <span style={achievementTextStyle}>Ss</span>),
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 3
            })),
            small: true,
            style: achievementStyle(feature),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={3} />,
                effect: <>Keep Subspatial Boosts and Size Upgrades on Acceleron reset</>
            }
        })),
        skyrmion: createAchievement(feature => ({ // start with 10 skyrmions
            display: jsx(() => <span style={achievementTextStyle}>S</span>),
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 5
            })),
            small: true,
            style: achievementStyle(feature),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={5} />,
                effect: <>Start with 10 Skyrmions on Acceleron reset</>
            }
        })),
        subplanck: createAchievement(feature => ({ // keep subplanck fome upgrades and boosts
            display: jsx(() => <span style={achievementTextStyle}>Sp</span>),
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 7
            })),
            small: true,
            style: achievementStyle(feature),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={7} />,
                effect: <>Keep Subplanck Boosts and Size Upgrades on Acceleron reset</>
            }
        })),
        quantum: createAchievement(feature => ({ // keep quantum fome upgrades and boosts
            display: jsx(() => <span style={achievementTextStyle}>Q</span>),
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 10
            })),
            small: true,
            style: achievementStyle(feature),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={10} />,
                effect: <>Keep Quantum Boosts and Size Upgrades on Acceleron reset</>
            }
        }))
    }
    for (const achievement of Object.values(achievements)) {
        addTooltip(achievement, {
            display: jsx(() => (<><h3>{achievement.tooltip.requirement}</h3><br />{achievement.tooltip.effect}</>))
        });
    }


    const upgrades = (() => {
        const acceleration = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || Decimal.gte(unref(totalAccelerons), 4) },
            display: jsx(() => (
                <>
                    <h3>Minute Acceleration</h3><br /><br />
                    Time speed massively multiplies Foam generation<br /><br />
                    Currently: {format(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}×<br />
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
                    Acceleron cost is divided based on the number of Foam re-formations<br /><br />
                    Currently: /{formatWhole(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}<br />
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
                    Acceleron cost is divided based on the number of completed Entropic Loops<br /><br />
                    Currently: /{formatWhole(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}<br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            effect() { return unref(loops.numBuiltLoops) + 1 },
            requirements: createCostRequirement(() => ({
                cost: 100,
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
                cost: 300,
                resource: noPersist(accelerons)
            }))
        })) as GenericUpgrade;
        const conversion = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || unref(loops.loops.timecube.built) },
            display: jsx(() => (
                <>
                    <h3>Stability Conversion</h3><br /><br />
                    Each Entropic Loop multiplies Time Cube gain<br /><br />
                    Currently: {formatWhole(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}×<br />
                    {displayRequirements((upgrade as GenericUpgrade).requirements)}
                </>
            )),
            effect() { return unref(loops.numBuiltLoops) + 1 },
            requirements: createCostRequirement(() => ({
                cost: 150000,
                resource: noPersist(accelerons)
            }))
        }), effectDecorator) as EffectUpgrade<number>;
        const alacrity = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || unref(conversion.bought) },
            display: jsx(() => (
                <>
                    <h3>Subspatial Alacrity</h3><br /><br />
                    Increase Subspatial Foam gain by {formatWhole(getUpgradeEffect(upgrade as EffectUpgrade, undefined, true))}×<br /><br />
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
                    Unlock {(entangled.isFirstBranch(id) || Decimal.gt(unref(entangled.strings), 0)) ? inflaton.inflatons.displayName : entangled.strings.displayName}<br /><br /><br />
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

    const hotkeys = {
        reset: createHotkey(() => ({
            enabled: () => unref(unlocked) && !unref(upgrades.tetration.bought),
            key: "a",
            description: "Form your Quantum Foam into Accelerons",
            onPress: resetButton.onClick
        })),
        switchTab: createHotkey(() => ({
            enabled: unlocked,
            key: "ctrl+a",
            description: "Move to Accelerons",
            onPress() { root.tabs.selected.value = name; }
        }))
    }

    const modifiersModal = createModifierModal(
        "Acceleron Modifiers",
        () => [
            {
                title: "Acceleron Cost",
                modifier: acceleronCostModifiers,
                base: 1e9,
                baseText: jsx(() => <>[{fome.name}] Base Amount</>),
                smallerIsBetter: true
            },
            {
                title: "Time Speed",
                modifier: timeModifiers,
                base: timeInput,
                baseText: jsx(() => <>[{name}] Best Accelerons ({formatWhole(unref(bestAccelerons))})</>)
            }
        ]
    );

    const header = jsx(() => (
        <>
            <MainDisplay resource={accelerons} effect={jsx(() => <>which are causing time to go {format(unref(timeMult))}× faster{render(modifiersModal)}<br />
            For every second in real time, <pre style={{display: 'inline'}}>{formatTime(unref(timeMult))}</pre> passes</>)} />
        </>
    ));
    const tabs = createTabFamily({
        loops: () => ({
            display: "Entropic Loops",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        {render(header)}
                        {unref(upgrades.tetration.bought) ? <Spacer height="70px" /> : render(resetButton)}
                        {render(loops.upperDisplay)}
                        <UpgradeRing radius={192} width={60} distance={150} top={4} right={right} bottom={4} left={left} />
                        <Spacer />
                        {render(loops.lowerDisplay)}
                        <Spacer />
                        <Spacer />
                        {renderRow(...Object.values(achievements))}
                    </>
                ))
            }))
        }),
        enhancements: () => ({
            display: "Entropic Enhancements",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        {render(header)}
                        {render(entropy.display)}
                    </>
                ))
            }))
        })
    })

    return {
        name,
        theme,
        accelerons,
        bestAccelerons,
        totalAccelerons,
        conversion,
        timeMult,
        time,
        upgrades,
        achievements,
        tabs,
        hotkeys,
        display: jsx(() => (
            <>
                {unref(upgrades.expansion.bought)
                    ? render(tabs)
                    : render(unref(tabs.tabs.loops.tab))
                }
            </>
        )),
        unlocked,

        loops,
        entropy
    }
})

export default layer;