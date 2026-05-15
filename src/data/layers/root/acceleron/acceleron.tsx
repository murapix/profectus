import Spacer from "components/layout/Spacer.vue";
import { createResetButton } from "data/common";
import { inAbyss, root } from "data/projEntry";
import { Achievement, createAchievement } from "features/achievements/achievement";
import { createCumulativeConversion } from "features/conversion";
import { createHotkey } from "features/hotkey";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import NamedResource from "features/resources/NamedResource.vue";
import { createResource, trackBest, trackTotal } from "features/resources/resource";
import { createTab } from "features/tabs/tab";
import { createTabFamily } from "features/tabs/tabFamily";
import { createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { noPersist, persistent } from "game/persistence";
import { createCostRequirement, displayRequirements } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatTime, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { render, Renderable, renderRow } from "util/vue";
import { CSSProperties, ComputedRef, Ref, StyleValue, computed, nextTick, unref } from "vue";
import UpgradeRing from "./upgradeRing/UpgradeRing.vue";
import entangled from "../entangled/entangled";
import fome, { FomeTypes } from "../fome/fome";
import inflaton, { id as inflatonId } from "../inflaton/inflaton";
import skyrmion from "../skyrmion/skyrmion";
import timecube from "../timecube/timecube";
import { Sides } from "../timecube/timesquares";
import entropy from "./enhancements/entropy";
import loops from "./loops/loops";
import { addTooltip } from "wrappers/tooltips/tooltip";
import { createUpgrade, getUpgradeEffect } from "features/clickables/upgrade";
import { effectMixin } from "mixins/effects";

export const id = "acceleron";
const layer = createLayer(id, () => {
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

    const accelerons = createResource<DecimalSource>(0, { displayName: name, singularName: "Acceleron", abyssal: true });
    const bestAccelerons = trackBest(accelerons);
    const totalAccelerons = trackTotal(accelerons);

    const acceleronGainModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: upgrades.translation.effect,
            enabled: noPersist(upgrades.translation.bought),
            description: () => <>[{name}] Quantum Translation</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upgrades.fluctuation.effect,
            enabled: noPersist(upgrades.fluctuation.bought),
            description: () => <>[{name}] Temporal Fluctuation</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: loops.averageLoopValues[loops.loops.tempAcceleron.id],
            enabled: noPersist(loops.loops.tempAcceleron.built),
            description: () => <>[{name}] Entropic Loop #5</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.contraction.effect!,
            enabled: noPersist(entropy.enhancements.contraction.bought),
            description: () => <>[{entropy.name}] Entropic Contraction</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.inversion.effect!,
            enabled: noPersist(entropy.enhancements.inversion.bought),
            description: () => <>[{entropy.name}] Entropic Inversion</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.rotation.effect!,
            enabled: noPersist(entropy.enhancements.rotation.bought),
            description: () => <>[{entropy.name}] Entropic Rotation</>
        }))
    ]);
    const conversion = createCumulativeConversion(() => ({
        formula: fome => fome.dividedBy(computed((): number => (unref(entangled.branchOrder) === '' || entangled.isFirstBranch(id)) ? 1e9 : 1e71))
                             .pow(computed((): number => (unref(entangled.branchOrder) === '' || entangled.isFirstBranch(id)) && !unref(inAbyss) ? 0.1 : 0.05))
                             .times(computed(() => acceleronGainModifiers.apply(1))),
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
        const amount = Decimal.max(unref(bestAccelerons), 0).plus(1);
        return amount.gte(1e12) ? amount.log10().times(5e5/6) : amount.sqrt();
    });
    const timeModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: () => Decimal.sqr(unref(upgrades.fluctuation.effect!)).reciprocate(),
            enabled: inAbyss,
            description: () => <>[{name}] Abyssal Interference</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: timecube.upgrades.time.effect,
            enabled: noPersist(timecube.upgrades.time.bought),
            description: () => <>[{timecube.name}] Time</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.dilation.effect!,
            enabled: noPersist(entropy.enhancements.dilation.bought),
            description: () => <>[{name}] Entropic Dilation</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: timecube.getTimesquareEffect(Sides.BACK),
            enabled: () => Decimal.gt(unref(timecube.timesquares.squares[Sides.BACK].square.amount), 0),
            description: () => <>[{timecube.name}] Back Time Squares ({formatWhole(unref(timecube.timesquares.squares[Sides.BACK].square.amount))})</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 2,
            enabled: timecube.upgrades.tour.bought,
            description: () => <>[{timecube.name}] Tour</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => Decimal.reciprocate(unref(timecube.timelines.nerfs[Sides.BACK])),
            enabled: () => unref(timecube.timelines.depths[Sides.BACK]) > 0,
            description: () => <>[{timecube.name}] Active Back Timeline Effect</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: timecube.timelines.buffs[Sides.BACK],
            enabled: () => unref(timecube.timelines.scores[Sides.BACK]).gt(0),
            description: () => <>[{timecube.name}] Passive Back Timeline Bonus</>
        })),
    ]);
    const timeMult: ComputedRef<Decimal> = computed(() => new Decimal(timeModifiers.apply(unref(timeInput))));

    const time = persistent<DecimalSource>(0);
    layer.on("preUpdate", (diff: number) => {
        if (!unref(loops.isBuilding)) time.value = Decimal.add(unref(time), diff);
    });

    const totalAcceleronResource = createResource(noPersist(totalAccelerons));
    const achievementTextStyle = {
        fontSize: '48px',
        fontWeight: 'normal'
    } as StyleValue
    const achievementStyle = (feature: Achievement) => ({
        background: 'var(--quarter-transparent)',
        border: `solid ${unref(feature.earned) ? 'var(--bought)' : 'var(--feature-background)'} 2px`,
        borderRadius: 0,
        color: unref(feature.earned) ? 'var(--bought)' : 'var(--feature-foreground)',
    });
    const achievements = (() => {
        const protoversal = createAchievement(() => ({ // keep protoversal fome upgrades and boosts
            display: () => <span style={achievementTextStyle}>P</span>,
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 1
            })),
            small: true,
            style: (): CSSProperties => achievementStyle(protoversal),
            tooltip: {
                requirement: <>1 Acceleron</>,
                effect: <>Keep Protoversal Boosts and Size Upgrades on Acceleron reset<br />
                          Keep Foam Achievements on Acceleron reset</>
            }
        }));
        const infinitesimal = createAchievement(() => ({ // keep infinitesimal fome upgrades and boosts
            display: () => <span style={achievementTextStyle}>I</span>,
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 2
            })),
            small: true,
            style: (): CSSProperties => achievementStyle(infinitesimal),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={2} />,
                effect: <>Keep Infinitesimal Boosts and Size Upgrades on Acceleron reset</>
            }
        }));
        const subspatial = createAchievement(() => ({ // keep subspatial fome upgrades and boosts
            display: () => <span style={achievementTextStyle}>Ss</span>,
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 3
            })),
            small: true,
            style: (): CSSProperties => achievementStyle(subspatial),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={3} />,
                effect: <>Keep Subspatial Boosts and Size Upgrades on Acceleron reset</>
            }
        }));
        const skyrmion = createAchievement(() => ({ // start with 10 skyrmions
            display: () => <span style={achievementTextStyle}>S</span>,
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 5
            })),
            small: true,
            style: (): CSSProperties => achievementStyle(skyrmion),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={5} />,
                effect: <>Start with 10 Skyrmions on Acceleron reset</>
            }
        }));
        const subplanck = createAchievement(() => ({ // keep subplanck fome upgrades and boosts
            display: () => <span style={achievementTextStyle}>Sp</span>,
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 10
            })),
            small: true,
            style: (): CSSProperties => achievementStyle(subplanck),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={10} />,
                effect: <>Keep Subplanck Boosts and Size Upgrades on Acceleron reset</>
            }
        }));
        const quantum = createAchievement(() => ({ // keep quantum fome upgrades and boosts
            display: () => <span style={achievementTextStyle}>Q</span>,
            requirements: createCostRequirement(() => ({
                resource: noPersist(totalAcceleronResource),
                cost: 25
            })),
            small: true,
            style: (): CSSProperties => achievementStyle(quantum),
            tooltip: {
                requirement: <NamedResource resource={noPersist(accelerons)} override={25} />,
                effect: <>Keep Quantum Boosts and Size Upgrades on Acceleron reset</>
            }
        }));
        return { protoversal, infinitesimal, subspatial, skyrmion, subplanck, quantum };
    })();
    for (const achievement of Object.values(achievements)) {
        addTooltip(achievement, () => ({
            display: <><h3>{achievement.tooltip.requirement}</h3><br />{achievement.tooltip.effect}</>
        }));
    }


    const upgrades = (() => {
        const acceleration = createUpgrade(() => ({
            visibility(): boolean { return unref(acceleration.bought) || Decimal.gte(unref(totalAccelerons), 4) || Decimal.gte(unref(entangled.strings), 1) },
            display: (): Renderable => (
                <>
                    <h3>Minute Acceleration</h3><br /><br />
                    Time speed massively multiplies Foam generation<br /><br />
                    Currently: {format(getUpgradeEffect(acceleration, undefined, true))}×<br />
                    {displayRequirements(acceleration.requirements)}
                </>
            ),
            ...effectMixin(() => unref(timeMult).abs().sqrt().times(1000) ),
            requirements: createCostRequirement(() => ({
                cost: 1,
                resource: noPersist(accelerons)
            }))
        }));
        const translation = createUpgrade(() => ({
            visibility(): boolean { return unref(translation.bought) || unref(acceleration.bought) },
            display: (): Renderable => (
                <>
                    <h3>Quantum Translation</h3><br /><br />
                    Acceleron gain is multiplied based on the number of Foam re-formations<br /><br />
                    Currently: {format(getUpgradeEffect(translation, undefined, true))}×<br />
                    {displayRequirements(translation.requirements)}
                </>
            ),
            ...effectMixin(() => Object.values(FomeTypes).map(fomeType => unref(fome[fomeType].upgrades.reform.amount)).reduce((a: Decimal,b) => a.plus(b), Decimal.dZero).pow(0.75) ),
            requirements: createCostRequirement(() => ({
                cost: 5,
                resource: noPersist(accelerons)
            }))
        }));
        const skyrmion = createUpgrade(() => ({
            visibility(): boolean { return unref(skyrmion.bought) || unref(acceleration.bought) },
            display: (): Renderable => (
                <>
                    <h3>Superpositional Acceleration</h3><br /><br />
                    Gain a new Pion upgrade<br />
                    Gain a new Spinor upgrade<br /><br />
                    <br />
                    {displayRequirements(skyrmion.requirements)}
                </>
            ),
            requirements: createCostRequirement(() => ({
                cost: 50,
                resource: noPersist(accelerons)
            }))
        }));
        const superstructures = createUpgrade(() => ({
            visibility(): boolean { return unref(superstructures.bought) || unref(skyrmion.bought) },
            display: (): Renderable => (
                <>
                    <h3>Quasi-temporal Superstructures</h3><br /><br />
                    Consume the past to build the future<br /><br /><br />
                    <br />
                    {displayRequirements(superstructures.requirements)}
                </>
            ),
            requirements: createCostRequirement(() => ({
                cost: 100,
                resource: noPersist(accelerons)
            }))
        }));
        const fluctuation = createUpgrade(() => ({
            visibility(): boolean { return unref(fluctuation.bought) || unref(loops.loops.acceleron.built) },
            display: (): Renderable => (
                <>
                    <h3>Temporal Fluctuation</h3><br /><br />
                    Acceleron gain is multiplied by the number of completed Entropic Loops<br /><br />
                    Currently: {formatWhole(getUpgradeEffect(fluctuation, undefined, true))}×<br />
                    {displayRequirements(fluctuation.requirements)}
                </>
            ),
            ...effectMixin(() => unref(loops.numBuiltLoops) + 1),
            requirements: createCostRequirement(() => ({
                cost: 250,
                resource: noPersist(accelerons)
            }))
        }));
        const expansion = createUpgrade(() => ({
            visibility(): boolean { return unref(expansion.bought) || unref(loops.loops.instantProd.built) },
            display: (): Renderable => (
                <>
                    <h3>Unstable Expansion</h3><br /><br />
                    Unlock Entropic Enhancements<br /><br /><br />
                    <br />
                    {displayRequirements(expansion.requirements)}
                </>
            ),
            requirements: createCostRequirement(() => ({
                cost: 450,
                resource: noPersist(accelerons)
            }))
        }));
        const conversion = createUpgrade(() => ({
            visibility(): boolean { return unref(conversion.bought) || unref(loops.loops.timecube.built) },
            display: (): Renderable => (
                <>
                    <h3>Stability Conversion</h3><br /><br />
                    Each Entropic Loop multiplies Time Cube gain<br /><br />
                    Currently: {formatWhole(getUpgradeEffect(conversion, undefined, true))}×<br />
                    {displayRequirements(conversion.requirements)}
                </>
            ),
            ...effectMixin(() => unref(loops.numBuiltLoops) + 1 ),
            requirements: createCostRequirement(() => ({
                cost: 150000,
                resource: noPersist(accelerons)
            }))
        }));
        const alacrity = createUpgrade(() => ({
            visibility(): boolean { return unref(alacrity.bought) || unref(conversion.bought) },
            display: (): Renderable => (
                <>
                    <h3>Subspatial Alacrity</h3><br /><br />
                    Increase {unref(fome.subspatial.amount.singularName)} gain by {formatWhole(getUpgradeEffect(alacrity, undefined, true))}×<br /><br />
                    <br />
                    {displayRequirements(alacrity.requirements)}
                </>
            ),
            effect: 1e4,
            requirements: createCostRequirement(() => ({
                cost: 2e6,
                resource: noPersist(accelerons)
            }))
        }));
        const tetration = createUpgrade(() => ({
            visibility(): boolean { return unref(tetration.bought) || unref(alacrity.bought) },
            display: (): Renderable => (
                <>
                    <h3>Cubic Tetration</h3><br /><br />
                    Remove the ability to Acceleron reset<br />
                    Unlock two additional Entropic Loops<br /><br />
                    <br />
                    {displayRequirements(tetration.requirements)}
                </>
            ),
            requirements: createCostRequirement(() => ({
                cost: 5e10,
                resource: noPersist(accelerons)
            }))
        }));
        const mastery = createUpgrade(() => ({
            visibility(): boolean { return unref(mastery.bought) || unref(tetration.bought) },
            display: (): Renderable => (
                <>
                    <h3>Temporal Mastery</h3><br /><br />
                    Unlock {(entangled.isFirstBranch(id) || Decimal.gt(unref(entangled.strings), 0)) ? unref(inflaton.inflatons.displayName) : unref(entangled.strings.displayName)}<br /><br /><br />
                    <br />
                    {displayRequirements(mastery.requirements)}
                </>
            ),
            requirements: [
                createCostRequirement(() => ({
                    cost: 6,
                    resource: createResource(loops.numBuiltLoops, {
                        displayName: "Entropic Loops",
                        abyssal: true
                    }),
                    requiresPay: false
                })),
                createCostRequirement(() => ({
                    cost: 1e21,
                    resource: noPersist(accelerons)
                }))
            ]
        }));

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
            onPress: resetButton.onClick!
        })),
        switchTab: createHotkey(() => ({
            enabled: unlocked,
            key: "ctrl+a",
            description: "Move to Accelerons",
            onPress() { root.tabs.selected.value = name; }
        }))
    }

    const modifiersModal = createModifierModal(
        () => `${unref(accelerons.singularName)} Modifiers`,
        () => [{
            title: () => `${unref(accelerons.singularName)} Gain`,
            modifier: acceleronGainModifiers,
            base: 1,
            baseText: () => <>Base Gain Multiplier</>
        },
        {
            title: "Time Speed",
            modifier: timeModifiers,
            base: timeInput,
            baseText: () => <>[{name}] Best Accelerons ({formatWhole(unref(bestAccelerons))})</>
        }]
    );

    const header = () => (
        <>
            <MainDisplay resource={accelerons} effect={() => <>which are causing time to go {format(unref(timeMult))}× faster{render(modifiersModal)}<br />
            For every second in real time, <pre style={{display: 'inline'}}>{formatTime(unref(timeMult))}</pre> passes</>} />
        </>
    );
    const tabs = createTabFamily({
        loops: () => ({
            display: "Entropic Loops",
            tab: createTab(() => ({
                display: () => (
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
                )
            }))
        }),
        enhancements: () => ({
            display: "Entropic Enhancements",
            tab: createTab(() => ({
                display: () => (
                    <>
                        {render(header)}
                        {render(entropy.display)}
                    </>
                )
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
        display: () => (
            <>
                {unref(upgrades.expansion.bought)
                    ? render(tabs)
                    : render(unref(tabs.tabs.loops.tab))
                }
            </>
        ),
        unlocked,

        loops,
        entropy
    }
})

export default layer;