import NamedResource from "features/resources/NamedResource.vue";
import { Resource } from "features/resources/resource";
import { CostRequirement, createBooleanRequirement, createCostRequirement, payRequirements, requirementsMet } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/break_eternity";
import { createLazyProxy } from "util/proxies";
import { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref, computed, unref } from "vue";
import TimesquareComponent from "./TimesquareComponent.vue";
import timecube from "./timecube";
import timelines from "./timelines";
import { Sides } from "./timesquares";
import { Renderable, trackHover, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { MaybeGetter, processGetter } from "util/computed";
import { createRepeatable, Repeatable } from "features/clickables/repeatable";
import { Clickable, createClickable } from "features/clickables/clickable";
import { effectMixin } from "mixins/effects";

export const TimesquareType = Symbol("Timesquare");

export interface TimesquareOptions<T = Decimal> extends VueFeatureOptions {
    display: MaybeGetter<Renderable> |
    {
        title: MaybeGetter<Renderable>;
        effect: MaybeGetter<Renderable>;
    };
    buyAmount: MaybeRefOrGetter<DecimalSource>;
    baseCost: MaybeGetter<DecimalSource>;
    resource: Resource;
    effect: MaybeGetter<T>;
    nextEffect: MaybeGetter<T>;
}

export interface Timesquare<T = Decimal> extends VueFeature {
    square: Repeatable & { effect: MaybeRef<T>, nextEffect: MaybeRef<T> };
    buy: Clickable;
    buyNext: Clickable;
    buyMax: Clickable;
    toBuy: ComputedRef<DecimalSource>;
    hovering: {
        buy: Ref<boolean>;
        buyNext: Ref<boolean>;
        buyMax: Ref<boolean>;
    }
};

export function createTimesquare<T = Decimal, U extends TimesquareOptions<T> = TimesquareOptions<T>>(
    side: Sides,
    optionsFunc: () => U
) {
    return createLazyProxy(() => {
        const options = optionsFunc()
        const { display, buyAmount, baseCost, resource, effect, nextEffect } = options;

        const baseSquareCost = processGetter(baseCost);
        const _buyAmount = processGetter(buyAmount);
        const baseCostFactor = computed(() => Decimal.dOne.plus(unref(timecube.upgrades.title.bought) ? unref(timelines.scores[side]) : 0).reciprocate().times(unref(baseSquareCost)));

        type SquareBuyRequirement = { buyAmount: MaybeRef<DecimalSource>, cost: CostRequirement }
        const requirements = (() => {
            const buy = { buyAmount: _buyAmount };
            const buyNext = { buyAmount: computed(() => {
                const amount = unref(square.amount);
                const scale = Decimal.clampMin(amount, 1).log10().floor().pow10();
                const mult = Decimal.div(amount, scale).plus(1e-7).floor();
                const totalAmount = mult.plus(1).times(scale);
                return totalAmount.minus(amount);
            }) };
            const buyMax = { buyAmount: computed(() => {
                const amount = unref(square.amount);
                const currentCost = Decimal.add(amount, 1).times(amount).div(2).times(unref(baseCostFactor));
                const totalCost = Decimal.clampMin(unref(resource), 1).plus(currentCost);
                const totalAmount = totalCost.div(unref(baseCostFactor)).times(8).plus(1).sqrt().minus(1).div(2).floor();
                return totalAmount.minus(amount);
            })};

            for (const buyLevel of [buy, buyNext, buyMax] as SquareBuyRequirement[]) {
                buyLevel.cost = createCostRequirement(() => ({
                    cost() {
                        const amount = unref(square.amount);
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

        const square = createRepeatable(() => ({
            requirements: createBooleanRequirement(false),
            display,
            ...effectMixin(effect, nextEffect)
        })) as Timesquare["square"];
        const buy = createClickable(() => ({
            canClick: () => requirementsMet(requirements.buy.cost),
            display: {
                title: 'Buy',
                description: () => <>+{format(unref(requirements.buy.buyAmount))}: <NamedResource resource={resource} override={unref(requirements.buy.cost.cost) as DecimalSource} /></>
            },
            onClick() {
                const boughtAmount = unref(requirements.buy.buyAmount);
                payRequirements(requirements.buy.cost);
                square.amount.value = Decimal.add(unref(square.amount), boughtAmount);
            }
        }));
        const buyNext = createClickable(() => ({
            canClick: () => requirementsMet(requirements.buyNext.cost),
            display: {
                title: 'Buy Next',
                description: () => <>+{format(unref(requirements.buyNext.buyAmount))}: <NamedResource resource={resource} override={unref(requirements.buyNext.cost.cost) as DecimalSource} /></>
            },
            onClick() {
                const boughtAmount = unref(requirements.buyNext.buyAmount);
                payRequirements(requirements.buyNext.cost);
                square.amount.value = Decimal.add(unref(square.amount), boughtAmount);
            }
        }));
        const buyMax = createClickable(() => ({
            canClick: () => requirementsMet(requirements.buyMax.cost),
            display: {
                title: 'Buy Max',
                description: () => <>+{format(unref(requirements.buyMax.buyAmount))}: <NamedResource resource={resource} override={unref(requirements.buyMax.cost.cost) as DecimalSource} /></>
            },
            onClick() {
                const boughtAmount = unref(requirements.buyMax.buyAmount);
                payRequirements(requirements.buyMax.cost);
                square.amount.value = Decimal.add(unref(square.amount), boughtAmount);
            }
        }));
        const hovering = (() => {
            const _buy = trackHover(buy);
            const _buyNext = trackHover(buyNext);
            const _buyMax = trackHover(buyMax);

            return { buy: _buy, buyNext: _buyNext, buyMax: _buyMax }
        })();
        const toBuy = computed(() => {
            if (unref(hovering.buyMax)) return unref(requirements.buyMax.buyAmount);
            if (unref(hovering.buyNext)) return unref(requirements.buyNext.buyAmount);
            if (unref(hovering.buy)) return unref(requirements.buy.buyAmount);
            return 0;
        });

        const timesquare = {
            square,
            buy,
            buyNext,
            buyMax,
            hovering,
            toBuy,
            ...vueFeatureMixin("timesquare", options, () => <TimesquareComponent
                square={square}
                buy={buy}
                buyNext={buyNext}
                buyMax={buyMax}
            />)
        }

        return timesquare;
    });
}