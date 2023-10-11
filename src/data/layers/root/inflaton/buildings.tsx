import { createLayer, BaseLayer } from "game/layers";
import { isVisible, jsx } from "features/feature";
import inflaton from "./inflaton";
import { createResource, trackBest } from "features/resources/resource";
import { computed, unref } from "vue";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { getResearchEffect } from "../inflaton/research";
import { GenericBuilding, buildingSize, createBuilding, formatLength } from "./building";
import fome, { FomeTypes } from "../fome/fome";
import { format, formatSmall, formatWhole } from "util/break_eternity";
import entangled from "../entangled/entangled";
import { id as inflatonId } from "./inflaton";
import { GenericEffectFeature } from "features/decorators/common";
import { BaseRepeatable } from "features/repeatable";
import { GenericClickable, createClickable } from "features/clickables/clickable";
import { render, renderRow } from "util/vue";
import SpacerVue from "components/layout/Spacer.vue";
import core from "./coreResearch";
import coreResearch from "./coreResearch";
import ToggleVue from "components/fields/Toggle.vue";
import { persistent } from "game/persistence";
import ColumnVue from "components/layout/Column.vue";

const id = "buildings";
const layer = createLayer(id, function (this: BaseLayer) {
    const buildings = (() => {
        const condenser = createBuilding(building => ({
            effect(amount) {
                return Decimal.times(amount, getResearchEffect(core.research.quintupleCondenser, 1))
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
        })) as GenericBuilding;
        const lab = createBuilding(building => ({
            effect(amount) {
                return (unref(core.research.researchBoost.researched)
                        ? Decimal.times(unref(core.research.researchBoost.effect), 0.9)
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
        })) as GenericBuilding;
        const storage = createBuilding(building => ({
            effect(amount) {
                return Decimal.times(amount, getResearchEffect(core.research.improvedStorage, 1/3))
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
            },
            size: 3
        })) as GenericBuilding;
        const tuner = createBuilding<{gain: DecimalSource, cost: DecimalSource}>(building => ({
            effect(amount) {
                let gain = Decimal.times(amount, 0.01).plus(1);
                let cost = new Decimal(amount);
                let capacity = unref(coreResearch.researchGain);
                if (cost.gt(capacity)) {
                    return { gain: gain.times(capacity).dividedBy(cost), cost: capacity }
                }
                return { gain, cost }
            },
            cost: {
                resource: fome[FomeTypes.subspatial].amount,
                base: 1.5,
                multiplier: computed(() => entangled.isFirstBranch(inflatonId) ? 1e40 : 1e92)
            },
            display: {
                visibility: core.research.inflationResearch.researched,
                title: 'Active Redistribution Center',
                description: 'Tune your M-field Condensers with continuous analysis of inflation patterns',
                effect: jsx(() => <>{format(unref((building as BaseRepeatable & GenericEffectFeature<{gain: DecimalSource}>).effect).gain)}x<br/><b>Consumes:</b> {format(unref((building as BaseRepeatable & GenericEffectFeature<{cost: DecimalSource}>).effect).cost)} Research/s</>)
            }
        })) as GenericBuilding<{gain: DecimalSource, cost: DecimalSource}>;

        return { condenser, lab, storage, tuner };
    })();

    const currentSize = createResource(computed(() => {
        if (Decimal.lt(unref(inflaton.inflatons), 1)) return Decimal.dZero;

        let size = Decimal.clampMin(unref(inflaton.inflatons), 2)
                      .log2().log2()
                      .times(getResearchEffect(core.research.doubleSize, 1))
                      .times(getResearchEffect(core.research.quadrupleSize, 1))
                      .times(getResearchEffect(core.repeatables.universeSize, 1));
        if (size.gt(6.187e10)) size = size.pow(0.1);
        return size.times(1) // top time square effect
                   .div(1) // active top timeline nerf
                   .times(1) // passive top timeline bonus
    }));
    const maxSize = trackBest(currentSize);
    const usedSize = computed(() => Object.values(buildings)
                                          .map(building => Decimal.times(unref(building.amount), building.size ?? 1))
                                          .reduce((current, next) => current.plus(next), Decimal.dZero));

    const respecStyle = {
        width: '125px',
        minHeight: '25px',
        borderRadius: 0
    };
    const respecButtons = Object.fromEntries(Object.entries(buildings).map(([id, building]) => [
      id,
      {
        one: createClickable(() => ({
            visibility: building.visibility,
            canClick() { return Decimal.gt(unref(building.amount), 0); },
            display: { description: 'Sell One' },
            onClick() { building.amount.value = Decimal.minus(building.amount.value, unref(buildingSize)).clampMin(0); },
            style: {...respecStyle, borderBottomLeftRadius: 'var(--border-radius)'}
        })),
        all: createClickable(() => ({
            visibility: building.visibility,
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

    const autoBuilding = persistent<boolean>(false);
    inflaton.on("update", () => {
        if (!unref(autoBuilding)) return;
        for (const building of Object.values(buildings)) {
            if (!isVisible(building.visibility)) continue;
            if (!unref(building.canClick)) continue;
            building.onClick();
        }
    });

    const buildingRenders = Object.fromEntries(Object.entries(buildings).map(([id, building]) => [id, jsx(() => {
        if (isVisible(building.visibility)) {
            return <div class="col mergeAdjacent">
                {render(building)}
                {unref(core.research.respecs.researched)
                    ? <div class="row mergeAdjacent">
                        {render(respecButtons[id as keyof typeof buildings].one)}
                        {render(respecButtons[id as keyof typeof buildings].all)}
                    </div>
                    : undefined}
            </div>
        }
        return <span />;
    })]));

    return {
        buildings,
        maxSize,
        usedSize,
        autoBuilding,
        display: jsx(() => (
            <>
                <div>Your buildings are taking up {formatLength(unref(usedSize), 0)} / {formatLength(Decimal.floor(unref(maxSize)), 0)}</div>
                <SpacerVue />
                {renderRow(...Object.values(buildingRenders))}
                <SpacerVue />
                {unref(core.research.autobuild.researched)
                    ? <>
                        <ColumnVue>
                            <span style={{fontSize: "12px"}}>Enable Auto-Building Construction</span>
                            <ToggleVue v-model={autoBuilding.value} style={{marginTop: 0}}/>
                        </ColumnVue>
                    </>
                    : undefined
                }
                {render(respecAll)}
            </>
        ))
    }
});

export default layer;