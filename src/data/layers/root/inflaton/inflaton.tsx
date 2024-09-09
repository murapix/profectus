import Spacer from "components/layout/Spacer.vue";
import { root } from "data/projEntry";
import { createClickable } from "features/clickables/clickable";
import { effectDecorator } from "features/decorators/common";
import { jsx } from "features/feature";
import { createHotkey } from "features/hotkey";
import MainDisplay from "features/resources/MainDisplay.vue";
import { Resource, createResource } from "features/resources/resource";
import { createTab } from "features/tabs/tab";
import { createTabFamily } from "features/tabs/tabFamily";
import { EffectUpgrade, EffectUpgradeOptions, createUpgrade } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { noPersist, persistent } from "game/persistence";
import { createCostRequirement, displayRequirements, requirementsMet } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { formatSmall, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { render, renderRow } from "util/vue";
import { ComputedRef, Ref, computed, unref } from "vue";
import acceleron, { id as acceleronId } from "../acceleron/acceleron";
import entangled from "../entangled/entangled";
import fome, { FomeTypes } from "../fome/fome";
import skyrmion from "../skyrmion/skyrmion";
import timecube from "../timecube/timecube";
import { formatLength } from "./building";
import buildings from "./buildings";
import core from "./coreResearch";
import { formatRoman } from "./repeatableDecorator";
import { getResearchEffect } from "./research";
import abyss from "../skyrmion/abyss";

export const id = "inflaton";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Inflatons";
    const theme = {
        "--feature-background": "#ff5e13",
        "--bought": "#b14e24"
    };

    const unlocked: Ref<boolean> = computed(() => {
        if (unref(entangled.milestones[1].earned)) return true;
        if (entangled.isFirstBranch(id)) return true;
        if (unref(acceleron.upgrades.mastery.bought)) return true;
        return !entangled.isFirstBranch(acceleronId) && unref(fome[FomeTypes.quantum].upgrades.condense.bought);
    });

    const inflatons = createResource<DecimalSource>(0, { displayName: name, singularName: "Inflaton", abyssal: true });
    const requirement = createCostRequirement(() => ({
        resource: noPersist(fome[FomeTypes.quantum].amount),
        cost: () => (unref(entangled.branchOrder) === '' || entangled.isFirstBranch(id)) ? 1e9 : 1e59,
        requiresPay: false
    }));
    const conversion = createClickable(() => ({
        canClick: () => requirementsMet(requirement),
        display: jsx(() => (
            <>
                1 {unref(inflatons.singularName)}<br />
                <br />
                {displayRequirements(requirement)}
            </>
        )),
        onClick() {
            inflatons.value = Decimal.dOne;
            if (unref(entangled.milestones[1].earned)) return;
            if (unref(entangled.branchOrder) === '') entangled.branchOrder.value = id;
            startInflation();
        },
        style: {
            width: 'fit-content',
            minHeight: '60px'
        },
        visibility: () => Decimal.eq(unref(inflatons), 0)
    }));

    const inflate = createClickable(() => ({
        display: jsx(() => unref(inflating) ? <>DISPERSE</> : <>INFLATE</>),
        onClick() {
            if (unref(inflating)) endInflation();
            else startInflation();
        },
        style: {
            width: '150px',
            minHeight: '60px'
        },
        visibility: () => Decimal.gte(unref(inflatons), 1)
    }));
    function startInflation() {
        inflating.value = true;
        inflatons.value = unref(core.research.instantInflation.researched)
            ? Decimal.reciprocate(unref(buildings.buildings.condenser.effect)).dividedBy(10).pow10()
            : Decimal.add(unref(inflatons), 1);
    }
    function endInflation() {
        inflating.value = false;
        inflatons.value = Decimal.min(unref(inflatons), unref(buildings.buildings.storage.effect));
    }
    const inflating = persistent<boolean>(false);

    const inflatonNerf = computed(() => {
        let log = Decimal.clampMin(unref(inflatons), 1).log10();
        if (unref(inflating) || !unref(core.research.isolatedStorage.researched))
            log = log.times(unref(buildings.buildings.condenser.effect));
        return log.pow_base(2).clampMin(1);
    });
    const allFomeNerf = computed(() => unref(inflatonNerf).dividedBy(getResearchEffect(core.research.fomeGain, 1))
                                                          .dividedBy(getResearchEffect(core.research.moreFomeGain, 1))
                                                          .dividedBy(getResearchEffect(core.research.evenMoreFomeGain, 1))
                                                          .dividedBy(getResearchEffect(core.repeatables.fome, 1))
                                                          .clampMin(1)
    );
    const skyrmionNerf = computed(() => {
        if (!unref(timecube.upgrades.tower.bought)) return unref(inflatonNerf);
        return unref(timecube.timelines.inTimeline) ? unref(allFomeNerf) : unref(inflatonNerf);
    });
    const individualNerfs = {
        pion: skyrmionNerf,
        spinor: skyrmionNerf,
        [FomeTypes.protoversal]: allFomeNerf,
        [FomeTypes.infinitesimal]: allFomeNerf,
        [FomeTypes.subspatial]: allFomeNerf,
        [FomeTypes.subplanck]: allFomeNerf,
        [FomeTypes.quantum]: computed(() => Decimal.times(unref(allFomeNerf), getResearchEffect(core.research.halfQuantum, 1))
                                                   .times(getResearchEffect(core.research.quarterQuantum, 1))
                                                   .clampMin(1)),
        acceleron: inflatonNerf,
        timecube: inflatonNerf
    };
    const inflatonGain = computed(() => {
        const exponent = Decimal.clampMin(unref(inflatons), 1).log10().plus(1).dividedBy(10);
        const gain = exponent.pow_base(2).times(unref(inflatons));
        return gain.layer >= 3
            ? Decimal.fromComponents(gain.sign, gain.layer, gain.mag * 1.000000000000001)
            : gain
    });
    const fomeModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: core.research.fomeGain.effect,
            enabled: core.research.fomeGain.researched,
            description: jsx(() => <>[{name}] Counter-Inflational Cycles</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: core.research.moreFomeGain.effect,
            enabled: core.research.moreFomeGain.researched,
            description: jsx(() => <>[{name}] Scatter-Field Repulsion</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: core.research.evenMoreFomeGain.effect,
            enabled: core.research.evenMoreFomeGain.researched,
            description: jsx(() => <>[{name}] Scalar Flux Reduction</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: core.repeatables.fome.effect,
            enabled: () => Decimal.gt(unref(core.repeatables.fome.amount), 0),
            description: jsx(() => <>[{name}] Repeatable: Inflational Dynamics {formatRoman(unref(core.repeatables.fome.amount))}</>)
        }))
    ]);
    const fomeBonus = computed(() => {
        return unref(inflating)
            ? Decimal.dOne
            : Decimal.clampMax(
                fomeModifiers.apply(Decimal.dOne),
                unref(inflatonNerf)
            )
    });

    const upgrades = (() => {
        const subspaceBuildings = createUpgrade(() => ({
            display: {
                title: 'Subspatial Field Stabilizers',
                description: '<br />Allow the creation of Subspatial Structures<br />'
            },
            requirements: createCostRequirement(() => ({
                cost: () => entangled.isFirstBranch(id) ? 5e5 : 1e59,
                resource: fome[FomeTypes.quantum].amount
            })),
            visibility() {
                if (unref(this.bought)) return true;
                if (unref(entangled.milestones[1].earned)) return true;
                if (unref(entangled.branchOrder) === '' || entangled.isFirstBranch(id)) {
                    return Decimal.gte(unref(buildings.maxSize), 6);
                }
                else {
                    return Decimal.gte(unref(buildings.maxSize), 8.8);
                }
            },
            style: { width: '250px' }
        }));
        const research = createUpgrade(() => ({
            display: {
                title: 'Quantum Field Investigations',
                description: `<br />Stabilization isn't enough. Maybe the constant bubbling of the quantum field may hold the secret to sustaining inflation<br />`
            },
            requirements: createCostRequirement(() => ({
                cost: () => entangled.isFirstBranch(id) ? 1e6 : 2e59,
                resource: fome[FomeTypes.quantum].amount
            })),
            visibility() {
                if (unref(this.bought)) return true;
                if (unref(entangled.milestones[1].earned)) return true;
                if (!unref(subspaceBuildings.bought)) return false;
                if ((unref(entangled.branchOrder) === '' || entangled.isFirstBranch(id)) && !unref(abyss.challenge.active)) {
                    return Decimal.gte(unref(buildings.maxSize), 6.3);
                }
                else {
                    return Decimal.gte(unref(buildings.maxSize), 9.5);
                }
            },
            style: { width: '250px' }
        }));
        const moreFome = createUpgrade<EffectUpgradeOptions<DecimalSource>>(() => ({
            display: {
                title: 'Dynamic Inflational Formation',
                description: `<br />Generate more Foam based on the size of your universe<br />`
            },
            requirements: createCostRequirement(() => ({
                cost: () => entangled.isFirstBranch(id) ? 1e18 : 1e61,
                resource: fome[FomeTypes.quantum].amount
            })),
            visibility() {
                return unref(this.bought) || unref(core.research.upgrades.researched);
            },
            effect: buildings.maxSize,
            style: { width: '250px' }
        }), effectDecorator) as EffectUpgrade<DecimalSource>;
        const skyrmionUpgrades = createUpgrade(() => ({
            display: {
                title: 'Micro-Inflational Subsystems',
                description: `<br />Gain a new Pion and Spinor Upgrade<br />`
            },
            requirements: createCostRequirement(() => ({
                cost: () => entangled.isFirstBranch(id) ? 1e20 : 1e63,
                resource: fome[FomeTypes.quantum].amount
            })),
            visibility() {
                return unref(this.bought) || unref(core.research.upgrades.researched);
            },
            style: { width: '250px' }
        }));
        return {
            subspaceBuildings,
            research,
            moreFome,
            skyrmionUpgrades
        }
    })();

    
    this.on("preUpdate", () => {
        if (!unref(inflating)) return;

        for (const [resource, nerf] of [
            [skyrmion.pion.pions, individualNerfs.pion],
            [skyrmion.spinor.spinors, individualNerfs.spinor],
            [fome[FomeTypes.protoversal].amount, individualNerfs[FomeTypes.protoversal]],
            [fome[FomeTypes.infinitesimal].amount, individualNerfs[FomeTypes.infinitesimal]],
            [fome[FomeTypes.subspatial].amount, individualNerfs[FomeTypes.subspatial]],
            [fome[FomeTypes.subplanck].amount, individualNerfs[FomeTypes.subplanck]],
            [fome[FomeTypes.quantum].amount, individualNerfs[FomeTypes.quantum]],
            [acceleron.accelerons, individualNerfs.acceleron],
            [timecube.timecubes, individualNerfs.timecube]
        ] as [Resource<DecimalSource>, ComputedRef<DecimalSource>][]) {
            resource.value = Decimal.divide(resource.value, nerf.value);
        }
        if ([
            skyrmion.pion.pions,
            skyrmion.spinor.spinors,
            ...Object.values(FomeTypes).map(type => fome[type].amount)
        ].some(resource => Decimal.lt(unref(resource), 1))) {
            endInflation();
        }
    });
    this.on("postUpdate", diff => {
        let shouldInflate = false;
        if (unref(inflating)) shouldInflate = true;
        if (unref(core.research.autofillStorage.researched) && Decimal.lt(unref(inflatons), unref(buildings.buildings.storage.effect))) shouldInflate = true;

        if (shouldInflate) {
            inflatons.value = unref(inflatonGain).times(diff).plus(unref(inflatons));
        }
        else if (Decimal.gt(unref(inflatons), unref(buildings.buildings.storage.effect))) {
            inflatons.value = unref(buildings.buildings.storage.effect)
        }
    });

    const hotkeys = {
        switchTab: createHotkey(() => ({
            enabled: unlocked,
            key: "ctrl+i",
            description: "Move to Inflatons",
            onPress() { root.tabs.selected.value = name; }
        }))
    }

    const fomeModifierModal = createModifierModal("Inflaton Resonance", () => [
        {
            title: "Maximum Potential Foam Gain",
            modifier: fomeModifiers
        }
    ], "12px");

    const header = jsx(() => (<>
        <MainDisplay resource={inflatons} stickyStyle={{background: 'unset'}} />
        <div style={{marginTop: '-20px', fontSize: '12px'}}>
            {unref(inflating)
                ? <>Runaway inflation is dividing all other resources by <span style={{color: 'var(--feature-background)', textShadow: 'var(--feature-background) 0px 0px 10px'}}>{formatWhole(unref(inflatonNerf))}</span></>
                : <>{unref(core.research.fomeGain.researched)
                    ? <>Inflaton resonance is increasing Foam generation by <span style={{color: 'var(--feature-background)', textShadow: 'var(--feature-background) 0px 0px 10px'}}>{formatWhole(unref(fomeBonus))}</span></>
                    : undefined
                }</>
            }
            {unref(core.research.fomeGain.researched) ? render(fomeModifierModal) : undefined}
        </div>
        {render(inflate)}
        {render(conversion)}
        {Decimal.gt(unref(inflatons), 0) && Decimal.gt(unref(buildings.maxSize), 0)
            ? <div>
                You have managed to stabilize the universe at a diameter of {formatLength(unref(buildings.maxSize))}
                {unref(inflating) && Decimal.lt(unref(buildings.currentSize), unref(buildings.maxSize)) ? <> ({formatLength(unref(buildings.currentSize))})</> : undefined}
                {unref(abyss.challenge.active)
                    ? <><br/>The thin boundaries of this reality are causing Foam gain to be reduced to {formatSmall(Decimal.add(unref(buildings.maxSize), 1).reciprocate().times(100))}%</>
                    : undefined
                }
            </div>
            : undefined
        }
        <Spacer />
    </>));
    const tabs = createTabFamily(({
        buildings: () => ({
            display: "Structures",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        {render(header)}
                        {Decimal.gt(unref(inflatons), 0)
                            ? <>
                                {unref(upgrades.subspaceBuildings.bought) ? render(buildings.display) : undefined}
                                <Spacer />
                                {renderRow(upgrades.moreFome, upgrades.subspaceBuildings, upgrades.research, upgrades.skyrmionUpgrades)}
                            </>
                            : undefined
                        }
                    </>
                ))
            }))
        }),
        research: () => ({
            display: "Research",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        {render(header)}
                        {render(core.display)}
                    </>
                ))
            }))
        })
    }))

    return {
        id,
        name,
        theme,
        unlocked,
        inflatons,
        inflating,
        fomeBonus,
        upgrades,
        hotkeys,
        tabs,
        display: jsx(() => (
            <>
                {unref(upgrades.research.bought)
                    ? render(tabs)
                    : render(unref(tabs.tabs.buildings.tab))
                }
            </>
        )),

        buildings,
        coreResearch: core
    }
})

export default layer;