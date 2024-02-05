import { CoercableComponent, OptionsFunc, Visibility, jsx } from "features/feature";
import { createLayer, BaseLayer } from "game/layers";
import { BaseResearch, EffectResearch, GenericResearch, createResearch as actualCreateResearch, getResearchEffect } from "./research";
import { BaseRepeatableResearch, GenericRepeatableResearch, RepeatableResearchOptions, repeatableDecorator } from "./repeatableDecorator"
import { CostRequirement, createCostRequirement } from "game/requirements";
import { createResource } from "features/resources/resource";
import { Computable, ProcessedComputable } from "util/computed";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import { buildingSize as currentBuildingSize } from "./building";
import buildings from "./buildings";
import { ComputedRef, computed, unref } from "vue";
import { format, formatWhole } from "util/break_eternity";
import acceleron from "../acceleron/acceleron";
import entangled from "../entangled/entangled";
import inflaton, { id as inflatonId } from "./inflaton";
import ResearchTreeVue from "./ResearchTree.vue";
import { noPersist, persistent } from "game/persistence";
import ToggleVue from "components/fields/Toggle.vue";
import SpacerVue from "components/layout/Spacer.vue";
import ResearchQueueVue from "./ResearchQueue.vue";
import { render } from "util/vue";
import ColumnVue from "components/layout/Column.vue";
import timecube from "../timecube/timecube";
import { Sides } from "../timecube/timesquares";

