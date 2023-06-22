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

export interface BuildingData {
    effect: (amount: DecimalSource) => DecimalSource;
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

export interface BuildingOptions extends RepeatableOptions, EffectFeatureOptions, BonusAmountFeatureOptions {}
export type GenericBuilding = GenericRepeatable & GenericEffectFeature<DecimalSource> & GenericBonusAmountFeature;

const availableSize = createResource(computed(() => Decimal.minus(unref(buildings.maxSize), unref(buildings.usedSize))));
export function createBuilding(
    optionsFunc: OptionsFunc<BuildingData, BaseRepeatable, GenericBuilding>
): GenericBuilding {
    return createRepeatable<BuildingOptions>(repeatable => {
        let { effect, cost, display} = optionsFunc.call(repeatable, repeatable);
        cost.free ??= core.research.autobuild.researched;
        return {
            bonusAmount() { return Decimal.times(unref(this.amount), 0); }, // 3rd abyssal spinor buyable
            visibility: display.visibility,
            requirements: [
                createCostRequirement(() => ({
                    cost: buildingSize,
                    resource: availableSize,
                    visibility: Visibility.None
                })),
                createCostRequirement(() => ({
                    cost: getBuildingCost(Formula.variable(repeatable.amount), cost.multiplier, cost.base),
                    resource: cost.resource,
                    requiresPay: () => !unref(cost.free)
                }))
            ],
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
    }, effectDecorator, bonusAmountDecorator) as GenericBuilding;
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

function getBuildingCost(amount: GenericFormula, multiplier: FormulaSource, base: FormulaSource) {
    return amount.div(getResearchEffect(core.repeatables.buildingCost, 1))
                 .div(1) // Pion Omicron effect
                 .pow_base(base).times(multiplier)
                 .if(core.research.autobuild.researched,
                    amount => amount,
                    amount => amount.times(Formula.pow(base, buildingSize).minus(1)).dividedBy(Formula.minus(base, 1))
                 )
}