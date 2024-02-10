import { StyleValue, jsx } from "features/feature";
import { createLayer, BaseLayer } from "game/layers";
import skyrmion from "../skyrmion/skyrmion";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { ComputedRef, Ref, computed, unref } from "vue";
import { Modifier, createMultiplicativeModifier } from "game/modifiers";
import acceleron from "../acceleron/acceleron";
import entropy from "../acceleron/entropy";
import { EffectUpgrade, GenericUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import { format, formatWhole } from "util/break_eternity";
import { GenericRepeatable } from "features/repeatable";
import { GenericEffectFeature } from "features/decorators/common";
import timecube from "../timecube/timecube";
import protoversal from "./protoversal";
import { GenericAchievement, createAchievement } from "features/achievements/achievement";
import Resource from "features/resources/Resource.vue";
import Spacer from "components/layout/Spacer.vue";
import Fome from "../fome/Fome.vue";
import { render, renderRowJSX } from "util/vue";
import { createTab } from "features/tabs/tab";
import FomeBoost from "../fome/FomeBoost.vue";
import { createTabFamily } from "features/tabs/tabFamily";
import { createBooleanRequirement, displayRequirements } from "game/requirements";
import { addTooltip } from "features/tooltips/tooltip";
import infinitesimal from "./infinitesimal";
import inflaton from "../inflaton/inflaton";
import subspatial from "./subspatial";
import subplanck from "./subplanck";
import quantum from "./quantum";
import entangled from "../entangled/entangled";
import { noPersist } from "game/persistence";
import { Sides } from "../timecube/timesquares";
import timelines from "../timecube/timelines";

export enum FomeTypes {
    protoversal = "protoversal",
    infinitesimal = "infinitesimal",
    subspatial = "subspatial",
    subplanck = "subplanck",
    quantum = "quantum"
}

export enum FomeDims {
    height = "height",
    width = "width",
    depth = "depth"
}

export type FomeUpgrade = GenericRepeatable & GenericEffectFeature<DecimalSource>;
export type FomeUpgrades = Record<FomeDims, FomeUpgrade>
                         & { condense: GenericUpgrade }
                         & { reform: FomeUpgrade };

export function onDimRepeatable(type: FomeTypes) {
    const index = layer[type].boosts.index;
    const boost = layer[type].boosts[unref(index)].amount;
    boost.value = Decimal.add(unref(boost), 1);
    index.value = (unref(index) === 5 ? 1 : unref(index) + 1) as 1|2|3|4|5;
}

export function getDimDisplay(fomeType: FomeTypes, dim: FomeDims) {
    let dimName: string;
    switch (dim) {
        case FomeDims.height: dimName = "Height"; break;
        case FomeDims.width: dimName = "Width"; break;
        case FomeDims.depth: dimName = "Depth"; break;
    }
    return jsx(() => (
        <>
            <h3>Enlarge {layer[fomeType].amount.displayName} {dimName} by 1m</h3><br />
            <br />
            Current {dimName}: {format(unref(layer[fomeType].upgrades[dim].amount))}m<br />
            <br />
            {displayRequirements(layer[fomeType].upgrades[dim].requirements)}
        </>
    ));
}

export function getReformDisplay(fomeType: FomeTypes) {
    return jsx(() => (
        <>
            Re-form your {layer[fomeType].amount.displayName}<br />
            <br />
            Amount: {formatWhole(unref(layer[fomeType].upgrades.reform.amount))}<br />
            <br />
            {displayRequirements(layer[fomeType].upgrades.reform.requirements)}
        </>
    ));
}

const id = "fome";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Quantum Foam";
    const color = "#ffffff";

    const unlocked: Ref<boolean> = computed(() => unref(entangled.milestones[1].earned) || unref(skyrmion.upgrades.fome.bought));

    const highestFome = computed(() => {
        if (Decimal.gt(unref(quantum.upgrades.reform.amount), 0)) return FomeTypes.quantum;
        else if (Decimal.gt(unref(subplanck.upgrades.reform.amount), 0)) return FomeTypes.subplanck;
        else if (Decimal.gt(unref(subspatial.upgrades.reform.amount), 0)) return FomeTypes.subspatial;
        else if (Decimal.gt(unref(infinitesimal.upgrades.reform.amount), 0)) return FomeTypes.infinitesimal;
        else return FomeTypes.protoversal;
    });

    const generalProductionModifiers: Modifier[] = [
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.spinor.upgrades.eta.effect,
            enabled: () => Decimal.gt(unref(skyrmion.spinor.upgrades.eta.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] Spinor Upgrade η ({formatWhole(unref(skyrmion.spinor.upgrades.eta.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: (acceleron.upgrades.acceleration as EffectUpgrade<DecimalSource>).effect,
            enabled: noPersist(acceleron.upgrades.acceleration.bought),
            description: jsx(() => (<>[{acceleron.name}] Acceleration</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: acceleron.loops.loops.tempFome.value,
            enabled: acceleron.loops.loops.tempFome.built,
            description: jsx(() => (<>[{acceleron.name}] Acceleron Loop #4</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.formation.effect as Ref<DecimalSource>,
            enabled: noPersist(entropy.enhancements.formation.bought),
            description: jsx(() => (<>[{acceleron.name}] Entropic Formation</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: inflaton.fomeBonus,
            enabled: () => unref(inflaton.coreResearch.research.fomeGain.researched),
            description: jsx(() => (<>[{inflaton.name}] Inflaton Resonance</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: inflaton.upgrades.moreFome.effect,
            enabled: noPersist(inflaton.upgrades.moreFome.bought),
            description: jsx(() => (<>[{inflaton.name}] Dynamic Inflational Formation</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: quantum.boosts[1].effect,
            enabled: () => Decimal.gt(unref(quantum.boosts[1].total), 0),
            description: jsx(() => (<>[{name}] Quantum Boost 1 ({formatWhole(unref(quantum.boosts[1].total))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: quantum.boosts[3].effect,
            enabled: () => Decimal.gt(unref(quantum.boosts[3].total), 0),
            description: jsx(() => (<>[{name}] Quantum Boost 3 ({formatWhole(unref(quantum.boosts[3].total))})</>))
        }))
    ];

    const timelineBonuses: Modifier[] = [
        createMultiplicativeModifier(() => ({
            multiplier: timelines.buffs[Sides.LEFT],
            enabled: noPersist(timecube.upgrades.tactics.bought),
            description: jsx(() => (<>[{timecube.name}] Passive Left Timeline Bonus</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => Decimal.reciprocate(unref(timelines.nerfs[Sides.LEFT])),
            enabled: noPersist(timecube.upgrades.tactics.bought),
            description: jsx(() => (<>[{timecube.name}] Active Left Timeline Effect</>))
        }))
    ];

    const globalBoostBonus: ComputedRef<Decimal> = computed(() => Decimal.add(getUpgradeEffect(entropy.enhancements.entitlement, 0), getUpgradeEffect(timecube.upgrades.tier, 0)));

    const achievementStyle = {
        fontSize: '48px',
        fontWeight: 'normal',
        color: 'var(--feature-foreground)'
    } as StyleValue
    const achievements: Record<FomeTypes | 'reform', GenericAchievement & { tooltip: { requirement: JSX.Element, effect: JSX.Element } }> = {
        [FomeTypes.protoversal]: createAchievement(() => ({
            display: jsx(() => <span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>2</sup></span>),
            requirements: createBooleanRequirement(() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 2)),
            tooltip: {
                requirement: <>Re-form your Protoversal Foam</>,
                effect: <>Unlock the Pion and Spinor Buy All button<br />Automatically enlarge your Protoversal Foam</>
            }
        })),
        [FomeTypes.infinitesimal]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>3</sup></span></>),
            requirements: createBooleanRequirement(() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 3)),
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>3</sup></>,
                effect: <>Automatically enlarge your Infinitesimal Foam</>
            }
        })),
        [FomeTypes.subspatial]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>4</sup></span></>),
            requirements: createBooleanRequirement(() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 4)),
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>4</sup></>,
                effect: <>Automatically enlarge your Subspatial Foam</>
            }
        })),
        [FomeTypes.subplanck]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>5</sup></span></>),
            requirements: createBooleanRequirement(() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 5)),
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>5</sup></>,
                effect: <>Automatically enlarge your Subplanck Foam</>
            }
        })),
        [FomeTypes.quantum]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>6</sup></span></>),
            requirements: createBooleanRequirement(() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 6)),
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>6</sup></>,
                effect: <>Automatically enlarge your Quantum Foam</>
            }
        })),
        reform: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>Q<sup style={{fontWeight: 'normal'}}>2</sup></span></>),
            requirements: createBooleanRequirement(() => Decimal.gte(unref(quantum.upgrades.reform.amount), 2)),
            tooltip: {
                requirement: <>Re-form your Quantum Foam</>,
                effect: <>Automatically re-form your Foam</>
            }
        }))
    }
    for (const achievement of Object.values(achievements)) {
        addTooltip(achievement, {
            display: jsx(() => (<><h3>{achievement.tooltip.requirement}</h3><br />{achievement.tooltip.effect}</>))
        });
    }

    const tabs = createTabFamily({
        main: () => ({
            display: "Foam",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        <div>
                            You have <Resource resource={layer[unref(highestFome)].amount} color={color} /> {layer[unref(highestFome)].amount.displayName}
                            {Decimal.gt(unref(layer[unref(highestFome)].upgrades.reform.amount), 1)
                                ? <sup>{formatWhole(unref(layer[unref(highestFome)].upgrades.reform.amount))}</sup>
                                : undefined
                            }
                        </div>
                        <Spacer />
                        <Fome />
                        <Spacer height="8px" />
                        {renderRowJSX(...Object.values(achievements))}
                    </>
                ))
            }))
        }),
        boosts: () => ({
            display: "Boosts",
            tab: createTab(() => ({ display: jsx(() => (<FomeBoost />)) }))
        })
    });

    return {
        name,
        color,
        unlocked,
        production: generalProductionModifiers,
        timelineProduction: timelineBonuses,
        globalBoostBonus,
        achievements,
        display: jsx(() => (
            <>
                {Decimal.gt(unref(protoversal.boosts[1].total), 0)
                    ? render(tabs)
                    : render(unref(tabs.tabs.main.tab))
                }
            </>
        )),
        tabStyle: { "--bought": "#929aa9" },
        tabs,

        [FomeTypes.protoversal]: protoversal,
        [FomeTypes.infinitesimal]: infinitesimal,
        [FomeTypes.subspatial]: subspatial,
        [FomeTypes.subplanck]: subplanck,
        [FomeTypes.quantum]: quantum
    }
});

export default layer;