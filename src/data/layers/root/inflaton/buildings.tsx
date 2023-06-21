import { createLayer, BaseLayer } from "game/layers";
import { jsx } from "features/feature";
import inflaton from "./inflaton";
import { createResource, trackBest } from "features/resources/resource";
import { computed, unref } from "vue";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { getResearchEffect } from "../inflaton/research";
import { persistent } from "game/persistence";
import { createBuilding } from "./building";
import fome, { FomeTypes } from "../fome/fome";
import { formatSmall, formatWhole } from "util/break_eternity";
import entangled from "../entangled-old/entangled";
import { id as inflatonId } from "./inflaton";
import { GenericEffectFeature } from "features/decorators/common";
import { BaseRepeatable } from "features/repeatable";
import { GenericClickable, createClickable } from "features/clickables/clickable";
import { render, renderRow } from "util/vue";
import SpacerVue from "components/layout/Spacer.vue";
import core from "./coreResearch";

const id = "buildings";
const layer = createLayer(id, function (this: BaseLayer) {
    const currentSize = createResource(computed(() => {
        if (Decimal.lt(unref(inflaton.inflatons), 1)) return Decimal.dZero;

        let size = Decimal.clampMin(unref(inflaton.inflatons), 2)
                      .log2().log2()
                    //   .times(getResearchEffect(core.research.doubleSize, 1))
                    //   .times(getResearchEffect(core.research.quadrupleSize, 1))
                    //   .times(getResearchEffect(core.repeatables.universeSize, 1));
        if (size.gt(6.187e10)) size = size.pow(0.1);
        return size.times(1) // top time square effect
                   .div(1) // active top timeline nerf
                   .times(1) // passive top timeline bonus
    }));
    const maxSize = trackBest(currentSize);
    const usedSize = persistent<DecimalSource>(0);

    const buildings = (() => {
        const condenser = createBuilding(building => ({
            effect(amount) {
                return Decimal.times(amount, 1)//getResearchEffect(research.quintupleCondenser, 1))
                              .pow_base(0.975);
            },
            cost: {
                resource: fome[FomeTypes.subspatial].amount,
                base: 1.1,
                multiplier: computed(() => entangled.isFirstBranch(inflatonId) ? 1e30 : 1e82)
            },
            display: {
                visibility: inflaton.upgrades.subspaceBuildings.bought,
                title: 'M-Field Condenser',
                description: 'Slightly reduce the loss of resources to Inflation',
                effect: jsx(() => <>{formatSmall(unref((building as BaseRepeatable & GenericEffectFeature<DecimalSource>).effect))}</>)
            }
        }));
        const lab = createBuilding(building => ({
            effect(amount) {
                return (unref(core.research.researchBoost.researched)
                        ? Decimal.times(1/*getResearchEffect(core.research.researchBoost, 1)*/, 0.9)
                        : Decimal.dOne)
                        .times(amount)
                        .times(1) // 1st abyssal pion buyable
            },
            cost: {
                resource: fome[FomeTypes.subspatial].amount,
                base: computed(() => unref(core.research.cheaperLabs.researched) ? 1.5 : 15),
                multiplier: computed(() => entangled.isFirstBranch(inflatonId) ? 1e30 : 1e82)
            },
            display: {
                visibility: inflaton.upgrades.research.bought,
                title: 'Quantum Flux Analyzer',
                description: 'Study fluctuations in the quantum field',
                effect: jsx(() => <>+{formatWhole(unref((building as BaseRepeatable & GenericEffectFeature<DecimalSource>).effect))} research points/s</>)
            }
        }));
        const storage = createBuilding(building => ({
            effect(amount) {
                return Decimal.times(amount, 1)//getResearchEffect(core.research.improvedStorage, 1/3))
                              .pow_base(500);
            },
            cost: {
                resource: fome[FomeTypes.quantum].amount,
                base: 1.2,
                multiplier: computed(() => entangled.isFirstBranch(inflatonId) ? 1e15 : 1e48)
            },
            display: {
                visibility: core.research.storage.researched,
                title: 'Inflaton Containment Unit',
                description: 'Specialized storage facilities designed to keep Inflatons separated and inert',
                effect: jsx(() => <>Safely store up to {formatWhole(unref((building as BaseRepeatable & GenericEffectFeature<DecimalSource>).effect))} Inflatons</>)
            }
        }));

        return { condenser, lab, storage };
    })();

    const respecStyle = {
        width: '125px',
        minHeight: '25px',
        borderRadius: 0
    };
    const respecButtons = Object.fromEntries(Object.entries(buildings).map(([id, building]) => [
       id,
       {
        one: createClickable(() => ({
            visibility: core.research.respecs.researched,
            canClick() { return Decimal.gt(unref(building.amount), 0); },
            display: { description: 'Sell One' },
            onClick() { building.amount.value = Decimal.minus(building.amount.value, 1).clampMin(0); },
            style: {...respecStyle, borderBottomLeftRadius: 'var(--border-radius)'}
        })),
        all: createClickable(() => ({
            visibility: core.research.respecs.researched,
            canClick() { return Decimal.gt(unref(building.amount), 0); },
            display: { description: 'Sell All' },
            onClick() { building.amount.value = Decimal.dZero; },
            style: {...respecStyle, borderBottomRightRadius: 'var(--border-radius)'}
        }))
       }
    ])) as Record<keyof typeof buildings, Record<'one' | 'all', GenericClickable>>;

    const respecAll = createClickable(() => ({
        canClick() { return Object.values(buildings).some(building => Decimal.gt(unref(building.amount), 0)); },
        display: { description: 'Sell All' },
        onClick() {
            for (const building of Object.values(buildings)) {
                building.amount.value = Decimal.dZero;
            }
        },
        style: {...respecStyle, borderRadius: 'var(--border-radius)'}
    }));

    const buildingRenders = Object.fromEntries(Object.entries(buildings).map(([id, building]) => [id, jsx(() => (
        <div class="col mergeAdjacent">
            {render(building)}
            <div class="row mergeAdjacent">
                {render(respecButtons[id as keyof typeof buildings].one)}
                {render(respecButtons[id as keyof typeof buildings].all)}
            </div>
        </div>
    ))]));

    return {
        buildings,
        maxSize,
        usedSize,
        display: jsx(() => (
            <>
                {renderRow(...Object.values(buildingRenders))}
                <SpacerVue />
                {render(respecAll)}
            </>
        ))
    }
})

export default layer;