const id = "coreResearch";
const layer = createLayer(id, function (this: BaseLayer) {

    const research = (() => {
        const quintupleCondenser = createEffectResearch(() => ({
            cost: 75,
            display: {
                title: 'Branon Induction Phases',
                description: 'Quintuple the effect of M-field Condensers'
            },
            effect: 5
        })) as EffectResearch<DecimalSource>;
        const storage = createResearch(() => ({
            cost: 500,
            display: {
                title: 'Inflaton Containment Strategies',
                description: 'Allow construction of Inflaton Containment Units'
            },
            prerequisites: [cheaperLabs]
        }));
        const improvedStorage = createEffectResearch(() => ({
            cost: 1500,
            display: {
                title: 'Enhanced Isolation Protocols',
                description: 'Improve the Inflaton Containment Unit\'s storage capabilities'
            },
            effect: 1,
            prerequisites: [respecs]
        })) as EffectResearch<DecimalSource>;
        const autofillStorage = createResearch(() => ({
            cost: 6000,
            display: {
                title: 'Inflationary Tolerances',
                description: 'Allow stored Inflatons to inflate to fill your storage'
            },
            prerequisites: [respecs, improvedStorage]
        }));
        const isolatedStorage = createResearch(() => ({
            cost: 25000,
            display: {
                title: 'Secondary Isolation Standards',
                description: 'M-field Condensers no longer reduce the effect of Stored Inflatons'
            },
            prerequisites: [inflationResearch]
        }));
        const inflationResearch = createResearch(() => ({
            cost: 15000,
            display: {
                title: 'Active Restoration Protocols',
                description: 'Allow the construction of Active Redistribution Centers'
            },
            prerequisites: [queueTwo, improvedStorage]
        }));
        const biggerBuildings = createEffectResearch(() => ({
            cost: 25000,
            display: {
                title: 'Macroscale Synergies',
                description: 'Increase subspace building size tenfold, and their potency by twice as much'
            },
            effect: { size: 10, effect: 2 },
            prerequisites: [quarterQuantum, repeatableUnlock, inflationResearch],
            onResearch() {
                for (const building of Object.values(buildings.buildings)) {
                    building.amount.value = 0;
                }
            }
        })) as EffectResearch<{ size: DecimalSource, effect: DecimalSource }>;
        const respecs = createResearch(() => ({
            cost: 750,
            display: {
                title: 'Superstructural Stability Patterns',
                description: 'Enable individual building respecs'
            },
            prerequisites: [storage]
        }));
        const autobuild = createResearch(() => ({
            cost: 100000,
            display: {
                title: 'Mechanized Superscale Subsystems',
                description: 'Automatically build subspace buildings, and building them no longer consumes Foam'
            },
            prerequisites: [isolatedStorage, instantInflation]
        }));
        
        const doubleSize = createEffectResearch(() => ({
            cost: 100,
            display: {
                title: 'Banach-Tarski Point Manipulation',
                description: 'You can stabilize the universe at double the size'
            },
            effect: 2,
            prerequisites: [quintupleCondenser]
        })) as EffectResearch<DecimalSource>;
        const quadrupleSize = createEffectResearch(() => ({
            cost: 750,
            display: {
                title: 'Von Neumann Transformation',
                description: 'Double the size of the universe, again'
            },
            effect: 2,
            prerequisites: [fomeGain]
        })) as EffectResearch<DecimalSource>;

        const cheaperLabs = createResearch(() => ({
            cost: 100,
            display: {
                title: 'Subspatial Binding Constants',
                description: 'Reduce the cost scaling of Quantum Flux Analyzers'
            },
            prerequisites: [quintupleCondenser]
        }));
        const researchBoostLimit = computed(() => Decimal.times(unref(repeatables.analysis.effect), 1.8));
        const researchBoost = createEffectResearch(research => ({
            cost: 1500,
            display: {
                title: 'Distributed Analysis Framework',
                description: jsx(() => <span>Transform 10% of your Quantum Flux Analyzers into networking nodes, increasing Research Point gain by up to {format(unref(researchBoostLimit))}x</span>),
                effect: jsx(() => <>{format(unref((research as GenericResearch & GenericEffectFeature<DecimalSource>).effect))}</>)
            },
            effect() {
                return Decimal.pow(1.1, unref(buildings.buildings.lab.amount))
                              .clampMax(unref(researchBoostLimit));
            },
            prerequisites: [doubleSize, cheaperLabs]
        })) as EffectResearch<DecimalSource>;

        const fomeGain = createEffectResearch(() => ({
            cost: 500,
            display: {
                title: 'Counter-Inflational Cycles',
                description: 'Gain up to 1e6x more Foam, based on your current Stored Inflatons'
            },
            effect: 1e6,
            prerequisites: [doubleSize]
        })) as EffectResearch<DecimalSource>;
        const moreFomeGain = createEffectResearch(() => ({
            cost: 1500,
            display: {
                title: 'Scatter-Field Repulsion',
                description: 'Retain up to 1e12x more Foam, based on your current Stored Inflatons'
            },
            effect: 1e12,
            prerequisites: [halfQuantum, upgrades]
        })) as EffectResearch<DecimalSource>;
        const evenMoreFomeGain = createEffectResearch(() => ({
            cost: 9000,
            display: {
                title: 'Scalar Flux Reduction',
                description: 'Retain up to 1e12x more Foam yet again, based on your current Stored Inflatons'
            },
            effect: 1e12,
            prerequisites: [quarterQuantum, repeatableUnlock]
        })) as EffectResearch<DecimalSource>;

        const halfQuantum = createEffectResearch(() => ({
            cost: 750,
            display: {
                title: 'Quantum Phasor Coherence',
                description: 'Halve the effect of inflation on Quantum Foam'
            },
            effect: 0.5,
            prerequisites: [fomeGain]
        })) as EffectResearch<DecimalSource>;
        const quarterQuantum = createEffectResearch(() => ({
            cost: 6000,
            display: {
                title: 'Aggressive Flow Diffusion',
                description: 'Halve the effect of inflation on Quantum Foam, again'
            },
            effect: 0.5,
            prerequisites: [halfQuantum, moreFomeGain]
        })) as EffectResearch<DecimalSource>;

        const upgrades = createResearch(() => ({
            cost: 750,
            display: {
                title: 'Quantum Inflationo-dynamics',
                description: 'Unlock two more Inflaton upgrades'
            },
            prerequisites: [storage]
        }));
        const repeatableUnlock = createResearch(() => ({
            cost: 6000,
            display: {
                title: 'Infinite Expansion Theories',
                description: 'Unlock two repeatable researches'
            },
            prerequisites: [quadrupleSize]
        }));
        const moreRepeatables = createResearch(() => ({
            cost: 100000,
            display: {
                title: 'Sustainable Expansion Hypothesis',
                description: 'Unlock three more repeatable research projects'
            },
            prerequisites: [evenMoreFomeGain, biggerBuildings]
        }));

        const queueTwo = createEffectResearch(() => ({
            cost: 10000,
            display: {
                title: 'Scheduled Itemization',
                description: 'You can queue up to 2 additional researches'
            },
            effect: 2,
            prerequisites: [researchBoost]
        })) as EffectResearch<number>;
        const queueFour = createEffectResearch(() => ({
            cost: 100000,
            display: {
                title: 'Static Proposal Induction',
                description: 'Increase the research queue size by another 2 researches'
            },
            effect: 2,
            prerequisites: [queueTwo, repeatableUnlock]
        })) as EffectResearch<number>;

        const instantInflation = createResearch(() => ({
            cost: 25000,
            display: {
                title: 'Instantaneous Limit Testing',
                description: 'Beginning Inflation instantly expands the universe to the limit of your M-field Condensers\' safe operation'
            },
            prerequisites: [inflationResearch, autofillStorage]
        }));

        const mastery = createResearch(() => ({
            cost: 750000,
            display: {
                title: 'Spatial Mastery',
                description: jsx(() => <span>Unlock {entangled.isFirstBranch(inflatonId) ? acceleron.accelerons.displayName : entangled.strings.displayName}</span>)
            },
            prerequisites: [moreRepeatables, queueFour, autobuild]
        }));

        return {
            quintupleCondenser,
            doubleSize, cheaperLabs,
            fomeGain, researchBoost, storage,
            halfQuantum, quadrupleSize, upgrades, respecs,
            moreFomeGain, queueTwo, improvedStorage,
            quarterQuantum, repeatableUnlock, inflationResearch, autofillStorage,
            evenMoreFomeGain, biggerBuildings, isolatedStorage, instantInflation,
            moreRepeatables, queueFour, autobuild,
            mastery
        }
    })();

    const repeatables = (() => {
        const universeSize = createRepeatableResearch<ResearchOptions & Partial<RepeatableResearchOptions<Decimal>>, Decimal>(feature => ({
            visibility: computed(() => unref(research.repeatableUnlock.researched) ? Visibility.Visible : Visibility.Hidden),
            display: {
                title: 'Eternal Inflation',
                description: 'Double the size of your universe',
                effect: jsx(() => <>{formatWhole(unref(feature.effect as ProcessedComputable<Decimal>))}x</>)
            },
            cost() { return Decimal.pow(4, unref(feature.amount)).times(12000).dividedBy(1); /* 1st abyssal spinor buyable */},
            effect() { return Decimal.pow(2, unref(feature.amount)); }
        })) as GenericRepeatableResearch<DecimalSource>;
        const analysis = createRepeatableResearch<ResearchOptions & Partial<RepeatableResearchOptions<Decimal>>, Decimal>(feature => ({
            visibility: research.repeatableUnlock.researched,
            display: {
                title: 'Perpetual Testing',
                description: 'Increase Distributed Analysis Framework\'s maximum bonus by 80%',
                effect: jsx(() => <>{formatWhole(unref(feature.effect as ProcessedComputable<Decimal>))}x</>)
            },
            cost() { return Decimal.pow(8, unref(feature.amount)).times(15000).dividedBy(1); /* 1st abyssal spinor buyable */},
            effect() { return Decimal.pow(1.8, unref(feature.amount)); }
        })) as GenericRepeatableResearch<DecimalSource>;
        type BuildingSizeEffect = { size: DecimalSource, effect: DecimalSource };
        const buildingSize = createRepeatableResearch<ResearchOptions & Partial<RepeatableResearchOptions<BuildingSizeEffect>>, BuildingSizeEffect>(feature => ({
            visibility: research.moreRepeatables.researched,
            display: {
                title: 'Subspatial Construction',
                description: 'Increase Subspace building size tenfold, and their potency by twice as much',
                effect: jsx(() => <>{formatWhole(unref(feature.effect as ProcessedComputable<BuildingSizeEffect>).size)}x, {formatWhole(Decimal.times(unref(feature.effect as ProcessedComputable<BuildingSizeEffect>).size, unref(feature.effect as ProcessedComputable<BuildingSizeEffect>).effect))}x</>)
            },
            cost() { return Decimal.pow(200, unref(feature.amount)).times(150000).dividedBy(1).div(unref(timecube.getTimesquareEffect(Sides.LEFT))); /* 1st abyssal spinor buyable */},
            effect() { return {
                size: Decimal.pow(10, unref(feature.amount)),
                effect: Decimal.pow(2, unref(feature.amount))
            }},
            canResearch() {
                const minimumSize = unref(currentBuildingSize);
                for (const building of Object.values(buildings.buildings)) {
                    if (minimumSize.times(10).gt(unref(building.amount))) {
                        return false;
                    }
                }
                return true;
            },
            onResearch() {
                for (const building of Object.values(buildings.buildings)) {
                    building.amount.value = 0;
                }
            }
        })) as GenericRepeatableResearch<BuildingSizeEffect>;
        const buildingCost = createRepeatableResearch<ResearchOptions & Partial<RepeatableResearchOptions<Decimal>>, Decimal>(feature => ({
            visibility: research.moreRepeatables.researched,
            display: {
                title: 'Efficient Design',
                description: 'Decrease Subspace building cost scaling by 1.5x',
                effect: jsx(() => <>1/{format(unref(feature.effect as ProcessedComputable<Decimal>))}x</>)
            },
            cost() { return Decimal.pow(3, unref(feature.amount)).times(120000).dividedBy(1); /* 1st abyssal spinor buyable */},
            effect() { return Decimal.pow(1.5, unref(feature.amount)); }
        })) as GenericRepeatableResearch<DecimalSource>;
        const fome = createRepeatableResearch<ResearchOptions & Partial<RepeatableResearchOptions<Decimal>>, Decimal>(feature => ({
            visibility: research.moreRepeatables.researched,
            display: {
                title: 'Inflational Dynamics',
                description: 'Retain up to 1e6x more Foam',
                effect: jsx(() => <>{formatWhole(unref(feature.effect as ProcessedComputable<Decimal>))}x</>)
            },
            cost() { return Decimal.pow(5, unref(feature.amount)).times(160000).dividedBy(1); /* 1st abyssal spinor buyable */},
            effect() { return Decimal.pow(1e6, unref(feature.amount)); }
        })) as GenericRepeatableResearch<DecimalSource>;

        return { universeSize, analysis, buildingSize, buildingCost, fome };
    })();

    const queueLength = computed<number>(() => 1 + getResearchEffect(research.queueTwo, 0) + getResearchEffect(research.queueFour, 0));
    const parallelResearchCount = computed<number>(() => 1);
    const researchQueue = persistent<string[]>([]);

    const baseResearchGain: ComputedRef<Decimal> = computed(() => Decimal.times(unref(buildings.buildings.lab.effect), getResearchEffect(research.researchBoost, 1)).times(1) /* 1st abyssal pion buyable */);
    const finalResearchGain = computed(() => unref(baseResearchGain));
    
    const autoResearching = persistent<boolean>(false);
    inflaton.on("preUpdate", diff => {
        if (unref(researchQueue).length <= 0) return;
        const gain = Decimal.times(unref(finalResearchGain), diff);
        for (const id of unref(researchQueue).slice(0, unref(parallelResearchCount))) {
            const node = [research, repeatables].flatMap(location => Object.values(location) as GenericResearch[]).find(node => node.id === id);
            if (node !== undefined) node.progress.value = gain.plus(node.progress.value);
        }
    });
    inflaton.on("update", () => { // if automating research and below parallel count, add the cheapest repeatables to the queue
        if (!unref(autoResearching)) return;
        if (unref(researchQueue).length >= unref(parallelResearchCount)) return;
        Object.values(repeatables).filter(repeatable => Decimal.gte(unref(repeatable.amount), 1))
                                  .filter(repeatable => !unref(repeatable.isResearching))
                                  .filter(repeatable => unref(repeatable.canResearch))
                                  .sort((a,b) => Decimal.compare(
                                    unref((a.requirements as CostRequirement).cost as ProcessedComputable<DecimalSource>),
                                    unref((b.requirements as CostRequirement).cost as ProcessedComputable<DecimalSource>)
                                  ))
                                  .slice(0, unref(parallelResearchCount) - unref(researchQueue).length)
                                  .forEach(repeatable => repeatable.research(true));
    });
    inflaton.on("postUpdate", () => { // completed and invalid researches must be culled from the queue
        researchQueue.value = unref(researchQueue).filter(id => {
            const node = [research, repeatables].flatMap(location => Object.values(location) as GenericResearch[]).find(node => node.id === id);
            if (node === undefined) return false;
            if (Decimal.gte(unref(node.progressPercentage), 1)) {
                node.onResearch?.();
                return false;
            }
            return true;
        });
    });

    return {
        research,
        repeatables,

        queueLength,
        parallelResearchCount,
        researchQueue,

        researchGain: finalResearchGain,
        autoResearching,
        display: jsx(() => (
            <div class='row' style={{flexFlow: 'row-reverse nowrap', alignItems: 'flex-start', justifyContent: 'space-evenly'}}>
                <ColumnVue>
                    <ResearchQueueVue parallel={parallelResearchCount} queue={computed(() => Array.from({...unref(researchQueue), length: Math.max(unref(researchQueue).length, unref(queueLength))}))} />
                    {
                        unref(research.repeatableUnlock.researched)
                            ? <>
                                <span style={{fontSize: "12px"}}>Enable Auto-Repeatable Research:</span>
                                <ToggleVue v-model={autoResearching.value} style={{marginTop: 0}}/>
                                <SpacerVue />
                            </>
                            : undefined
                    }
                </ColumnVue>
                <ResearchTreeVue research={[
                    [research.quintupleCondenser],
                    [research.doubleSize, research.cheaperLabs],
                    [research.fomeGain, research.researchBoost, research.storage],
                    [research.halfQuantum, research.quadrupleSize, research.upgrades, research.respecs],
                    [research.moreFomeGain, research.queueTwo, research.improvedStorage],
                    [research.quarterQuantum, research.repeatableUnlock, research.inflationResearch, research.autofillStorage],
                    [research.evenMoreFomeGain, research.biggerBuildings, research.isolatedStorage, research.instantInflation],
                    [research.moreRepeatables, research.queueFour, research.autobuild],
                    [research.mastery]
                ]}/>
                <ColumnVue>
                    {...Object.values(repeatables).map(render).map(element => <div style={{margin: 'var(--feature-margin) 0px'}}>{element}</div>)}
                </ColumnVue>
            </div>
        ))
    }
});

