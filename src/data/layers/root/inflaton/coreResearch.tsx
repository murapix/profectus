import Toggle from "components/fields/Toggle.vue";
import Column from "components/layout/Column.vue";
import Spacer from "components/layout/Spacer.vue";
import { Visibility } from "features/feature";
import { createResource, Resource } from "features/resources/resource";
import { BaseLayer, createLayer } from "game/layers";
import { createAdditiveModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { noPersist, persistent } from "game/persistence";
import { CostRequirement, CostRequirementOptions, createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { createModifierModal } from "util/util";
import { render, Renderable } from "util/vue";
import { ComputedRef, MaybeRef, MaybeRefOrGetter, computed, unref } from "vue";
import acceleron from "../acceleron/acceleron";
import entangled from "../entangled/entangled";
import skyrmion from "../skyrmion/skyrmion";
import timecube from "../timecube/timecube";
import { Sides } from "../timecube/timesquares";
import ResearchQueue from "./ResearchQueue.vue";
import ResearchTree from "./ResearchTree.vue";
import { buildingSize as currentBuildingSize } from "./building";
import buildings from "./buildings";
import inflaton, { id as inflatonId } from "./inflaton";
import { RepeatableResearch, RepeatableResearchOptions, formatRoman, repeatableResearchWrapper } from "./repeatableDecorator";
import { Research, ResearchOptions, createResearch as actualCreateResearch, getResearchEffect } from "./research";
import { MaybeGetter, processGetter } from "util/computed";
import { effectMixin } from "mixins/effects";
import RepeatableResearchComponent from "./RepeatableResearch.vue";

const id = "coreResearch";
const layer = createLayer(id, function (this: BaseLayer) {

    const research = (() => {
        const quintupleCondenser = createEffectResearch<number>(() => ({
            cost: 75,
            display: {
                title: 'Branon Induction Phases',
                description: 'Quintuple the effect of M-field Condensers'
            },
            effect: 5
        }));
        const storage = createResearch(() => ({
            cost: 500,
            display: {
                title: 'Inflaton Containment Strategies',
                description: 'Allow construction of Inflaton Containment Units'
            },
            prerequisites: [cheaperLabs]
        }));
        const improvedStorage = createEffectResearch<number>(() => ({
            cost: 1500,
            display: {
                title: 'Enhanced Isolation Protocols',
                description: 'Improve the Inflaton Containment Unit\'s storage capabilities'
            },
            effect: 1,
            prerequisites: [respecs]
        }));
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
        const smallerBuildings = createResearch(() => ({
            cost: 15000,
            display: {
                title: 'Hybridized Containerization Strategies',
                description: 'Reduce subspace building size by up to 10%'
            },
            prerequisites: [queueTwo, improvedStorage]
        }));
        const biggerBuildings = createEffectResearch<{ size: number, effect: number }>(() => ({
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
        }));
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
        
        const doubleSize = createEffectResearch<number>(() => ({
            cost: 100,
            display: {
                title: 'Banach-Tarski Point Manipulation',
                description: 'You can stabilize the universe at double the size'
            },
            effect: 2,
            prerequisites: [quintupleCondenser]
        }));
        const quadrupleSize = createEffectResearch<number>(() => ({
            cost: 750,
            display: {
                title: 'Von Neumann Transformation',
                description: 'Double the size of the universe, again'
            },
            effect: 2,
            prerequisites: [fomeGain]
        }));

        const cheaperLabs = createResearch(() => ({
            cost: 100,
            display: {
                title: 'Subspatial Binding Constants',
                description: 'Reduce the cost scaling of Quantum Flux Analyzers'
            },
            prerequisites: [quintupleCondenser]
        }));
        const researchBoostLimit = computed(() => Decimal.times(unref(repeatables.analysis.effect), 1.8));
        const researchBoost = createEffectResearch<Decimal>(() => ({
            cost: 1500,
            display: {
                title: 'Distributed Analysis Framework',
                description: () => <span>Transform 10% of your Quantum Flux Analyzers into networking nodes, increasing Research Point gain by up to {format(unref(researchBoostLimit))}×</span>,
                effect: (): Renderable => <>{format(unref(researchBoost.effect))}</>
            },
            effect(): Decimal {
                return Decimal.pow(1.1, unref(buildings.buildings.lab.amount))
                              .clampMax(unref(researchBoostLimit));
            },
            prerequisites: [doubleSize, cheaperLabs]
        }));

        const fomeGain = createEffectResearch<number>(() => ({
            cost: 500,
            display: {
                title: 'Counter-Inflational Cycles',
                description: 'Gain up to 1e6x more Foam, based on your current Stored Inflatons'
            },
            effect: 1e6,
            prerequisites: [doubleSize]
        }));
        const moreFomeGain = createEffectResearch<number>(() => ({
            cost: 1500,
            display: {
                title: 'Scatter-Field Repulsion',
                description: 'Retain up to 1e12x more Foam, based on your current Stored Inflatons'
            },
            effect: 1e12,
            prerequisites: [halfQuantum, upgrades]
        }));
        const evenMoreFomeGain = createEffectResearch<number>(() => ({
            cost: 9000,
            display: {
                title: 'Scalar Flux Reduction',
                description: 'Retain up to 1e12x more Foam yet again, based on your current Stored Inflatons'
            },
            effect: 1e12,
            prerequisites: [quarterQuantum, repeatableUnlock]
        }));

        const halfQuantum = createEffectResearch<number>(() => ({
            cost: 750,
            display: {
                title: 'Quantum Phasor Coherence',
                description: 'Halve the effect of inflation on Quantum Foam'
            },
            effect: 0.5,
            prerequisites: [fomeGain]
        }));
        const quarterQuantum = createEffectResearch<number>(() => ({
            cost: 6000,
            display: {
                title: 'Aggressive Flow Diffusion',
                description: 'Halve the effect of inflation on Quantum Foam, again'
            },
            effect: 0.5,
            prerequisites: [halfQuantum, moreFomeGain]
        }));

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

        const queueTwo = createEffectResearch<number>(() => ({
            cost: 10000,
            display: {
                title: 'Scheduled Itemization',
                description: 'You can queue up to 2 additional researches'
            },
            effect: 2,
            prerequisites: [researchBoost]
        }));
        const queueFour = createEffectResearch<number>(() => ({
            cost: 100000,
            display: {
                title: 'Static Proposal Induction',
                description: 'Increase the research queue size by another 2 researches'
            },
            effect: 2,
            prerequisites: [queueTwo, repeatableUnlock]
        }));

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
                description: () => <span>Unlock {(entangled.isFirstBranch(inflatonId) || Decimal.gt(unref(entangled.strings), 0)) ? unref(acceleron.accelerons.displayName) : unref(entangled.strings.displayName)}</span>
            },
            prerequisites: [moreRepeatables, queueFour, autobuild]
        }));

        // TODO: Move to expansion research
        const inflationResearch = createResearch(() => ({
            cost: 15000,
            display: {
                title: 'Active Restoration Protocols',
                description: 'Allow the construction of Active Redistribution Centers'
            },
            prerequisites: [queueTwo, improvedStorage]
        }));

        return {
            quintupleCondenser,
            doubleSize, cheaperLabs,
            fomeGain, researchBoost, storage,
            halfQuantum, quadrupleSize, upgrades, respecs,
            moreFomeGain, queueTwo, improvedStorage,
            quarterQuantum, repeatableUnlock, smallerBuildings, autofillStorage,
            evenMoreFomeGain, biggerBuildings, isolatedStorage, instantInflation,
            moreRepeatables, queueFour, autobuild,
            mastery,

            inflationResearch
        }
    })();

    const repeatables = (() => {
        const universeSize = createRepeatableResearch<Decimal>(() => ({
            visibility: research.repeatableUnlock.researched,
            display: {
                title: 'Eternal Inflation',
                description: 'Double the size of your universe',
                effect: (): Renderable => <>{formatWhole(unref(universeSize.effect))}×</>
            },
            cost(): Decimal { return Decimal.pow(4, unref(universeSize.amount)).times(12000).dividedBy(unref(skyrmion.spinor.upgrades.nu.effect)); },
            effect(): Decimal { return Decimal.pow(2, unref(universeSize.amount)); }
        }));
        const analysis = createRepeatableResearch<Decimal>(() => ({
            visibility: research.repeatableUnlock.researched,
            display: {
                title: 'Perpetual Testing',
                description: 'Increase Distributed Analysis Framework\'s maximum bonus by 80%',
                effect: (): Renderable => <>{formatWhole(unref(analysis.effect))}×</>
            },
            cost(): Decimal { return Decimal.pow(8, unref(analysis.amount)).times(15000).dividedBy(unref(skyrmion.spinor.upgrades.nu.effect)); },
            effect(): Decimal { return Decimal.pow(1.8, unref(analysis.amount)); }
        }));
        const buildingSize = createRepeatableResearch<{ size: Decimal, effect: Decimal }>(() => ({
            visibility: research.moreRepeatables.researched,
            display: {
                title: 'Subspatial Construction',
                description: 'Increase Subspace building size tenfold, and their potency by twice as much',
                effect: (): Renderable => <>{formatWhole(unref(buildingSize.effect).size)}×, {formatWhole(Decimal.times(unref(buildingSize.effect).size, unref(buildingSize.effect).effect))}×</>
            },
            cost(): Decimal { return Decimal.pow(200, unref(buildingSize.amount)).times(150000).dividedBy(unref(skyrmion.spinor.upgrades.nu.effect)).div(unref(timecube.getTimesquareEffect(Sides.LEFT))); },
            effect(): { size: Decimal, effect: Decimal } { return {
                size: Decimal.pow(10, unref(buildingSize.amount)),
                effect: Decimal.pow(2, unref(buildingSize.amount))
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
        }));
        const buildingCost = createRepeatableResearch<Decimal>(() => ({
            visibility: research.moreRepeatables.researched,
            display: {
                title: 'Efficient Design',
                description: 'Decrease Subspace building cost scaling by 1.5x',
                effect: (): Renderable => <>/{format(unref(buildingCost.effect))}</>
            },
            cost(): Decimal { return Decimal.pow(3, unref(buildingCost.amount)).times(120000).dividedBy(unref(skyrmion.spinor.upgrades.nu.effect)); },
            effect(): Decimal { return Decimal.pow(1.5, unref(buildingCost.amount)); }
        }));
        const fome = createRepeatableResearch<Decimal>(() => ({
            visibility: research.moreRepeatables.researched,
            display: {
                title: 'Inflational Dynamics',
                description: 'Retain up to 1e6x more Foam',
                effect: (): Renderable => <>{formatWhole(unref(fome.effect))}×</>
            },
            cost(): Decimal { return Decimal.pow(5, unref(fome.amount)).times(160000).dividedBy(unref(skyrmion.spinor.upgrades.nu.effect)); },
            effect(): Decimal { return Decimal.pow(1e6, unref(fome.amount)); }
        }));

        return { universeSize, analysis, buildingSize, buildingCost, fome };
    })();

    const queueLength = computed<number>(() => 1 + getResearchEffect(research.queueTwo, 0) + getResearchEffect(research.queueFour, 0));
    const parallelResearchCount = computed<number>(() => 1);
    const researchQueue = persistent<string[]>([]);

    const researchBoostLimitModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: repeatables.analysis.effect,
            enabled: () => Decimal.gt(unref(repeatables.analysis.amount), 0),
            description: () => <>[{inflaton.name}] Repeatable: Perpetual Testing {formatRoman(unref(repeatables.analysis.amount))}</>
        }))
    ]);

    const baseResearchGainModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: 0.9,
            enabled: noPersist(research.researchBoost.researched),
            description: () => <>[{inflaton.name}] Reserved for Networking Nodes</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: research.researchBoost.effect,
            enabled: noPersist(research.researchBoost.researched),
            description: () => <>[{inflaton.name}] Distributed Analysis Framework</>
        })),
        createMultiplicativeModifier(() => ({
            multiplier: skyrmion.pion.upgrades.nu.effect,
            enabled: () => Decimal.gt(unref(skyrmion.pion.upgrades.nu.totalAmount), 0),
            description: () => <>[{skyrmion.name}] {unref(skyrmion.pion.pions.singularName)} Upgrade ν ({formatWhole(unref(skyrmion.pion.upgrades.nu.totalAmount))})</>
        }))
    ]);
    const finalResearchGainModifiers = createSequentialModifier(() => [
        baseResearchGainModifiers,
        createAdditiveModifier(() => ({
            addend: () => Decimal.negate(unref(buildings.buildings.tuner.effect).cost),
            enabled: () => Decimal.gt(unref(buildings.buildings.tuner.totalAmount), 0),
            description: () => <>[{inflaton.name}] Active Redistribution Centers</>
        }))
    ]);
    const baseResearchGain: ComputedRef<DecimalSource> = computed(() => baseResearchGainModifiers.apply(unref(buildings.buildings.lab.effect)));
    const finalResearchGain: ComputedRef<DecimalSource> = computed(() => Decimal.clampMin(finalResearchGainModifiers.apply(unref(buildings.buildings.lab.effect)), 0));
    
    const autoResearching = persistent<boolean>(false);
    inflaton.on("preUpdate", (diff: number) => {
        if (unref(researchQueue).length <= 0) return;
        const gain = Decimal.times(unref(finalResearchGain), diff);
        for (const id of unref(researchQueue).slice(0, unref(parallelResearchCount))) {
            const node = [research, repeatables].flatMap(location => Object.values(location)).find(node => node.id === id);
            if (node !== undefined) node.progress.value = gain.plus(node.progress.value);
        }
    });
    inflaton.on("update", () => { // if automating research and below parallel count, add the cheapest repeatables to the queue
        if (!unref(autoResearching)) return;
        if (unref(researchQueue).length >= unref(parallelResearchCount)) {
            if (!unref(research.moreRepeatables.researched)) return;
            if (!unref(repeatables.buildingSize.canResearch)) return;
            if (unref(researchQueue).some(id => id === repeatables.buildingSize.id)) return;
            if (unref(researchQueue).length >= unref(queueLength)) return;
            
            const newQueue = [repeatables.buildingSize.id, ...unref(researchQueue)]
                .map(id => [research, repeatables].flatMap(location => Object.values(location)).find(node => node.id === id))
                .filter(node => node !== undefined)
                .sort((a,b) => Decimal.compare(
                    unref((a.requirements as CostRequirement).cost as MaybeRef<DecimalSource>),
                    unref((b.requirements as CostRequirement).cost as MaybeRef<DecimalSource>)
                ))
                .map(node => node!.id);

            if (newQueue.indexOf(repeatables.buildingSize.id) < unref(parallelResearchCount)) {
                researchQueue.value = newQueue;
            }
            return;
        }
        Object.values(repeatables).filter(repeatable => Decimal.gte(unref(repeatable.amount), 1))
                                  .filter(repeatable => !unref(repeatable.isResearching))
                                  .filter(repeatable => unref(repeatable.canResearch))
                                  .sort((a,b) => Decimal.compare(
                                    unref((a.requirements as CostRequirement).cost as MaybeRef<DecimalSource>),
                                    unref((b.requirements as CostRequirement).cost as MaybeRef<DecimalSource>)
                                  ))
                                  .slice(0, unref(parallelResearchCount) - unref(researchQueue).length)
                                  .forEach(repeatable => repeatable.research(true));
    });
    inflaton.on("postUpdate", () => { // completed and invalid researches must be culled from the queue
        researchQueue.value = unref(researchQueue).filter(id => {
            const node = [research, repeatables].flatMap(location => Object.values(location)).find(node => node.id === id);
            if (node === undefined) return false;
            if (Decimal.gte(unref(node.progressPercentage), 1)) {
                node.onResearch?.();
                return false;
            }
            return true;
        });
    });

    const modifiersModal = createModifierModal(
        "Research Modifiers",
        () => [{
            title: "Maximum Distributed Analysis Framework Bonus",
            modifier: researchBoostLimitModifiers,
            visible: noPersist(research.researchBoost.researched),
            base: 1.8,
            baseText: () => <>[{inflaton.name}] Distributed Analysis Framework</>
        },
        {
            title: "Research Point Production",
            modifier: finalResearchGainModifiers,
            base: buildings.buildings.lab.effect,
            baseText: () => <>[{inflaton.name}] Quantum Flux Analyzers</>
        }]
    );

    return {
        research,
        repeatables,

        queueLength,
        parallelResearchCount,
        researchQueue,

        researchGain: baseResearchGain,
        totalResearchGain: finalResearchGain,
        autoResearching,
        display: () => (
            <>
                <div>Your buildings are producing {formatWhole(unref(finalResearchGain))} Research Points{render(modifiersModal)}</div>
                <div class='row' style={{flexFlow: 'row-reverse nowrap', alignItems: 'flex-start', justifyContent: 'space-evenly'}}>
                    <Column>
                        <ResearchQueue parallel={parallelResearchCount} queue={computed(() => Array.from({...unref(researchQueue), length: Math.max(unref(researchQueue).length, unref(queueLength))}))} />
                        {
                            unref(research.repeatableUnlock.researched)
                                ? <>
                                    <span style={{fontSize: "12px"}}>Enable Auto-Repeatable Research:</span>
                                    <Toggle v-model={autoResearching.value} style={{marginTop: 0}}/>
                                    <Spacer />
                                </>
                                : undefined
                        }
                    </Column>
                    <ResearchTree research={[
                        [research.quintupleCondenser],
                        [research.doubleSize, research.cheaperLabs],
                        [research.fomeGain, research.researchBoost, research.storage],
                        [research.halfQuantum, research.quadrupleSize, research.upgrades, research.respecs],
                        [research.moreFomeGain, research.queueTwo, research.improvedStorage],
                        [research.quarterQuantum, research.repeatableUnlock, research.smallerBuildings, research.autofillStorage],
                        [research.evenMoreFomeGain, research.biggerBuildings, research.isolatedStorage, research.instantInflation],
                        [research.moreRepeatables, research.queueFour, research.autobuild],
                        [research.mastery]
                    ]}/>
                    <Column>
                        {...Object.values(repeatables).map(repeatable => render(repeatable)).map(element => <div style={{margin: 'var(--feature-margin) 0px'}}>{element}</div>)}
                    </Column>
                </div>
            </>
        )
    }
});

