import { BonusAmountFeatureOptions, GenericBonusAmountFeature, bonusAmountDecorator } from "features/decorators/bonusDecorator";
import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import { CoercableComponent, OptionsFunc, Visibility } from "features/feature";
import { BaseRepeatable, GenericRepeatable, RepeatableOptions, createRepeatable } from "features/repeatable";
import { Resource, createResource } from "features/resources/resource";
import { createBooleanRequirement, createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { Computable, ProcessedComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { computed, unref } from "vue";
import { getResearchEffect } from "../inflaton/research";
import { FormulaSource, GenericFormula } from "game/formulas/types";
import Formula from "game/formulas/formulas";
import buildings from "./buildings";
import core from "./coreResearch";

export interface BuildingData<T = DecimalSource> {
    effect: (amount: DecimalSource) => T;
    cost: {
        free?: Computable<boolean>;
        resource: Resource<DecimalSource>;
        multiplier: ProcessedComputable<DecimalSource>;
        base: ProcessedComputable<DecimalSource>;
    }
    display: {
        visibility?: Computable<Visibility | boolean>;
        title: CoercableComponent;
        description: CoercableComponent;
        effect: CoercableComponent;
    }
}

export interface BuildingOptions<T = DecimalSource> extends RepeatableOptions, EffectFeatureOptions<T>, BonusAmountFeatureOptions {}
export type GenericBuilding<T = DecimalSource> = GenericRepeatable & GenericEffectFeature<T> & GenericBonusAmountFeature;

export function createBuilding<T = DecimalSource>(
    optionsFunc: OptionsFunc<BuildingData<T>, BaseRepeatable, GenericBuilding<T>>
): GenericBuilding<T> {
    return createRepeatable<BuildingOptions<T>>(repeatable => {
        let { effect, cost, display} = optionsFunc.call(repeatable, repeatable);
        cost.free ??= core.research.autobuild.researched;
        return {
            bonusAmount() { return Decimal.times(unref(this.amount), 0); }, // 3rd abyssal spinor buyable
            visibility: display.visibility,
            requirements: [
                createBooleanRequirement(canBuild),
                createCostRequirement(() => ({
                    cost() {
                        const multiplier = unref(cost.multiplier);
                        const base = new Decimal(unref(cost.base));
                        const amount = Decimal.div(unref(repeatable.amount), getResearchEffect(core.repeatables.buildingCost, 1))
                                              .div(1); // Pion Omicron effect
                        const size = unref(buildingSize);
                        if (unref(core.research.autobuild.researched)) {
                            return base.pow(amount).times(multiplier);
                        }
                        return base.pow(size).minus(1).times(multiplier).times(base.pow(amount)).dividedBy(base.minus(1));
                    },
                    resource: cost.resource,
                    requiresPay: () => !unref(cost.free),
                    cumulativeCost: false,
                    maxBulkAmount: buildingSize
                }))
            ],
            onClick() {
                repeatable.amount.value = unref(buildingSize).minus(1).plus(unref(repeatable.amount));
            },
            effect() {
                return effect(effectiveAmount(this as GenericBuilding))
            },
            display: {
                title: display.title,
                description: display.description,
                effectDisplay: display.effect
            },
            style: buildingStyle
        }
    }, effectDecorator, bonusAmountDecorator) as GenericBuilding<T>;
}

const buildingStyle = computed(() => ({
    width: '250px',
    minHeight: '150px',
    borderBottomLeftRadius: unref(core.research.respecs.researched) ? 0 : 'var(--border-radius)',
    borderBottomRightRadius: unref(core.research.respecs.researched) ? 0 : 'var(--border-radius)',
}));

export const buildingSize = computed(() => {
    return Decimal.times(getResearchEffect(core.research.biggerBuildings, {size: 1, effect: 1}).size, getResearchEffect(core.repeatables.buildingSize, {size: 1, effect: 1}).size)
});
const canBuild = computed(() => Decimal.minus(unref(buildings.maxSize), unref(buildings.usedSize)).gte(unref(buildingSize)));

function effectiveAmount(building: GenericBuilding): Decimal {
    return Decimal.times(unref(building.totalAmount),
                         getResearchEffect(core.research.biggerBuildings, { size: 1, effect: 1 }).effect)
                  .times(unref(core.repeatables.buildingSize.effect).effect)
}