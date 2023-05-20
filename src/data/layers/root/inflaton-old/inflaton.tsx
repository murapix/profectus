import ColumnVue from "components/layout/Column.vue";
import SpacerVue from "components/layout/Spacer.vue";
import { jsx } from "features/feature";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createTab } from "features/tabs/tab";
import { createTabFamily } from "features/tabs/tabFamily";
import { createUpgrade, GenericUpgrade } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { noPersist, persistent } from "game/persistence";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { render, renderRow } from "util/vue";
import { computed, ComputedRef, unref } from "vue";
import acceleron from "../acceleron-old/acceleron";
import entangled from "../entangled-old/entangled";
import fome, { FomeTypes } from "../fome/fome";
import { createResearch, GenericRepeatableResearch, GenericResearch, getResearchEffect, repeatableResearchDecorator, RepeatableResearchOptions } from "./research";
import ResearchQueueVue from "./ResearchQueue.vue";
import ResearchTreeVue from "./ResearchTree.vue";

export const id = "inflaton";
const layer = createLayer(id, function (this: BaseLayer) {
    
    const research: Record<string, GenericResearch> = {
        quintupleCondenser: createResearch(() => ({
            position: [0,0],
            display: {
                title: 'Branon Induction Phases',
                description: 'Quintuple the effect of M-field Condensers'
            },
            effect: 5,
            cost: new Decimal(75),
            visibility() { return unref(upgrades.research.bought) },
            research: startResearch('research'),
            isResearching
        })),
        doubleSize: createResearch(() => ({
            position: [1,0],
            display: {
                title: 'Banach-Tarski Point Manipulation',
                description: 'You can stabilize the universe at double the size'
            },
            effect: 2,
            cost: new Decimal(100),
            requirements: [research.quintupleCondenser],
            research: startResearch('research'),
            isResearching
        })),
        cheaperLabs: createResearch(() => ({
            position: [1,1],
            display: {
                title: 'Subspatial Binding Constants',
                description: 'Reduce the cost scaling of Quantum Flux Analyzers'
            },
            cost: 100,
            requirements: [research.quintupleCondenser],
            research: startResearch('research'),
            isResearching
        })),
        fomeGain: createResearch(() => ({
            position: [2,0],
            display: {
                title: 'Counter-Inflational Cycles',
                description: 'Gain up to 1e6x more Foam, based on your current Stored Inflatons'
            },
            effect: 1e6,
            cost: 500,
            requirements: [research.doubleSize],
            research: startResearch('research'),
            isResearching
        })),
        researchBoost: createResearch(() => ({
            position: [2,1],
            display: {
                title: 'Distributed Analysis Framework',
                description: jsx(() => <span>Transform 10% of your Quantum Flux Analyzers into networking nodes, increasing Research Point gain by up to {format(unref((research.researchBoost as GenericResearch & {limit: ComputedRef<Decimal>}).limit))}x</span>),
                effectDisplay: jsx(() => <>{format(unref((research.researchBoost as GenericResearch).effect))}x</>)
            },
            effect() { return Decimal.pow(1.1, unref(buildings.lab.amount)).min(unref((research.researchBoost as GenericResearch & {limit: ComputedRef<Decimal>}).limit)) },
            limit: computed(() => Decimal.times(unref(repeatables.research.effect), 1.8)),
            cost: 1500,
            requirements: [research.doubleSize, research.cheaperLabs],
            research: startResearch('research'),
            isResearching
        })),
        storage: createResearch(() => ({
            position: [2,2],
            display: {
                title: 'Inflaton Containment Strategies',
                description: 'Allow construction of Inflaton Containment Units'
            },
            cost: 500,
            requirements: [research.cheaperLabs],
            research: startResearch('research'),
            isResearching
        })),
        halfQuantum: createResearch(() => ({
            position: [3,0],
            display: {
                title: 'Quantum Phasor Coherence',
                description: 'Half the effect of inflation on Quantum Foam'
            },
            cost: 750,
            effect: 0.5,
            requirements: [research.fomeGain],
            research: startResearch('research'),
            isResearching
        })),
        quadrupleSize: createResearch(() => ({
            position: [3,1],
            display: {
                title: 'Von Neumann Transformation',
                description: 'Double the size of the universe, again'
            },
            cost: 750,
            effect: 2,
            requirements: [research.fomeGain],
            research: startResearch('research'),
            isResearching
        })),
        upgrades: createResearch(() => ({
            position: [3,2],
            display: {
                title: 'Quantum Inflationo-dynamics',
                description: 'Unlock two more Inflaton upgrades'
            },
            cost: 750,
            requirements: [research.storage],
            research: startResearch('research'),
            isResearching
        })),
        respecs: createResearch(() => ({
            position: [3,3],
            display: {
                title: 'Superstructural Stability Patterns',
                description: 'Enable individual building respecs'
            },
            cost: 750,
            requirements: [research.storage],
            research: startResearch('research'),
            isResearching
        })),
        moreFomeGain: createResearch(() => ({
            position: [4,0],
            display: {
                title: 'Scatter-field Repulsion',
                description: 'Retain up to 1e12x more Foam, based on your current Inflatons'
            },
            cost: 1500,
            effect: 1e12,
            requirements: [research.halfQuantum, research.upgrades],
            research: startResearch('research'),
            isResearching
        })),
        queueTwo: createResearch(() => ({
            position: [4,1],
            display: {
                title: 'Scheduled Itemization',
                description: 'You can queue up to 2 additional researches'
            },
            cost: 10000,
            effect: 2,
            requirements: [research.researchBoost],
            research: startResearch('research'),
            isResearching
        })),
        improvedStorage: createResearch(() => ({
            position: [4,2],
            display: {
                title: 'Enhanced Isolation Protocols',
                description: `Improve the Inflaton Containment Unit's storage capabilities`
            },
            cost: 1500,
            effect: 1,
            requirements: [research.respecs],
            research: startResearch('research'),
            isResearching
        })),
        quarterQuantum: createResearch(() => ({
            position: [5,0],
            display: {
                title: 'Aggressive Flow Diffusion',
                description: 'Halve the effect of inflation on Quantum Foam, again'
            },
            cost: 6000,
            effect: 0.5,
            requirements: [research.halfQuantum, research.moreFomeGain],
            research: startResearch('research'),
            isResearching
        })),
        repeatableUnlock: createResearch(() => ({
            position: [5,1],
            display: {
                title: 'Infinite Expansion Theories',
                description: 'Unlock two repeatable researches'
            },
            cost: 6000,
            requirements: [research.quadrupleSize],
            research: startResearch('research'),
            isResearching
        })),
        inflationResearch: createResearch(() => ({
            position: [5,2],
            display: {
                title: 'Active Restoration Protocols',
                description: 'Allow the construction of Active Redistribution Centers'
            },
            cost: 15000,
            requirements: [research.queueTwo, research.improvedStorage],
            research: startResearch('research'),
            isResearching
        })),
        autofillStorage: createResearch(() => ({
            position: [5,3],
            display: {
                title: 'Inflationary Tolerances',
                description: 'Allow stored Inflatons to inflate to fill your storage'
            },
            cost: 6000,
            requirements: [research.respecs, research.improvedStorage],
            research: startResearch('research'),
            isResearching
        })),
        evenMoreFoamGain: createResearch(() => ({
            position: [6,0],
            display: {
                title: 'Scalar Flux Reduction',
                description: 'Retain up to 1e12x more Foam yet again, based on your current Inflatons'
            },
            cost: 9000,
            effect: 1e12,
            requirements: [research.quarterQuantum, research.repeatableUnlock],
            research: startResearch('research'),
            isResearching
        })),
        biggerBuildings: createResearch(() => ({
            position: [6,1],
            display: {
                title: 'Macroscale Synergies',
                description: 'Increase subspace building size tenfold, and their potency by twice as much'
            },
            cost: 25000,
            effect: { size: 10, effect: 2 },
            requirements: [research.quarterQuantum, research.repeatableUnlock, research.inflationResearch],
            onResearch: respecAll.onClick,
            research: startResearch('research'),
            isResearching
        })),
        isolatedStorage: createResearch(() => ({
            position: [6,2],
            display: {
                title: 'Secondary Isolation Standards',
                description: 'M-field Condensers no longer reduce the effect of stored Inflatons'
            },
            cost: 25000,
            requirements: [research.inflationResearch],
            research: startResearch('research'),
            isResearching
        })),
        instantInflation: createResearch(() => ({
            position: [6,3],
            display: {
                title: 'Instantaneous Limit Testing',
                description: `Beginning Inflation instantly expands to the limit of your M-field Condensers' safe operation`
            },
            cost: 25000,
            requirements: [research.inflationResearch, research.autofillStorage],
            research: startResearch('research'),
            isResearching
        })),
        moreRepeatables: createResearch(() => ({
            position: [7,0],
            display: {
                title: 'Sustainable Expansion Hypotheses',
                description: 'Unlock three more repeatable research projects'
            },
            cost: 100000,
            requirements: [research.evenMoreFoamGain, research.biggerBuildings],
            research: startResearch('research'),
            isResearching
        })),
        queueFour: createResearch(() => ({
            position: [7,1],
            display: {
                title: 'Static Proposal Induction',
                description: 'Increase the research queue size by another 2'
            },
            cost: 100000,
            effect: 2,
            requirements: [research.queueTwo, research.repeatableUnlock],
            research: startResearch('research'),
            isResearching
        })),
        autobuild: createResearch(() => ({
            position: [7,2],
            display: {
                title: 'Mechanized Superscale Subsystems',
                description: 'Automatically build subspace buildings, and building them no longer consumes Foam'
            },
            cost: 100000,
            requirements: [research.isolatedStorage, research.instantInflation],
            research: startResearch('research'),
            isResearching
        })),
        mastery: createResearch(() => ({
            position: [8,0],
            display: {
                title: 'Spatial Mastery',
                description: jsx(() => <span>Unlock {entangled.isFirstBranch(id) ? acceleron.accelerons.displayName : entangled.strings.displayName}</span>)
            },
            cost: 750000,
            requirements: [research.moreRepeatables, research.queueFour, research.autobuild],
            research: startResearch('research'),
            isResearching
        }))
    };

    const repeatables: Record<string, GenericRepeatableResearch> = {
        universeSize: createResearch<RepeatableResearchOptions>(() => ({
            visibility() { return unref(research.repeatableUnlock.researched) },
            display: {
                title: 'Eternal Inflation',
                description: 'Double the size of your universe',
                effectDisplay: jsx(() => <>{formatWhole(unref(repeatables.universeSize.effect))}x</>)
            },
            cost(this: GenericRepeatableResearch) { return Decimal.pow(4, unref(this.amount)).times(12000).dividedBy(1) /* 1st abyssal spinor buyable */ },
            effect(this: GenericRepeatableResearch) { return Decimal.pow(2, unref(this.amount)) },
            research: startResearch('repeatables'),
            isResearching
        }), repeatableResearchDecorator) as GenericRepeatableResearch,
        research: createResearch<RepeatableResearchOptions>(() => ({
            visibility() { return unref(research.repeatableUnlock.researched) },
            display: {
                title: 'Perpetual Testing',
                description: `Increase Distributed Analysis Framework's maximum bonus by 80%`,
                effectDisplay: jsx(() => <>{formatWhole(unref(repeatables.research.effect))}x</>)
            },
            cost(this: GenericRepeatableResearch) { return Decimal.pow(8, unref(this.amount)).times(15000).dividedBy(1) /* 1st abyssal spinor buyable */ },
            effect(this: GenericRepeatableResearch) { return Decimal.pow(1.8, unref(this.amount)) },
            research: startResearch('repeatables'),
            isResearching
        }), repeatableResearchDecorator) as GenericRepeatableResearch,
        buildingSize: createResearch<RepeatableResearchOptions>(() => ({
            visibility() { return unref(research.moreRepeatables.researched) },
            display: {
                title: 'Subspatial Construction',
                description: 'Increase Subspace building size tenfold, and increase their effects by twice as much',
                effectDisplay: jsx(() => <>{formatWhole(unref(repeatables.buildingSize.effect).size)}x, {formatWhole(Decimal.times(unref(repeatables.buildingSize.effect).size, unref(repeatables.buildingSize.effect).gain))}</>)
            },
            cost(this: GenericRepeatableResearch) { return Decimal.pow(200, unref(this.amount)).times(150000).dividedBy(1).div(1) /* 1st abyssal spinor buyable, left time square */ },
            effect(this: GenericRepeatableResearch) { return { size: Decimal.pow(10, unref(this.amount)), effect: Decimal.pow(2, unref(this.amount)) }},
            canResearch: () => Object.values(buildings).map(building => unref(building.amount)).every(amount => Decimal.gte(amount, unref(buildingSize).times(10))),
            onResearch: respecAll.onClick,
            research: startResearch('repeatables'),
            isResearching
        }), repeatableResearchDecorator) as GenericRepeatableResearch,
        buildingCost: createResearch<RepeatableResearchOptions>(() => ({
            visibility() { return unref(research.moreRepeatables.researched) },
            display: {
                title: 'Efficient Design',
                description: 'Decrease Subspace building cost scaling by 1.5x',
                effectDisplay: jsx(() => <>1/{format(unref(repeatables.buildingCost.effect))}x</>)
            },
            cost(this: GenericRepeatableResearch) { return Decimal.pow(3, unref(this.amount)).times(120000).dividedBy(1) /* 1st abyssal spinor buyable */ },
            effect(this: GenericRepeatableResearch) { return Decimal.pow(1.5, unref(this.amount)) },
            research: startResearch('repeatables'),
            isResearching
        }), repeatableResearchDecorator) as GenericRepeatableResearch,
        fome: createResearch<RepeatableResearchOptions>(() => ({
            visibility() { return unref(research.moreRepeatables.researched) },
            display: {
                title: 'Inflational Dynamics',
                description: 'Retain up to 1e6x more Foam',
                effectDisplay: jsx(() => <>{formatWhole(unref(repeatables.fome.effect))}x</>)
            },
            cost(this: GenericRepeatableResearch) { return Decimal.pow(5, unref(this.amount)).times(160000).dividedBy(1) /* 1st abyssal spinor buyable */ },
            effect(this: GenericRepeatableResearch) { return Decimal.pow(1e6, unref(this.amount)) },
            research: startResearch('repeatables'),
            isResearching
        }), repeatableResearchDecorator) as GenericRepeatableResearch
    };

    const researchLocations = {
        research,
        repeatables
    };

    const baseResearchGain = computed<Decimal>(() => {
        return Decimal.times(unref(buildings.lab.effect as DecimalSource), getResearchEffect(research.researchBoost)).times(1) /* 1st abyssal pion buyable */
    });
    const finalResearchGain = computed<Decimal>(() => {
        return unref(baseResearchGain);
    });
    const queueLength = computed<number>(() => {
        return 1 + getResearchEffect(research.queueTwo, 0) + getResearchEffect(research.queueFour, 0);
    });
    const parallelSize = computed<number>(() => {
        return 1;
    });
    const researchQueue = persistent<[keyof typeof researchLocations, string][]>([]);
    function startResearch(location: keyof typeof researchLocations) {
        const research = researchLocations[location];
        return function(this: GenericResearch, force: boolean = false) {
            if (force || unref(researchQueue).length < unref(queueLength)) {
                const key = Object.keys(research).find(key => research[key].id === this.id);
                if (key) unref(researchQueue).push([location, key]);
            }
        }
    }
    function isResearching(this: GenericResearch) {
        return unref(researchQueue).some(([key, id]) => researchLocations[key][id].id === this.id);
    }
    this.on("preUpdate", (diff) => {
        if (unref(researchQueue).length === 0) return;
        const gain = Decimal.times(unref(finalResearchGain), diff);
        for (const research of unref(researchQueue).slice(0, unref(parallelSize)).map(([key, id]) => researchLocations[key][id])) {
            research.progress.value = gain.plus(unref(research.progress));
        }
    });
    this.on("update", () => { // if below parallel count, add repeatables
        if (unref(researchQueue).length < unref(parallelSize)) { // and auto-researching
            Object.values(repeatables)
                  .filter(research => Decimal.gte(unref(research.amount), 1))
                  .filter(research => !unref(research.isResearching))
                  .filter(research => unref(research.canResearch))
                  .sort((a, b) => Decimal.compare(unref(a.cost), unref(b.cost)))
                  .slice(0, unref(parallelSize) - unref(researchQueue).length)
                  .forEach((research) => research.research(true));
        }
    });
    this.on("postUpdate", () => { // remove completed researches from queue
        researchQueue.value = unref(researchQueue).filter(([key, id]) => {
            const research = researchLocations[key][id];
            if (Decimal.gte(unref(research.progressPercentage), 1)) {
                research.onResearch?.();
                return false;
            }
            return true;
        });
    });
    function removeFromQueue(location: string, name: string) {
        researchQueue.value = unref(researchQueue).filter(([key, id]) => !(key === location && id === name));
    }

    const header = jsx(() => (<>
        <MainDisplayVue resource={inflatons} color={color} />
        <div style={{marginTop: '-20px', fontSize: '12px'}}>
            {unref(inflating)
                ? <>Runaway inflation is dividing all other resources by <span style={{color, textShadow: `${color} 0px 0px 10px`}}>{formatWhole(unref(inflatonNerf))}x</span> per second</>
                : <>{unref(research.fomeGain.researched)
                    ? <>Inflaton resonance is increasing Foam generation by <span style={{color, textShadow: `${color} 0px 0px 10px`}}>{formatWhole(unref(fomeBonus))}x</span></>
                    : undefined
                }</>
            }
        </div>
        {Decimal.gte(unref(inflatons), 1)
        ? render(inflate)
        : render(conversion)}
        <SpacerVue />
    </>));
    const tabs = createTabFamily(({
        buildings: () => ({
            display: "Structures",
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        {render(header)}
                        {/* {renderRow(...Object.values(buildingRenders))}
                        <SpacerVue />
                        {render(respecAll)} */}
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
                        <div class='row' style={{flexFlow: 'row-reverse nowrap', alignItems: 'flex-start', justifyContent: 'space-evenly'}}>
                            <ResearchQueueVue locations={researchLocations} parallel={parallelSize} queue={computed(() => Array.from({...unref(researchQueue), length: Math.max(unref(researchQueue).length, unref(queueLength))}))} />
                            <ResearchTreeVue research={research} />
                            <ColumnVue>
                                {...Object.values(repeatables).map(render).map(element => <div style={{margin: 'var(--feature-margin) 0px'}}>{element}</div>)}
                            </ColumnVue>
                        </div>
                    </>
                ))
            }))
        })
    }))

    return {
        name,
        color,
        inflatons,
        usedSize,
        maxSize,
        upgrades,
        buildings,
        respecButtons,
        research,
        repeatables,
        researchQueue,
        style: {
            '--bought': '#b14e24'
        },
        tabs,
        display: jsx(() => (
            <>
                {unref(upgrades.research.bought)
                    ? render(tabs)
                    : render(unref(tabs.tabs.buildings.tab))}
            </>
        )),
        inflating,
        nerf: inflatonNerf,
        fomeBonus,

        removeFromQueue,

        queueLength,
        parallelSize
    }
})

export default layer;