export default layer;

export function removeResearchFromQueue(research: Research) {
    layer.researchQueue.value = unref(layer.researchQueue).filter(id => id !== research.id);
}

const allResearch = computed(() => [layer.research, layer.repeatables].flatMap(location => Object.values(location)));
function startResearch(this: Research, force: boolean = false) {
    if (force || unref(layer.researchQueue).length < unref(layer.queueLength)) {
        const research = unref(allResearch).find(research => research.id === this.id);
        if (research) unref(layer.researchQueue).push(research.id);
    }
}
function isResearching(this: Research): boolean {
    return unref(layer.researchQueue).some(id => id === this.id);
}

type CoreResearchOptions = Omit<ResearchOptions, 
    'requirements' | 'research' | 'isResearching'
> & {
    visibility?: MaybeRefOrGetter<Visibility | boolean>;
    prerequisites?: Research[];
    cost: MaybeGetter<DecimalSource>;
}

type CoreRepeatableOptions<T> = Omit<RepeatableResearchOptions,
    'requirements' | 'research' | 'isResearching'
> & CoreResearchOptions & {
    effect: MaybeRefOrGetter<T>
}

function createProgressResource(research: Research): Resource<DecimalSource> {
    return noPersist(createResource(noPersist(research.progress), { displayName: "Research Points" }));
}