export default layer;

export function removeResearchFromQueue(research: GenericResearch) {
    layer.researchQueue.value = unref(layer.researchQueue).filter(id => id !== research.id);
}

const allResearch = computed(() => [layer.research, layer.repeatables].flatMap(location => Object.values(location)));
function startResearch(this: GenericResearch, force: boolean = false) {
    if (force || unref(layer.researchQueue).length < unref(layer.queueLength)) {
        const research = unref(allResearch).find(research => research.id === this.id);
        if (research) unref(layer.researchQueue).push(research.id);
    }
}
function isResearching(this: GenericResearch) {
    return unref(layer.researchQueue).some(id => id === this.id);
}

interface ResearchOptions {
    visibility?: Computable<Visibility | boolean>;
    prerequisites?: GenericResearch[];
    cost: Computable<DecimalSource>;
    display: Computable<CoercableComponent
        | {
            title: CoercableComponent;
            description: CoercableComponent;
            effect?: CoercableComponent;
        }
    >;
    canResearch?: Computable<boolean>;
    onResearch?: VoidFunction;
}

function createResearch<T extends ResearchOptions>(
    optionsFunc: OptionsFunc<T, BaseResearch, GenericResearch>
): GenericResearch {
    return actualCreateResearch(research => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch } = optionsFunc.call(research, research);
        return {
            visibility,
            prerequisites,
            requirements: createCostRequirement(() => ({
                resource: noPersist(createResource(noPersist(research.progress), "Research Points")),
                cost
            })),
            display,
            canResearch,
            onResearch,
            research: startResearch,
            isResearching
        }
    });
}

