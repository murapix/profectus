import projInfo from "data/projInfo.json";
import { Visibility } from "features/feature";
import { Resource } from "features/resources/resource";
import { noPersist, persistent } from "game/persistence";
import { createBooleanRequirement, createCostRequirement, displayRequirements } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/break_eternity";
import { computed, MaybeRef, MaybeRefOrGetter, Ref, ref, unref } from "vue";
import { getResearchEffect } from "../inflaton/research";
import skyrmion from "../skyrmion/skyrmion";
import buildings from "./buildings";
import core from "./coreResearch";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { render, Renderable } from "util/vue";
import { createRepeatable, Repeatable } from "features/clickables/repeatable";
import { createLazyProxy } from "util/proxies";

export interface BuildingData<T = DecimalSource> {
    effect: (amount: DecimalSource) => T;
    cost: {
        free?: MaybeRefOrGetter<boolean>;
        resource: Resource<DecimalSource>;
        multiplier: MaybeRef<DecimalSource>;
        base: MaybeRef<DecimalSource>;
    }
    display: {
        visibility?: MaybeRefOrGetter<Visibility | boolean>;
        title: Renderable;
        description: Renderable;
        effect: MaybeRef<Renderable>;
    },
    size?: DecimalSource;
}

export type Building<T = DecimalSource> = Repeatable & {
    effect: MaybeRef<T>,
    bonusAmount: MaybeRef<DecimalSource>,
    totalAmount: Ref<DecimalSource>,
    size?: DecimalSource
};

export function createBuilding<T = DecimalSource>(
    optionsFunc: () => BuildingData<T>
): Building<T> {
    return createLazyProxy(() => {
        const options = optionsFunc();
        const { effect, cost, display, size } = options;
        cost.free ??= core.research.autobuild.researched;

        const repeatable = createRepeatable(() => ({
            visibility: display.visibility,
            requirements: [
                createBooleanRequirement(canBuild(size ?? 1)),
                createCostRequirement(() => ({
                    cost(): Decimal {
                        const multiplier = unref(cost.multiplier);
                        const base = new Decimal(unref(cost.base));
                        const amount = Decimal.div(unref(building.amount), getResearchEffect<DecimalSource>(core.repeatables.buildingCost, 1))
                                              .div(unref(skyrmion.pion.upgrades.rho.effect));
                        const size = unref(buildingSize);
                        if (unref(core.research.autobuild.researched)) {
                            return base.pow(amount).times(multiplier);
                        }
                        return base.pow(size).minus(1).times(multiplier).times(base.pow(amount)).dividedBy(base.minus(1))
                    },
                    resource: noPersist(cost.resource),
                    requiresPay: () => !unref(cost.free),
                    cumulativeCost: false,
                    maxBulkAmount: buildingSize,
                    showCurrent: true
                }))
            ],
            onClick: () => building.amount.value = unref(buildingSize).minus(1).plus(unref(building.amount)),
            display: () => {
                const Title = <h3>{render(display.title)}</h3>;
                const Description = render(display.description);
                const Effect = render(unref(display.effect));
                
                return <span>
                    <div>{Title}</div>
                    {Description}
                    <div><br /><b>Size:</b> {formatLength(Decimal.times(unref(building.amount), building.size ?? 1), 0, projInfo.defaultDigitsShown)}
                        {Decimal.gt(unref(building.bonusAmount), 0) ? <> + {formatLength(Decimal.times(unref(building.bonusAmount), building.size ?? 1), 0, projInfo.defaultDigitsShown)}</> : undefined}
                    </div>
                    <div><br /><b>Currently:</b> {Effect}</div>
                    <div><br />{displayRequirements(building.requirements)}</div>
                </span>
            },
            style: buildingStyle
        }));
        const building = {
            ...repeatable,
            bonusAmount: computed((): Decimal => Decimal.times(unref(building.amount), unref(skyrmion.spinor.upgrades.rho.effect))),
            totalAmount: computed((): Decimal => Decimal.add(unref(building.amount), unref(building.bonusAmount))),
            effect: computed((): T => effect(effectiveAmount(building as Building<T>))),
            size
        } satisfies Building<T>;
        
        return building;
    });
}

const buildingStyle = computed(() => ({
    width: '250px',
    minHeight: '150px',
    borderBottomLeftRadius: unref(core.research.respecs.researched) ? 0 : 'var(--border-radius)',
    borderBottomRightRadius: unref(core.research.respecs.researched) ? 0 : 'var(--border-radius)',
}));

const buildingSizeModifiers = createSequentialModifier(() => [
    createMultiplicativeModifier(() => ({
        multiplier: 0.9,
        enabled: noPersist(core.research.smallerBuildings.researched),
        smallerIsBetter: true
    })),
    createMultiplicativeModifier(() => ({
        multiplier: () => unref(core.research.biggerBuildings.effect).size,
        enabled: noPersist(core.research.biggerBuildings.researched)
    })),
    createMultiplicativeModifier(() => ({
        multiplier: () => unref(core.repeatables.buildingSize.effect).size,
        enabled: () => Decimal.gt(unref(core.repeatables.buildingSize.amount), 0)
    }))
]);
export const buildingSize = computed(() => {
    return Decimal.ceil(buildingSizeModifiers.apply(1));
});
function canBuild(sizeMultiplier: DecimalSource) {
    return computed(() => Decimal.minus(unref(buildings.maxSize), unref(buildings.usedSize)).gte(unref(buildingSize).times(sizeMultiplier)));
} 

function effectiveAmount<T>(building: Building<T>): Decimal {
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