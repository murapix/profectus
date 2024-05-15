import projInfo from "data/projInfo.json";
import Toggle from "components/fields/Toggle.vue";
import Column from "components/layout/Column.vue";
import Spacer from "components/layout/Spacer.vue";
import { GenericClickable, createClickable } from "features/clickables/clickable";
import { GenericEffectFeature } from "features/decorators/common";
import { isVisible, jsx } from "features/feature";
import { BaseRepeatable } from "features/repeatable";
import { Resource, createResource, trackBest } from "features/resources/resource";
import { BaseLayer, createLayer } from "game/layers";
import { noPersist, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatSmall, formatWhole } from "util/break_eternity";
import { render, renderRow } from "util/vue";
import { computed, unref } from "vue";
import entangled from "../entangled/entangled";
import fome, { FomeTypes } from "../fome/fome";
import { getResearchEffect } from "../inflaton/research";
import timecube from "../timecube/timecube";
import timelines from "../timecube/timelines";
import { Sides } from "../timecube/timesquares";
import { GenericBuilding, buildingSize, createBuilding, formatLength } from "./building";
import { default as core, default as coreResearch } from "./coreResearch";
import inflaton, { id as inflatonId } from "./inflaton";

const id = "buildings";
const layer = createLayer(id, function (this: BaseLayer) {
    
    const buildings = (() => {
        const condenser = createBuilding(building => ({
            effect(amount) {
                return Decimal.times(amount, getResearchEffect(core.research.quintupleCondenser, 1))
                              .pow_base(0.975);
            },
            cost: {
                resource: noPersist(fome[FomeTypes.subspatial].amount),
                base: 1.1,
                multiplier: computed(() => entangled.isFirstBranch(inflatonId) ? 1e21 : 1e99)
            },
            display: {
                visibility: noPersist(inflaton.upgrades.subspaceBuildings.bought),
                title: 'M-Field Condenser',
                description: 'Slightly reduce the loss of resources to Inflation',
                effect: jsx(() => <>{formatSmall(unref((building as BaseRepeatable & GenericEffectFeature<DecimalSource>).effect))}</>)
            }
        })) as GenericBuilding;
        const lab = createBuilding(() => ({
            effect: amount => amount,
            cost: {
                resource: noPersist(fome[FomeTypes.subspatial].amount),
                base: computed(() => unref(core.research.cheaperLabs.researched) ? 1.5 : 15),
                multiplier: computed(() => entangled.isFirstBranch(inflatonId) ? 1e21 : 1e99)
            },
            display: {
                visibility: noPersist(inflaton.upgrades.research.bought),
                title: 'Quantum Flux Analyzer',
                description: 'Study fluctuations in the quantum field',
                effect: jsx(() => <>+{formatWhole(unref(coreResearch.researchGain))} research points/s</>)
            }
        })) as GenericBuilding;
        const storage = createBuilding(building => ({
            effect(amount) {
                return Decimal.times(amount, getResearchEffect(core.research.improvedStorage, 1/3))
                              .pow_base(500);
            },
            cost: {
                resource: noPersist(fome[FomeTypes.quantum].amount),
                base: 1.2,
                multiplier: computed(() => entangled.isFirstBranch(inflatonId) ? 1e9 : 1e59)
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
                const gain = Decimal.times(amount, 0.01).plus(1);
                const cost = new Decimal(amount);
                const capacity = unref(coreResearch.researchGain);
                if (cost.gt(capacity)) {
                    return { gain: gain.times(capacity).dividedBy(cost), cost: capacity }
                }
                return { gain, cost }
            },
            cost: {
                resource: noPersist(fome[FomeTypes.subspatial].amount),
                base: 1.5,
                multiplier: computed(() => entangled.isFirstBranch(inflatonId) ? 1e40 : 1e109)
            },
            display: {
                visibility: core.research.inflationResearch.researched,
                title: 'Active Redistribution Center',
                description: 'Tune your M-field Condensers with continuous analysis of inflation patterns',
                effect: jsx(() => <>{format(unref((building as BaseRepeatable & GenericEffectFeature<{gain: DecimalSource}>).effect).gain)}×<br/><b>Consumes:</b> {format(unref((building as BaseRepeatable & GenericEffectFeature<{cost: DecimalSource}>).effect).cost)} Research/s</>)
            }
        })) as GenericBuilding<{gain: DecimalSource, cost: DecimalSource}>;

        return { condenser, lab, storage, tuner };
    })();

    const currentSize: Resource<Decimal> = createResource(computed(() => {
        if (Decimal.lt(unref(inflaton.inflatons), 1)) return Decimal.dZero;

        let size = Decimal.clampMin(unref(inflaton.inflatons), 2)
                      .log2().log2()
                      .times(getResearchEffect(core.research.doubleSize, 1))
                      .times(getResearchEffect(core.research.quadrupleSize, 1))
                      .times(getResearchEffect(core.repeatables.universeSize, 1));
        const softcap = 6.187e10;
        if (size.gt(softcap)) {
            size = size.pow(0.1).times(Decimal.dOne.minus(0.1).pow_base(softcap));
        }
        return size.times(unref(timecube.getTimesquareEffect(Sides.TOP)))
                   .div(unref(timelines.nerfs[Sides.TOP]))
                   .times(unref(timelines.buffs[Sides.TOP]))
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
        currentSize,
        maxSize,
        usedSize,
        autoBuilding,
        display: jsx(() => (
            <>
                <div>Your buildings are taking up {formatLength(unref(usedSize), 0, projInfo.defaultDigitsShown)} / {formatLength(Decimal.floor(unref(maxSize)), 0, projInfo.defaultDigitsShown)}</div>
                <Spacer />
                {renderRow(...Object.values(buildingRenders))}
                <Spacer />
                {unref(core.research.autobuild.researched)
                    ? <>
                        <Column>
                            <span style={{fontSize: "12px"}}>Enable Auto-Building Construction</span>
                            <Toggle v-model={autoBuilding.value} style={{marginTop: 0}}/>
                        </Column>
                    </>
                    : undefined
                }
                {render(respecAll)}
            </>
        ))
    }
});

export default layer;