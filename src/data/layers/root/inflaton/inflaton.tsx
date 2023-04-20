import ColumnVue from "components/layout/Column.vue";
import SpacerVue from "components/layout/Spacer.vue";
import { createClickable, GenericClickable } from "features/clickables/clickable";
import { BaseBonusAmountFeature, bonusAmountDecorator, BonusAmountFeatureOptions, GenericBonusAmountFeature } from "features/decorators/bonusDecorator";
import { effectDecorator, EffectFeatureOptions, GenericEffectFeature } from "features/decorators/common";
import { CoercableComponent, jsx, OptionsFunc, Visibility } from "features/feature";
import { createRepeatable, BaseRepeatable, GenericRepeatable, RepeatableOptions } from "features/repeatable";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource, Resource, trackBest } from "features/resources/resource";
import { createTab } from "features/tabs/tab";
import { createTabFamily } from "features/tabs/tabFamily";
import { createUpgrade, GenericUpgrade } from "features/upgrades/upgrade";
import Formula from "game/formulas/formulas";
import { FormulaSource, GenericFormula, InvertibleFormula } from "game/formulas/types";
import { BaseLayer, createLayer } from "game/layers";
import { noPersist, persistent } from "game/persistence";
import { createBooleanRequirement, createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall, formatWhole } from "util/break_eternity";
import { Computable, ProcessedComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { render, renderRow } from "util/vue";
import { computed, ComputedRef, unref } from "vue";
import acceleron from "../acceleron/acceleron";
import entangled from "../entangled/entangled";
import fome, { FomeTypes } from "../fome/fome";
import { createResearch, GenericRepeatableResearch, GenericResearch, getResearchEffect, repeatableResearchDecorator, RepeatableResearchOptions } from "./research";
import ResearchQueueVue from "./ResearchQueue.vue";
import ResearchTreeVue from "./ResearchTree.vue";

interface BuildingData {
    effect: (amount: Decimal) => any;
    cost: {
        free: Computable<boolean>;
        resource: Resource<DecimalSource>;
        multiplier: ProcessedComputable<DecimalSource>;
        base: ProcessedComputable<DecimalSource>;
    };
    display: {
        visibility?: Computable<Visibility | boolean>;
        title: CoercableComponent;
        description: CoercableComponent;
        effect: CoercableComponent;
    }
}

interface BuildingOptions extends RepeatableOptions, EffectFeatureOptions, BonusAmountFeatureOptions {};
type GenericBuilding = GenericRepeatable & GenericEffectFeature & GenericBonusAmountFeature;

export const id = "inflaton";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Inflatons";
    const color = "#ff5e13";

    const inflatons = createResource<DecimalSource>(0, "Inflatons");

    const conversionCost = computed(() => entangled.isFirstBranch(id) ? 1e6 : 1e50);
    const conversion = createClickable(() => ({
        canClick() {
            return Decimal.gte(unref(fome.amounts[FomeTypes.quantum]), unref(conversionCost));
        },
        display: jsx(() => (
            <>
                1 {inflatons.displayName}<br />
                <br />
                Requires: {format(unref(fome.amounts[FomeTypes.quantum]))} / {format(unref(conversionCost))} {fome.amounts[FomeTypes.quantum].displayName}
            </>
        )),
        onClick() {
            inflatons.value = Decimal.dOne;
            if (entangled.isFirstBranch(id)) entangled.branchOrder.value = id;
        },
        style: {
            width: 'fit-content',
            minHeight: '60px'
        }
    }));

    const inflate = createClickable(() => ({
        display: jsx(() => (
            <>
                INFLATE
            </>
        )),
        onClick() {
            if (unref(inflating)) endInflation();
            else startInflation();
        },
        style: {
            width: '150px',
            minHeight: '60px'
            
        }
    }));
    function startInflation() {
        inflating.value = true;
        inflatons.value = unref(research.instantInflation.researched)
            ? Decimal.reciprocate(unref(buildings.condenser.effect)).dividedBy(10).pow10()
            : Decimal.add(unref(inflatons), 1);
    };
    function endInflation() {
        inflating.value = false;
        inflatons.value = Decimal.min(unref(inflatons), unref(buildings.storage.effect));
    };

    const inflating = persistent<boolean>(false);
    const inflatonNerf = computed(() => {
        let log = Decimal.max(unref(inflatons), 1).log10();
        if (unref(inflating) || !unref(research.isolatedStorage.researched))
            log = log.times(1); // m-field condenser effect
        return log.pow_base(2);
    });
    const inflatonGain = computed(() => {
        let exponent = Decimal.max(unref(inflatons), 1).log10().plus(1).dividedBy(10);
        let gain = Decimal.times(unref(inflatons), exponent.pow_base(2));
        return gain.layer >= 3
            ? Decimal.fromComponents(gain.sign, gain.layer, gain.mag * 1.000000000000001)
            : gain
    });
    const fomeBonus = computed(() => {
        return unref(inflating)
            ? Decimal.dOne
            : Decimal.dOne.times(getResearchEffect(research.fomeGain))
                          .times(getResearchEffect(research.moreFomeGain))
                          .times(getResearchEffect(research.evenMoreFoamGain))
                        //   .times(getResearchEffect(repeatables.fome))
                          .min(unref(inflatonNerf));
    });
    this.on("postUpdate", diff => {
        if (unref(inflating)) {
            inflatons.value = Decimal.add(unref(inflatons), unref(inflatonGain).times(diff));
        }
        else if (Decimal.gt(unref(inflatons), unref(buildings.storage.effect))) {
            inflatons.value = unref(buildings.storage.effect);
        }
    });

    const currentSize = createResource(computed(() => {
        if (Decimal.lt(unref(inflatons), 1)) return Decimal.dZero;

        let size = Formula.constant(inflatons).max(2)
            .log2().log2()
            .times(getResearchEffect(research.doubleSize))
            .times(getResearchEffect(research.quadrupleSize))
            .times(1) // size repeatable effect
            .step(6.187e10, size => size.pow(0.1))
            .times(1) // top time square effect
            .div(1) // top timeline nerf
            .times(1) // top timeline bonus

        return size.evaluate();
    }), "planck lengths");
    const maxSize = trackBest(currentSize);
    const usedSize = persistent<DecimalSource>(0);

    const upgradeStyle = {
        width: '250px'
    };
    type Upgrades = 'subspaceBuildings' | 'research'
    const upgrades: Record<Upgrades, GenericUpgrade> = {
        subspaceBuildings: createUpgrade(() => ({
            display: {
                title: 'Subspatial Field Stabilizers',
                description: '<br/>Allow the creation of Subspatial Structures<br/>'
            },
            requirements: createCostRequirement(() => ({
                cost: () => entangled.isFirstBranch(id) ? new Decimal(5e13) : new Decimal(5e46),
                resource: noPersist(fome.amounts[FomeTypes.quantum])
            })),
            visibility() { return true },
            style: upgradeStyle
        })),
        research: createUpgrade(() => ({
            display: {
                title: 'Quantum Field Investigations',
                description: `<br/>Stabilization isn't enough. Maybe the constant bubbling of the quantum field may hold the secret to sustaining inflation<br/>`
            },
            requirements: createCostRequirement(() => ({
                cost: () => entangled.isFirstBranch(id) ? new Decimal(1e14) : new Decimal(1e47),
                resource: noPersist(fome.amounts[FomeTypes.quantum])
            })),
            visibility() { return unref(this.bought) || unref(upgrades.subspaceBuildings.bought) },
            style: upgradeStyle
        }))
    };

    const buildingStyle = computed(() => ({
        ...upgradeStyle,
        minHeight: '150px',
        borderBottomLeftRadius: unref(research.respecs.researched) ? 0 : undefined,
        borderBottomRightRadius: unref(research.respecs.researched) ? 0 : undefined,
    }));
    const buildingSize = computed(() => {
        return Decimal.times(getResearchEffect(research.biggerBuildings, {size: 1}).size, getResearchEffect(repeatables.buildingSize, {size: 1}).size)
    });
    const canBuild = computed(() => Decimal.minus(unref(maxSize), unref(usedSize)).gte(unref(buildingSize)));
    type Buildings = 'condenser' | 'lab' | 'storage'
    const buildings: Record<Buildings, GenericBuilding> = {
        condenser: createBuilding(() => ({
            effect(amount: Decimal) {
                return amount.times(getResearchEffect(research.quintupleCondenser))
                             .pow_base(0.975);
            },
            cost: {
                free: research.autobuild.researched,
                resource: noPersist(fome.amounts[FomeTypes.subspatial]),
                multiplier: computed(() => entangled.isFirstBranch(id) ? 1e30 : 1e82),
                base: 1.1
            },
            display: {
                visibility() { return unref(upgrades.subspaceBuildings.bought) },
                title: 'M-Field Condenser',
                description: 'Slightly reduce the loss of resources to Inflation',
                effect: jsx(() => <>{formatSmall(unref(buildings.condenser.effect))}x</>)
            }
        })),
        lab: createBuilding(() => ({
            effect(amount: Decimal) {
                return amount.times(unref(research.researchBoost.researched) ? Decimal.times(unref(research.researchBoost.effect), 0.9) : 1)
                             .times(1) // 1st abyssal pion buyable
            },
            cost: {
                free: research.autobuild.researched,
                resource: noPersist(fome.amounts[FomeTypes.subspatial]),
                multiplier: computed(() => entangled.isFirstBranch(id) ? 1e30 : 1e82),
                base: computed(() => unref(research.cheaperLabs.researched) ? 1.5 : 15)
            },
            display: {
                visibility() { return unref(upgrades.research.bought) },
                title: 'Quantum Flux Analyzer',
                description: 'Study fluctuations in the quantum field',
                effect: jsx(() => <>+{formatWhole(unref(buildings.lab.effect))} research points/s</>)
            }
        })),
        storage: createBuilding(() => ({
            effect(amount: Decimal) {
                return amount.times(getResearchEffect(research.improvedStorage, 1/3))
                             .pow_base(500);
            },
            cost: {
                free: research.autobuild.researched,
                resource: noPersist(fome.amounts[FomeTypes.quantum]),
                multiplier: computed(() => entangled.isFirstBranch(id) ? 1e15 : 1e48),
                base: 1.2
            },
            display: {
                visibility() { return unref(research.storage.researched) },
                title: 'Inflaton Containment Unit',
                description: 'Specialized storage facilities designed to keep Inflatons separated and inert',
                effect: jsx(() => <>Safely store up to {formatWhole(unref(buildings.storage.effect))} Inflatons</>)
            }
        }))
    };
    const respecStyle = {
        width: '125px',
        minHeight: '25px',
        borderRadius: 0
    };
    const respecButtons = Object.fromEntries(Object.entries(buildings).map(([id, building]) => [
        id,
        {
            one: createClickable(() => ({
                visibility() { return unref(research.respecs.researched) },
                canClick() { return Decimal.gt(unref(building.amount), 0) },
                display: { description: 'Sell One' },
                onClick() { building.amount.value = Decimal.minus(unref(building.amount), unref(buildingSize)).max(0) },
                style: computed(() => ({...respecStyle, borderBottomLeftRadius: 'var(--border-radius)'}))
            })) as GenericClickable,
            all: createClickable(() => ({
                visibility() { return unref(research.respecs.researched) },
                canClick() { return Decimal.gt(unref(building.amount), 0) },
                display: { description: 'Sell All' },
                onClick() { building.amount.value = Decimal.dZero },
                style: computed(() => ({...respecStyle, borderBottomRightRadius: 'var(--border-radius)'}))
            })) as GenericClickable
        }
    ])) as Record<Buildings, Record<'one' | 'all', GenericClickable>>;
    const respecAll = createClickable(() => ({
        canClick() { return Object.values(buildings).some(building => Decimal.gt(unref(building.amount), 0)) },
        display: { description: 'Sell All' },
        onClick() { for (const building of Object.values(buildings)) building.amount.value = Decimal.dZero },
        style: {...respecStyle, borderRadius: 'var(--border-radius)'}
    }));
    const buildingRenders = Object.fromEntries(Object.keys(buildings).map(id => [id, jsx(() => (
        <div class="col mergeAdjacent">
            {render(buildings[id as Buildings])}
            <div class="row mergeAdjacent">
                {render(respecButtons[id as Buildings].one)}
                {render(respecButtons[id as Buildings].all)}
            </div>
        </div>
    ))]));

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
        return Decimal.times(unref(buildings.lab.effect), getResearchEffect(research.researchBoost)).times(1) /* 1st abyssal pion buyable */
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
                        {renderRow(...Object.values(buildingRenders))}
                        <SpacerVue />
                        {render(respecAll)}
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
                            <ColumnVue mergeAdjacent={false}>
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
    
    function createBuilding(
        optionsFunc: OptionsFunc<BuildingData, BaseRepeatable, GenericBuilding>
    ): GenericBuilding {
        return createLazyProxy(() => {
            let building = optionsFunc();
            return createRepeatable<BuildingOptions>(function (this: GenericRepeatable) {
                return {
                    bonusAmount() { return Decimal.times(unref(this.amount), 0) }, // 3rd abyssal spinor buyable
                    visibility: building.display.visibility,
                    requirements: [
                        createBooleanRequirement(canBuild),
                        createCostRequirement(() => ({
                            cost: getBuildingCost(Formula.variable(this.amount), building.cost.multiplier, building.cost.base),
                            resource: building.cost.resource,
                            requiresPay: () => !unref(research.autobuild.researched)
                        }))
                    ],

                    effect() {
                        return building.effect(Decimal.add(unref(this.amount), unref(this.bonusAmount as ProcessedComputable<DecimalSource>))
                            .times(getResearchEffect(research.biggerBuildings, {effect: 1}).effect)
                            .times(unref(repeatables.buildingSize.effect).effect))
                    },
                    display: {
                        title: building.display.title,
                        description: building.display.description,
                        effectDisplay: building.display.effect
                    },
                    style: buildingStyle
                };
            }, effectDecorator, bonusAmountDecorator) as GenericBuilding;
        });
    }

    function getBuildingCost(amount: GenericFormula, multiplier: FormulaSource, base: FormulaSource) {
        return amount.div(unref(repeatables.buildingCost.effect))
                   .div(1) // 3rd abyssal pion buyable
                   .if(research.autobuild.researched,
                        (amount: GenericFormula) => amount.pow_base(base).times(multiplier),
                        (amount: GenericFormula) => {
                            const sizeMultiplier = Formula.pow(base, buildingSize).minus(1).times(multiplier);
                            const baseDivider = Formula.minus(base, 1);
                            return amount.pow_base(base).times(sizeMultiplier).dividedBy(baseDivider);
                       })
    }
})

export default layer;