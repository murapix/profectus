import projInfo from "data/projInfo.json";
import { BonusAmountFeatureOptions, GenericBonusAmountFeature, bonusAmountDecorator } from "features/decorators/bonusDecorator";
import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import { CoercableComponent, OptionsFunc, Visibility, jsx } from "features/feature";
import { BaseRepeatable, GenericRepeatable, RepeatableOptions, createRepeatable } from "features/repeatable";
import { Resource } from "features/resources/resource";
import { noPersist } from "game/persistence";
import { createBooleanRequirement, createCostRequirement, displayRequirements } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/break_eternity";
import { Computable, ProcessedComputable } from "util/computed";
import { coerceComponent } from "util/vue";
import { computed, unref } from "vue";
import { getResearchEffect } from "../inflaton/research";
import skyrmion from "../skyrmion/skyrmion";
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
    },
    size?: DecimalSource;
}

export interface BuildingOptions<T = DecimalSource> extends RepeatableOptions, EffectFeatureOptions<T>, BonusAmountFeatureOptions {}
export type GenericBuilding<T = DecimalSource> = GenericRepeatable & GenericEffectFeature<T> & GenericBonusAmountFeature & { size?: DecimalSource };

export function createBuilding<T = DecimalSource>(
    optionsFunc: OptionsFunc<BuildingData<T>, BaseRepeatable, GenericBuilding<T>>
): GenericBuilding<T> {
    return createRepeatable<BuildingOptions<T>>(repeatable => {
        const { effect, cost, display, size } = optionsFunc.call(repeatable, repeatable);
        cost.free ??= core.research.autobuild.researched;
        return {
            bonusAmount() { return Decimal.times(unref(this.amount), unref(skyrmion.spinor.upgrades.rho.effect)); },
            visibility: display.visibility,
            requirements: [
                createBooleanRequirement(canBuild(size ?? 1)),
                createCostRequirement(() => ({
                    cost() {
                        const multiplier = unref(cost.multiplier);
                        const base = new Decimal(unref(cost.base));
                        const amount = Decimal.div(unref(repeatable.amount), getResearchEffect(core.repeatables.buildingCost, 1))
                                              .div(unref(skyrmion.pion.upgrades.rho.effect));
                        const size = unref(buildingSize);
                        if (unref(core.research.autobuild.researched)) {
                            return base.pow(amount).times(multiplier);
                        }
                        return base.pow(size).minus(1).times(multiplier).times(base.pow(amount)).dividedBy(base.minus(1));
                    },
                    resource: noPersist(cost.resource),
                    requiresPay: () => !unref(cost.free),
                    cumulativeCost: false,
                    maxBulkAmount: buildingSize,
                    showCurrent: true
                }))
            ],
            onClick() {
                repeatable.amount.value = unref(buildingSize).minus(1).plus(unref(repeatable.amount));
            },
            effect() {
                return effect(effectiveAmount(this as GenericBuilding))
            },
            display: jsx(() => {
                const Title = coerceComponent(display.title, "h3");
                const Description = coerceComponent(display.description);
                const Effect = coerceComponent(display.effect);
                const building = repeatable as GenericBuilding;
                
                return <span>
                    <div><Title /></div>
                    <Description />
                    <div><br /><b>Size:</b> {formatLength(Decimal.times(unref(building.amount), building.size ?? 1), 0, projInfo.defaultDigitsShown)}
                        {Decimal.gt(unref(building.bonusAmount), 0) ? <> + {formatLength(Decimal.times(unref(building.bonusAmount), building.size ?? 1), 0, projInfo.defaultDigitsShown)}</> : undefined}
                    </div>
                    <div><br /><b>Currently:</b> <Effect/></div>
                    <div><br />{displayRequirements(building.requirements)}</div>
                </span>
            }),
            style: buildingStyle,
            size
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
function canBuild(sizeMultiplier: DecimalSource) {
    return computed(() => Decimal.minus(unref(buildings.maxSize), unref(buildings.usedSize)).gte(unref(buildingSize).times(sizeMultiplier)));
} 

function effectiveAmount(building: GenericBuilding): Decimal {
    return Decimal.times(unref(building.totalAmount), building.size ?? 1)
                  .times(getResearchEffect(core.research.biggerBuildings, { size: 1, effect: 1 }).effect)
                  .times(unref(core.repeatables.buildingSize.effect).effect)
}

export function formatLength(length: DecimalSource, precision: number = projInfo.defaultDigitsShown, largePrecision: number = precision) {
    length = new Decimal(length);
    if (length.lt(6.187e10)) return <>{format(length, precision)} ℓ<sub>P</sub></>;

    length = length.dividedBy(6.187e10);
    if (length.lt(1e3)) return `${format(length, largePrecision)} ym`;
    if (length.lt(1e6)) return `${format(length.dividedBy(1e3), largePrecision)} zm`;
    if (length.lt(1e9)) return `${format(length.dividedBy(1e6), largePrecision)} am`;
    if (length.lt(1e12)) return `${format(length.dividedBy(1e9), largePrecision)} fm`;
    if (length.lt(1e15)) return `${format(length.dividedBy(1e12), largePrecision)} pm`;
    if (length.lt(1e18)) return `${format(length.dividedBy(1e15), largePrecision)} nm`;
    if (length.lt(1e21)) return `${format(length.dividedBy(1e18), largePrecision)} μm`;
    if (length.lt(1e24)) return `${format(length.dividedBy(1e21), largePrecision)} mm`;
    if (length.lt(1e27)) return `${format(length.dividedBy(1e24), largePrecision)} m`;
    if (length.lt(1e30)) return `${format(length.dividedBy(1e27), largePrecision)} km`;
    if (length.lt(1e33)) return `${format(length.dividedBy(1e30), largePrecision)} Mm`;
    if (length.lt(1e36)) return `${format(length.dividedBy(1e33), largePrecision)} Gm`;
    if (length.lt(1e39)) return `${format(length.dividedBy(1e36), largePrecision)} Tm`;
    if (length.lt(1e42)) return `${format(length.dividedBy(1e39), largePrecision)} Pm`;
    if (length.lt(9.461e42)) return `${format(length.dividedBy(1e42), largePrecision)} ly`;
    if (length.lt(3.086e43)) return `${format(length.dividedBy(9.461e42), largePrecision)} pc`;
    if (length.lt(3.086e46)) return `${format(length.dividedBy(3.086e43), largePrecision)} kcp`;
    if (length.lt(3.086e49)) return `${format(length.dividedBy(3.086e46), largePrecision)} Mpc`;
    return `${format(length.dividedBy(3.086e49), largePrecision)} Gpc`;
}