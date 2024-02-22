import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import { Computable, ProcessedComputable, convertComputable } from "util/computed";
import { CoercableComponent, Component, GatherProps, GenericComponent, OptionsFunc, jsx } from "features/feature";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { createLazyProxy } from "util/proxies";
import { createClickable, GenericClickable } from "features/clickables/clickable"
import { GenericRepeatable, RepeatableOptions, createRepeatable } from "features/repeatable";
import { computed, unref } from "vue";
import { CostRequirement, createBooleanRequirement, createCostRequirement, requirementsMet, payRequirements } from "game/requirements";
import { Resource } from "features/resources/resource";
import { format, formatWhole } from "util/break_eternity";
import TimesquareComponent from "./TimesquareComponent.vue";
import { Sides } from "./timesquares";
import timelines from "./timelines";
import timecube from "./timecube";
import NamedResource from "features/resources/NamedResource.vue";

export const TimesquareType = Symbol("Timesquare");

export interface TimesquareOptions<T = Decimal> extends EffectFeatureOptions<T> {
    display: Computable<CoercableComponent |
        {
            title: CoercableComponent;
            effect: CoercableComponent;
        }
    >;
    buyAmount: Computable<DecimalSource>;
    baseCost: Computable<DecimalSource>;
    resource: Resource;
    effect: Computable<T>;
}

export type Timesquare<T = Decimal> = {
    square: GenericRepeatable & GenericEffectFeature<T>;
    buy: GenericClickable;
    buyNext: GenericClickable;
    buyMax: GenericClickable;
    type: typeof TimesquareType;
    [Component]: GenericComponent;
    [GatherProps]: () => Record<string, unknown>;
};

export function createTimesquare<T = Decimal>(
    side: Sides,
    optionsFunc: OptionsFunc<TimesquareOptions<T>, Timesquare<T>, Timesquare<T>>
): Timesquare<T> {
    return createLazyProxy<Timesquare<T>, Timesquare<T>>(timesquare => {
        const { display, buyAmount, baseCost, resource, effect } = optionsFunc.call(timesquare, timesquare);

        const baseSquareCost = convertComputable(baseCost);
        const toBuy = convertComputable(buyAmount);
        const baseCostFactor = computed(() => Decimal.dOne.plus(unref(timecube.upgrades.title.bought) ? unref(timelines.scores[side]) : 0).reciprocate().times(unref(baseSquareCost)));

        type SquareBuyRequirement = { buyAmount: ProcessedComputable<DecimalSource>, cost: CostRequirement }
        const requirements = (() => {
            const buy = { buyAmount: toBuy };
            const buyNext = { buyAmount: computed(() => {
                const amount = unref(timesquare.square.amount);
                const scale = Decimal.clampMin(amount, 1).log10().floor().pow10();
                const mult = Decimal.div(amount, scale).floor();
                const totalAmount = mult.plus(1).times(scale);
                return totalAmount.minus(amount);
            }) };
            const buyMax = { buyAmount: computed(() => {
                const amount = unref(timesquare.square.amount);
                const currentCost = Decimal.add(amount, 1).times(amount).div(2).times(unref(baseCostFactor));
                const totalCost = Decimal.clampMin(unref(resource), 1).plus(currentCost);
                const totalAmount = totalCost.div(unref(baseCostFactor)).times(8).plus(1).sqrt().minus(1).div(2).floor();
                return totalAmount.minus(amount);
            })};

            for (const buyLevel of [buy, buyNext, buyMax] as SquareBuyRequirement[]) {
                buyLevel.cost = createCostRequirement(() => ({
                    cost() {
                        const amount = unref(timesquare.square.amount);
                        const totalAmount = Decimal.add(amount, unref(buyLevel.buyAmount));
                        const totalCost = totalAmount.plus(1).times(totalAmount).div(2);
                        const currentCost = Decimal.add(amount, 1).times(amount).div(2);
                        return totalCost.minus(currentCost).times(unref(baseCostFactor));
                    },
                    resource
                }));
            }
            
            return {
                buy: buy as unknown as SquareBuyRequirement,
                buyNext: buyNext as unknown as SquareBuyRequirement,
                buyMax: buyMax as unknown as SquareBuyRequirement
            };
        })();

        timesquare.square = createRepeatable<RepeatableOptions & EffectFeatureOptions<T>>(() => ({
            requirements: createBooleanRequirement(false),
            display,
            effect
        }), effectDecorator) as GenericRepeatable & GenericEffectFeature<T>;
        timesquare.buy = createClickable(() => ({
            canClick: () => requirementsMet(requirements.buy.cost),
            display: {
                title: 'Buy',
                description: jsx(() => <>+{format(unref(requirements.buy.buyAmount))}: <NamedResource resource={resource} override={unref(requirements.buy.cost.cost) as DecimalSource} /></>)
            },
            onClick() {
                const boughtAmount = unref(requirements.buy.buyAmount);
                payRequirements(requirements.buy.cost);
                timesquare.square.amount.value = Decimal.add(unref(timesquare.square.amount), boughtAmount);
            }
        }));
        timesquare.buyNext = createClickable(() => ({
            canClick: () => requirementsMet(requirements.buyNext.cost),
            display: {
                title: 'Buy Next',
                description: jsx(() => <>+{format(unref(requirements.buyNext.buyAmount))}: <NamedResource resource={resource} override={unref(requirements.buyNext.cost.cost) as DecimalSource} /></>)
            },
            onClick() {
                const boughtAmount = unref(requirements.buyNext.buyAmount);
                payRequirements(requirements.buyNext.cost);
                timesquare.square.amount.value = Decimal.add(unref(timesquare.square.amount), boughtAmount);
            }
        }))
        timesquare.buyMax = createClickable(() => ({
            canClick: () => requirementsMet(requirements.buyMax.cost),
            display: {
                title: 'Buy Max',
                description: jsx(() => <>+{format(unref(requirements.buyMax.buyAmount))}: <NamedResource resource={resource} override={unref(requirements.buyMax.cost.cost) as DecimalSource} /></>)
            },
            onClick() {
                const boughtAmount = unref(requirements.buyMax.buyAmount);
                payRequirements(requirements.buyMax.cost);
                timesquare.square.amount.value = Decimal.add(unref(timesquare.square.amount), boughtAmount);
            }
        }));

        timesquare.type = TimesquareType;
        timesquare[Component] = TimesquareComponent as GenericComponent;
        timesquare[GatherProps] = function (this: Timesquare<T>) {
            const {
                square,
                buy,
                buyNext,
                buyMax
            } = this;
            return {
                square,
                buy,
                buyNext,
                buyMax
            }
        }

        return timesquare;
    });
}