function createResearch<T extends CoreResearchOptions>(
    optionsFunc: () => T
) {
    const research = actualCreateResearch(() => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch } = optionsFunc();
        return {
            visibility,
            prerequisites,
            requirements: createCostRequirement((): CostRequirementOptions => ({
                resource: createProgressResource(research),
                cost
            })),
            display,
            canResearch,
            onResearch,
            research: startResearch,
            isResearching
        }
    });
    return research;
}

function createEffectResearch<U, T extends CoreResearchOptions & { effect: MaybeGetter<U> } = CoreResearchOptions & { effect: MaybeGetter<U> }>(
    optionsFunc: () => T
) {
    const research = actualCreateResearch(() => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch, effect } = optionsFunc();
        return {
            visibility,
            prerequisites,
            requirements: createCostRequirement((): CostRequirementOptions => ({
                resource: createProgressResource(research),
                cost
            })),
            display,
            canResearch,
            onResearch,
            research: startResearch,
            isResearching,
            ...effectMixin(effect)
        }
    });
    return research;
}

function createRepeatableResearch<U, T extends CoreRepeatableOptions<U> = CoreRepeatableOptions<U>>(
    optionsFunc: () => T
) {
    const amount = persistent<DecimalSource>(0);
    const research = actualCreateResearch(() => {
        const { visibility, prerequisites, cost, display, canResearch, onResearch, effect, limit } = optionsFunc();
        return {
            ...repeatableResearchWrapper({
                research: computed((): RepeatableResearch<U> => research as RepeatableResearch<U>),
                canResearch,
                onResearch,
                display,
                effect,
                limit: processGetter(limit) ?? 3998
            }),
            visibility,
            prerequisites,
            requirements: createCostRequirement((): CostRequirementOptions => ({
                resource: createProgressResource(research),
                cost
            })),
            research: startResearch,
            isResearching,
            amount
        }
    });
    research.components = [
        () => <RepeatableResearchComponent
            visibility={research.visibility}
            display={research.display}
            id={research.id}
            requirements={research.requirements}
            canResearch={research.canResearch}
            isResearching={research.isResearching}
            progress={research.progress}
            progressPercentage={research.progressPercentage}
            researched={research.researched}
            amount={research.amount}
            maxed={research.maxed}
            research={research.research}
        />
    ]
    return research;
}
