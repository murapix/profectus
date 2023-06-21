import { CoercableComponent, OptionsFunc, Visibility, jsx } from "features/feature";
import { createLayer, BaseLayer } from "game/layers";
import { BaseResearch, EffectResearch, GenericResearch, createResearch as actualCreateResearch, getResearchEffect } from "./research";
import { BaseRepeatableResearch, GenericRepeatableResearch, RepeatableResearch, RepeatableResearchOptions, repeatableDecorator } from "./repeatableDecorator"
import { createCostRequirement } from "game/requirements";
import { createLazyProxy } from "util/proxies";
import { createResource } from "features/resources/resource";
import { Computable, ProcessedComputable } from "util/computed";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import buildings from "./buildings";
import { ComputedRef, computed, unref } from "vue";
import { format, formatWhole } from "util/break_eternity";
import acceleron from "../acceleron/acceleron";
import entangled from "../entangled-old/entangled";
import { id as inflatonId } from "./inflaton";
import ResearchTreeVue from "./ResearchTree.vue";

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
            prerequisites: [quarterQuantum, repeatableUnlock, inflationResearch]
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
        const researchBoost = createEffectResearch(research => ({
            cost: 1500,
            display: {
                title: 'Distributed Analysis Framework',
                description: jsx(() => <span>Transform 10% of your Quantum Flux Analyzers into networking nodes, increasing Research Point gain by up to {format(unref((research as GenericResearch & {limit: ComputedRef<Decimal>}).limit))}</span>),
                effect: jsx(() => <>{format(unref((research as GenericResearch & GenericEffectFeature<DecimalSource>).effect))}</>)
            },
            effect() {
                return Decimal.pow(1.1, unref(buildings.buildings.lab.amount))
                              .clampMax(unref((research as BaseResearch & {limit: ProcessedComputable<Decimal>}).limit))
            },
            limit: computed(() => Decimal.times(unref(1), 1.8)),
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
            visibility: research.repeatableUnlock.researched,
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
            cost() { return Decimal.pow(200, unref(feature.amount)).times(150000).dividedBy(1).div(1); /* 1st abyssal spinor buyable, left time square */},
            effect() { return {
                size: Decimal.pow(10, unref(feature.amount)),
                effect: Decimal.pow(2, unref(feature.amount))
            }}
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
    
    return {
        research,
        repeatables,

        queueLength,
        display: jsx(() => (
            <>
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
            </>
        ))
    }
});

export default layer;

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
) {
    return createLazyProxy<GenericResearch, GenericResearch>(feature => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch } = optionsFunc.call(feature, feature);
        return actualCreateResearch(research => ({
            visibility,
            prerequisites,
            requirements: createCostRequirement(() => ({
                resource: createResource(research.progress, ""),
                cost
            })),
            display,
            canResearch,
            onResearch,
            research() { },
            isResearching() { return false }
        }));
    });
}

function createEffectResearch<T extends ResearchOptions & EffectFeatureOptions<U>, U = unknown>(
    optionsFunc: OptionsFunc<T, BaseResearch, GenericResearch>
) {
    return createLazyProxy<GenericResearch & GenericEffectFeature<U>, GenericResearch & GenericEffectFeature<U>>(feature => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch, effect } = optionsFunc.call(feature, feature);
        return actualCreateResearch(research => ({
            visibility,
            prerequisites,
            requirements: createCostRequirement(() => ({
                resource: createResource(research.progress, ""),
                cost
            })),
            display,
            canResearch,
            onResearch,
            research() { },
            isResearching() { return false },
            effect
        }), effectDecorator) as GenericResearch & GenericEffectFeature<U>;
    });
}

function createRepeatableResearch<T extends ResearchOptions & Partial<RepeatableResearchOptions<U>>, U>(
    optionsFunc: OptionsFunc<T, BaseRepeatableResearch<U>, GenericRepeatableResearch<U>>
) {
    return createLazyProxy<GenericRepeatableResearch<U>, GenericRepeatableResearch<U>>(feature => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch, effect, limit } = optionsFunc.call(feature, feature);
        return actualCreateResearch(research => ({
            visibility,
            prerequisites,
            requirements: createCostRequirement(() => ({
                resource: createResource(research.progress, ""),
                cost
            })),
            display,
            canResearch,
            onResearch,
            research() { },
            isResearching() { return false },
            effect,
            limit
        }), effectDecorator, repeatableDecorator) as unknown as GenericResearch & GenericRepeatableResearch<U>;
    });
}