function createEffectResearch<T extends ResearchOptions & EffectFeatureOptions<U>, U = unknown>(
    optionsFunc: OptionsFunc<T, BaseResearch, GenericResearch>
) {
    return actualCreateResearch(research => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch, effect } = optionsFunc.call(research, research);
        return {
            visibility,
            prerequisites,
            requirements: createCostRequirement(() => ({
                resource: noPersist(createResource(noPersist(research.progress), "Research Points")),
                cost
            })),
            display,
            canResearch,
            onResearch,
            research: startResearch,
            isResearching,
            effect
        }
    }, effectDecorator) as GenericResearch & GenericEffectFeature<U>;
}

function createRepeatableResearch<T extends ResearchOptions & Partial<RepeatableResearchOptions<U>>, U>(
    optionsFunc: OptionsFunc<T, BaseRepeatableResearch<U>, GenericRepeatableResearch<U>>
) {
    return actualCreateResearch(research => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch, effect, limit } = optionsFunc.call(research, research as BaseRepeatableResearch<U>);
        return {
            visibility,
            prerequisites,
            requirements: createCostRequirement(() => ({
                resource: noPersist(createResource(noPersist(research.progress), "Research Points")),
                cost
            })),
            display,
            canResearch,
            onResearch,
            research: startResearch,
            isResearching,
            effect,
            limit
        }
    }, effectDecorator, repeatableDecorator) as unknown as GenericResearch & GenericRepeatableResearch<U>;
}
