import Spacer from "components/layout/Spacer.vue";
import { root } from "data/projEntry";
import { GenericAchievement, createAchievement } from "features/achievements/achievement";
import { GenericEffectFeature } from "features/decorators/common";
import { StyleValue, jsx } from "features/feature";
import { GenericHotkey, createHotkey } from "features/hotkey";
import { GenericRepeatable } from "features/repeatable";
import Resource from "features/resources/Resource.vue";
import { createTab } from "features/tabs/tab";
import { createTabFamily } from "features/tabs/tabFamily";
import { addTooltip } from "features/tooltips/tooltip";
import { EffectUpgrade, GenericUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { Modifier, createMultiplicativeModifier } from "game/modifiers";
import { noPersist } from "game/persistence";
import { createBooleanRequirement, displayRequirements } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { WithRequired } from "util/common";
import { render, renderRowJSX } from "util/vue";
import { ComputedRef, Ref, computed, unref } from "vue";
import acceleron, {id as acceleronId} from "../acceleron/acceleron";
import entropy from "../acceleron/entropy";
import entangled from "../entangled/entangled";
import Fome from "../fome/Fome.vue";
import FomeBoost from "../fome/FomeBoost.vue";
import inflaton, {id as inflatonId} from "../inflaton/inflaton";
import skyrmion from "../skyrmion/skyrmion";
import timecube from "../timecube/timecube";
import timelines from "../timecube/timelines";
import { Sides } from "../timecube/timesquares";
import infinitesimal from "./infinitesimal";
import protoversal from "./protoversal";
import quantum from "./quantum";
import subplanck from "./subplanck";
import subspatial from "./subspatial";
import abyss from "../skyrmion/abyss";
import Modal from "components/Modal.vue";

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
            <h3>Enlarge {unref(layer[fomeType].amount.displayName)} {dimName} by 1m</h3><br />
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
            <h3>Re-form your {unref(layer[fomeType].amount.displayName)}</h3><br />
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
    const theme = {
        "--feature-background": "#ffffff",
        "--bought": "#929aa9"
    };

    const unlocked: Ref<boolean> = computed(() => unref(entangled.milestones[1].earned) || unref(skyrmion.upgrades.fome.bought));

    const highestFome = computed(() => {
        if (Decimal.gt(unref(quantum.upgrades.reform.amount), 0)) return FomeTypes.quantum;
        else if (Decimal.gt(unref(subplanck.upgrades.reform.amount), 0)) return FomeTypes.subplanck;
        else if (Decimal.gt(unref(subspatial.upgrades.reform.amount), 0)) return FomeTypes.subspatial;
        else if (Decimal.gt(unref(infinitesimal.upgrades.reform.amount), 0)) return FomeTypes.infinitesimal;
        else return FomeTypes.protoversal;
    });

    const generalProductionModifiers: WithRequired<Modifier, "description">[] = [
        createMultiplicativeModifier(() => ({
            multiplier: () => Decimal.add(unref(inflaton.buildings.maxSize), 1).reciprocate(),
            enabled: noPersist(abyss.challenge.active),
            description: jsx(() => (<>[{inflaton.name}] Abyssal Dispersion</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.spinor.upgrades.eta.effect,
            enabled: () => Decimal.gt(unref(skyrmion.spinor.upgrades.eta.totalAmount), 0),
            description: jsx(() => (<>[{skyrmion.name}] {unref(skyrmion.spinor.spinors.singularName)} Upgrade η ({formatWhole(unref(skyrmion.spinor.upgrades.eta.totalAmount))})</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: (acceleron.upgrades.acceleration as EffectUpgrade<DecimalSource>).effect,
            enabled: noPersist(acceleron.upgrades.acceleration.bought),
            description: jsx(() => (<>[{acceleron.name}] Minute Acceleration</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: acceleron.loops.averageLoopValues[acceleron.loops.loops.tempFome.id],
            enabled: noPersist(acceleron.loops.loops.tempFome.built),
            description: jsx(() => (<>[{acceleron.name}] Entropic Loop #4</>))
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

    const timelineBonuses: WithRequired<Modifier, "description">[] = [
        createMultiplicativeModifier(() => ({
            multiplier: timelines.buffs[Sides.RIGHT],
            enabled: noPersist(timecube.upgrades.tactics.bought),
            description: jsx(() => (<>[{timecube.name}] Passive Right Timeline Bonus</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: () => Decimal.reciprocate(unref(timelines.nerfs[Sides.RIGHT])),
            enabled: noPersist(timecube.upgrades.tactics.bought),
            description: jsx(() => (<>[{timecube.name}] Active Right Timeline Effect</>))
        }))
    ];

    const globalBoostBonus: ComputedRef<Decimal> = computed(() => Decimal.add(getUpgradeEffect<DecimalSource>(entropy.enhancements.entitlement, 0), getUpgradeEffect(timecube.upgrades.tier, 0)));

    const achievementStyle = {
        fontSize: '48px',
        fontWeight: 'normal',
        color: 'var(--feature-foreground)'
    } as StyleValue
    const achievements = {
        [FomeTypes.protoversal]: createAchievement(() => ({
            display: jsx(() => <span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>2</sup></span>),
            requirements: createBooleanRequirement(() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 2)),
            tooltip: {
                requirement: <>Re-form your Protoversal Foam</>,
                effect: <>Unlock the Pion and Spinor Buy All hotkey (see Info at top right)<br />Automatically enlarge your Protoversal Foam</>
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
        })),
        abyssalAutobuy: createAchievement(() => ({
            visibility: noPersist(abyss.challenge.active),
            display: jsx(() => <><span style={achievementStyle}>QB<sup style={{fontWeight: 'normal'}}>4</sup></span></>),
            requirements: [
                createBooleanRequirement(() => Decimal.gte(unref(quantum.boosts[5].amount), 4)),
                createBooleanRequirement(noPersist(abyss.challenge.active))
            ],
            tooltip: {
                requirement: <>Gain 4 levels in every Abyssal Quantum Boost</>,
                effect: <>Pion and Spinor upgrade automation is functional once more</>
            }
        }))
    } satisfies Record<string, GenericAchievement & { tooltip: { requirement: JSX.Element, effect: JSX.Element } }>;
    for (const achievement of Object.values(achievements)) {
        addTooltip(achievement, {
            display: jsx(() => (<><h3>{achievement.tooltip.requirement}</h3><br />{achievement.tooltip.effect}</>))
        });
    }

    const hotkeys: Record<string, GenericHotkey> = {
        buyAll: createHotkey(() => ({
            enabled() {
                if (!unref(unlocked)) return false;
                if (Object.values(achievements).every(achievement => unref(achievement.earned))) return false;
                return Decimal.gt(unref(inflaton.inflatons), 0) || unref(acceleron.achievements.protoversal.earned)
            },
            key: "shift+f",
            description: "Buy one of each Foam upgrade",
            onPress() {
                for (const fome of [protoversal, infinitesimal, subspatial, subplanck, quantum]) {
                    fome.upgrades.condense.purchase();
                    for (const upgrade of [...Object.values(FomeDims), 'reform']) {
                        (fome.upgrades[upgrade as keyof FomeUpgrades] as FomeUpgrade).onClick();
                    }
                }
            }
        })),
        switchTab: createHotkey(() => ({
            enabled: unlocked,
            key: "ctrl+f",
            description: "Move to Foam",
            onPress() { root.tabs.selected.value = name; }
        }))
    }

    const showBranchChoice = computed(() => {
        if (unref(entangled.milestones[1].earned)) return false;
        if (unref(entangled.branchOrder) !== '') return false;
        return unref(quantum.upgrades.condense.bought);
    });
    const tabs = createTabFamily({
        main: () => ({
            display: "Foam",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        <Modal
                            modelValue={unref(showBranchChoice)}
                            preventClosing={true}
                            v-slots={{
                                header: () => <div style={{textAlign: 'center'}}><h2>A Choice</h2></div>,
                                body: () => (
                                    <div style={{textAlign: 'center'}}>
                                        As you condense the foam bubbling around you, a pair of particles appear out of the volatile layers, similar in composition yet opposing in purpose.<br/>
                                        The pair dance around each other as you watch, intrinsically tied together yet kept apart by forces beyond your control.<br/><br/>
                                        One of <span style={{color: acceleron.theme["--feature-background"]}}>Time</span>, one of <span style={{color: inflaton.theme["--feature-background"]}}>Space</span><br/><br/>
                                        Reaching for one causes the other to drift away - it seems you will need to make a choice of which to take.<br/>The other, though, does not seem too much further out of reach.
                                    </div>
                                ),
                                footer: () => (
                                    <div style={{textAlign: 'center', display: 'flex', justifyContent: 'center'}}>
                                        <button class="feature clickable can" style={{
                                            backgroundColor: acceleron.theme["--feature-background"],
                                            width: '150px',
                                            height: '60px'
                                        }} onClick={() => entangled.branchOrder.value = acceleronId}>Accelerons</button>
                                        <Spacer width='150px' style={{margin: 0}}/>
                                        <button class="feature clickable can" style={{
                                            backgroundColor: inflaton.theme["--feature-background"],
                                            width: '150px',
                                            height: '60px'
                                        }} onClick={() => entangled.branchOrder.value = inflatonId}>Inflatons</button>
                                    </div>
                                )
                            }}
                        >
                        </Modal>
                        <div>
                            You have <Resource resource={layer[unref(highestFome)].amount} color="var(--feature-background)" /> {unref(layer[unref(highestFome)].amount.displayName)}
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
        theme,
        unlocked,
        production: generalProductionModifiers,
        timelineProduction: timelineBonuses,
        globalBoostBonus,
        achievements,
        hotkeys,
        display: jsx(() => (
            <>
                {Decimal.gt(unref(protoversal.boosts[1].total), 0)
                    ? render(tabs)
                    : render(unref(tabs.tabs.main.tab))
                }
            </>
        )),
        tabs,

        [FomeTypes.protoversal]: protoversal,
        [FomeTypes.infinitesimal]: infinitesimal,
        [FomeTypes.subspatial]: subspatial,
        [FomeTypes.subplanck]: subplanck,
        [FomeTypes.quantum]: quantum
    }
});

export default layer;