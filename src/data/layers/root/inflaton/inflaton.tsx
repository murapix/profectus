import { createClickable } from "features/clickables/clickable";
import { jsx } from "features/feature";
import { BaseLayer, createLayer } from "game/layers";
import fome, { FomeTypes } from "../fome/fome";
import { Resource, createResource } from "features/resources/resource";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { ComputedRef, Ref, computed, unref } from "vue";
import entangled from "../entangled/entangled";
import { createCostRequirement, displayRequirements, requirementsMet } from "game/requirements";
import { persistent } from "game/persistence";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { format, formatWhole } from "util/break_eternity";
import buildings from "./buildings";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { render, renderRow } from "util/vue";
import SpacerVue from "components/layout/Spacer.vue";
import { createTabFamily } from "features/tabs/tabFamily";
import { createTab } from "features/tabs/tab";
import { createUpgrade } from "features/upgrades/upgrade";
import core from "./coreResearch";
import timecube from "../timecube/timecube";
import { getResearchEffect } from "./research";
import skyrmion from "../skyrmion/skyrmion";
import acceleron from "../acceleron/acceleron";
import { formatLength } from "./building";

export const id = "inflaton";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Inflatons";
    const color = "#ff5e13";

    const unlocked: Ref<boolean> = computed(() => {
        if (unref(entangled.milestones[1].earned)) return true;
        if (entangled.isFirstBranch(id)) return true;
        if (unref(acceleron.upgrades.mastery.bought)) return true;
        return unref(fome[FomeTypes.quantum].upgrades.condense.bought);
    });

    const inflatons = createResource<DecimalSource>(0, name);
    const requirement = createCostRequirement(() => ({
        resource: fome[FomeTypes.quantum].amount,
        cost: () => entangled.isFirstBranch(id) ? 1e9 : 1e50,
        requiresPay: false
    }));
    const conversion = createClickable(() => ({
        canClick: () => requirementsMet(requirement),
        display: jsx(() => (
            <>
                1 {inflatons.displayName}<br />
                <br />
                {displayRequirements(requirement)}
            </>
        )),
        onClick() {
            inflatons.value = Decimal.dOne;
            if (entangled.isFirstBranch(id)) entangled.branchOrder.value = id;
        },
        style: {
            width: 'fit-content',
            minHeight: '60px'
        },
        visibility: () => Decimal.eq(unref(inflatons), 0)
    }));

    const inflate = createClickable(() => ({
        display: jsx(() => (<>INFLATE</>)),
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
    };
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
    const individualNerfs = {
        pion: computed(() => Decimal.div(unref(inflatonNerf), 1).clampMin(1)),//getUpgradeEffect(timecube.upgrades.tower))),
        spinor: computed(() => Decimal.div(unref(inflatonNerf), 1).clampMin(1)),//etUpgradeEffect(timecube.upgrades.tower))),
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
        let exponent = Decimal.clampMin(unref(inflatons), 1).log10().plus(1).dividedBy(10);
        let gain = exponent.pow_base(2).times(unref(inflatons));
        return gain.layer >= 3
            ? Decimal.fromComponents(gain.sign, gain.layer, gain.mag * 1.000000000000001)
            : gain
    });
    const fomeModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: core.research.fomeGain.effect,
            enabled: core.research.fomeGain.researched,
            description: jsx(() => <>[{name}] research.fomeGain</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: core.research.moreFomeGain.effect,
            enabled: core.research.moreFomeGain.researched,
            description: jsx(() => <>[{name}] research.moreFomeGain</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: core.research.evenMoreFomeGain.effect,
            enabled: core.research.evenMoreFomeGain.researched,
            description: jsx(() => <>[{name}] research.evenMoreFomeGain</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: core.repeatables.fome.effect,
            enabled: () => Decimal.gt(unref(core.repeatables.fome.amount), 0),
            description: jsx(() => <>[{name}] repeatables.fome ({format(unref(core.repeatables.fome.amount))})</>)
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
                cost: () => entangled.isFirstBranch(id) ? 5e5 : 5e46,
                resource: fome[FomeTypes.quantum].amount
            })),
            visibility() {
                return unref(this.bought) || unref(entangled.milestones[1].earned)
                || Decimal.gte(unref(buildings.maxSize), 6);
            },
            style: { width: '250px' }
        }));
        const research = createUpgrade(() => ({
            display: {
                title: 'Quantum Field Investigations',
                description: `<br />Stabilization isn't enough. Maybe the constant bubbling of the quantum field may hold the secret to sustaining inflation<br />`
            },
            requirements: createCostRequirement(() => ({
                cost: () => entangled.isFirstBranch(id) ? 1e6 : 1e47,
                resource: fome[FomeTypes.quantum].amount
            })),
            visibility() {
                return unref(this.bought) || unref(entangled.milestones[1].earned)
                || (
                    unref(subspaceBuildings.bought)
                    && Decimal.gte(unref(buildings.maxSize), 7)
                );
            },
            style: { width: '250px' }
        }));
        const moreFome = createUpgrade(() => ({
            display: {
                title: 'Dynamic Inflational Formation',
                description: `<br />Generate more Foam based on the size of your universe<br />`
            },
            requirements: createCostRequirement(() => ({
                cost: () => entangled.isFirstBranch(id) ? 1e25 : 1e58,
                resource: fome[FomeTypes.quantum].amount
            })),
            visibility() {
                return unref(this.bought) || unref(entangled.milestones[1].earned)
                || unref(core.research.upgrades.researched);
            }
        }));
        return {
            subspaceBuildings,
            research,
            moreFome
        }
    })();

    
    this.on("preUpdate", () => {
        if (!(unref(inflating) || (unref(core.research.autofillStorage.researched) && Decimal.lt(unref(inflatons), unref(buildings.buildings.storage.effect))))) return;

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
        if (unref(inflating)) {
            inflatons.value = unref(inflatonGain).times(diff).plus(unref(inflatons));
        }
        else if (Decimal.gt(unref(inflatons), unref(buildings.buildings.storage.effect))) {
            inflatons.value = unref(buildings.buildings.storage.effect)
        }
    });

    const header = jsx(() => (<>
        <MainDisplayVue resource={inflatons} color={color} stickyStyle={{background: 'unset'}} />
        <div style={{marginTop: '-20px', fontSize: '12px'}}>
            {unref(inflating)
                ? <>Runaway inflation is dividing all other resources by <span style={{color, textShadow: `${color} 0px 0px 10px`}}>{formatWhole(unref(inflatonNerf))}</span></>
                : <>{unref(core.research.fomeGain.researched)
                    ? <>Inflaton resonance is increasing Foam generation by <span style={{color, textShadow: `${color} 0px 0px 10px`}}>{formatWhole(unref(fomeBonus))}</span></>
                    : undefined
                }</>
            }
        </div>
        {render(inflate)}
        {render(conversion)}
        {Decimal.gt(unref(buildings.maxSize), 0)
            ? <div>You have managed to stabilize the universe at a diameter of {formatLength(unref(buildings.maxSize))}</div>
            : undefined
        }
        <SpacerVue />
    </>));
    const tabs = createTabFamily(({
        buildings: () => ({
            display: "Structures",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        {render(header)}
                        {unref(upgrades.subspaceBuildings.bought) ? render(buildings.display) : undefined}
                        <SpacerVue />
                        {renderRow(...Object.values(upgrades))}
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
        color,
        unlocked,
        inflatons,
        inflating,
        fomeBonus,
        upgrades,
        tabs,
        tabStyle: {
            '--bought': '#b14e24'
        },
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