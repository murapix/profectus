import { StyleValue, jsx } from "features/feature";
import { createLayer, BaseLayer } from "game/layers";
import skyrmion from "../skyrmion/skyrmion";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { ComputedRef, Ref, computed, unref } from "vue";
import { Modifier, createMultiplicativeModifier } from "game/modifiers";
import acceleron from "../acceleron-old/acceleron";
import entropy from "../acceleron-old/entropy";
import { EffectUpgrade, GenericUpgrade, getUpgradeEffect } from "features/upgrades/upgrade";
import { formatWhole } from "util/break_eternity";
import { GenericRepeatable } from "features/repeatable";
import { GenericEffectFeature } from "features/decorators/common";
import timecube from "../timecube-old/timecube";
import protoversal from "./protoversal";
import { GenericAchievement, createAchievement } from "features/achievements/achievement";
import { ProcessedComputable } from "util/computed";
import ResourceVue from "features/resources/Resource.vue";
import SpacerVue from "components/layout/Spacer.vue";
import FomeVue from "../fome/Fome.vue";
import { render, renderRowJSX } from "util/vue";
import { createTab } from "features/tabs/tab";
import FomeBoostVue from "../fome/FomeBoost.vue";
import { createTabFamily } from "features/tabs/tabFamily";
import { createBooleanRequirement } from "game/requirements";
import { addTooltip } from "features/tooltips/tooltip";
import infinitesimal from "./infinitesimal";
import inflaton from "../inflaton-old/inflaton";
import subspatial from "./subspatial";
import subplanck from "./subplanck";
import quantum from "./quantum";

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

export type FomeUpgrade = GenericRepeatable & GenericEffectFeature & { effect: ProcessedComputable<DecimalSource> };
export type FomeUpgrades = Record<FomeDims, FomeUpgrade>
                         & { condense: GenericUpgrade }
                         & { reform: FomeUpgrade };

export function onDimRepeatable(type: FomeTypes) {
    const index = layer[type].boosts.index;
    const boost = layer[type].boosts[unref(index)].amount;
    boost.value = Decimal.add(unref(boost), 1);
    index.value = (unref(index) === 5 ? 1 : unref(index) + 1) as 1|2|3|4|5;
}

const id = "fome";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Quantum Foam";
    const color = "#ffffff";

    const unlocked: Ref<boolean> = computed(() => unref(skyrmion.upgrades.fome.bought));

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
            multiplier: (acceleron.upgrades.acceleration as EffectUpgrade).effect as Ref<DecimalSource>,
            enabled: acceleron.upgrades.acceleration.bought,
            description: jsx(() => (<>[{acceleron.name}] Acceleration</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.invention.effect as Ref<DecimalSource>,
            enabled: entropy.enhancements.invention.bought,
            description: jsx(() => (<>[{acceleron.name}] Entropic Invention</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: acceleron.loops.tempFoam.currentBoost!,
            enabled: acceleron.loops.tempFoam.built,
            description: jsx(() => (<>[{acceleron.name}] Acceleron Loop #4</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.formation.effect as Ref<DecimalSource>,
            enabled: entropy.enhancements.formation.bought,
            description: jsx(() => (<>[{acceleron.name}] Entropic Formation</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: inflaton.fomeBonus,
            enabled: () => Decimal.gt(unref(inflaton.inflatons), 0),
            description: jsx(() => (<>[{inflaton.name}]</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => (<>[{inflaton.name}] Inflaton Upgrade 21</>))
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
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => (<>[{timecube.name}] Passive Left Timeline Bonus</>))
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
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
            requirements: createBooleanRequirement(false),//() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 2)),
            tooltip: {
                requirement: <>Re-form your Protoversal Foam</>,
                effect: <>Unlock the Pion and Spinor Buy All button<br />Automatically enlarge your Protoversal Foam</>
            }
        })),
        [FomeTypes.infinitesimal]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>3</sup></span></>),
            requirements: createBooleanRequirement(false),//() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 3)),
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>3</sup></>,
                effect: <>Automatically enlarge your Infinitesimal Foam</>
            }
        })),
        [FomeTypes.subspatial]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>4</sup></span></>),
            requirements: createBooleanRequirement(false),//() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 4)),
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>4</sup></>,
                effect: <>Automatically enlarge your Subspatial Foam</>
            }
        })),
        [FomeTypes.subplanck]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>5</sup></span></>),
            requirements: createBooleanRequirement(false),//() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 5)),
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>5</sup></>,
                effect: <>Automatically enlarge your Subplanck Foam</>
            }
        })),
        [FomeTypes.quantum]: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>P<sup style={{fontWeight: 'normal'}}>6</sup></span></>),
            requirements: createBooleanRequirement(false),//() => Decimal.gte(unref(protoversal.upgrades.reform.amount), 6)),
            tooltip: {
                requirement: <>Obtain Protoversal Foam<sup>6</sup></>,
                effect: <>Automatically enlarge your Quantum Foam</>
            }
        })),
        reform: createAchievement(() => ({
            display: jsx(() => <><span style={achievementStyle}>Q<sup style={{fontWeight: 'normal'}}>2</sup></span></>),
            requirements: createBooleanRequirement(false),//() => Decimal.gte(unref(quantum.upgrades.reform.amount), 2)),
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
                            You have <ResourceVue resource={layer[unref(highestFome)].amount} color={color} /> {layer[unref(highestFome)].amount.displayName}
                            {Decimal.gt(unref(layer[unref(highestFome)].upgrades.reform.amount), 1)
                                ? <sup>{formatWhole(unref(layer[unref(highestFome)].upgrades.reform.amount))}</sup>
                                : undefined
                            }
                        </div>
                        <SpacerVue />
                        <FomeVue />
                        <SpacerVue height="8px" />
                        {renderRowJSX(...Object.values(achievements))}
                    </>
                ))
            }))
        }),
        boosts: () => ({
            display: "Boosts",
            tab: createTab(() => ({ display: jsx(() => (<FomeBoostVue />)) }))
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
        style: { "--bought": "#929aa9" },
        tabs,

        [FomeTypes.protoversal]: protoversal,
        [FomeTypes.infinitesimal]: infinitesimal,
        [FomeTypes.subspatial]: subspatial,
        [FomeTypes.subplanck]: subplanck,
        [FomeTypes.quantum]: quantum
    }
});

export default layer;