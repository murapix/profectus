import { Persistent, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "util/bignum";
import { createLazyProxy } from "util/proxies";
import { MaybeRef, MaybeRefOrGetter, Ref, computed, unref } from "vue";
import fome, { FomeTypes } from "./fome";
import { Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { processGetter } from "util/computed";

export const BoostType = Symbol("Boost");

export interface BoostOptions extends VueFeatureOptions {
    display: MaybeRefOrGetter<Renderable>;
    effect: MaybeRefOrGetter<DecimalSource>;
    bonus?: MaybeRefOrGetter<DecimalSource>;
}

export interface Boost extends VueFeature {
    display: MaybeRef<Renderable>;
    effect: MaybeRef<DecimalSource>;
    bonus: MaybeRef<DecimalSource>;
    amount: Persistent<DecimalSource>;
    total: Ref<DecimalSource>;
}

export function createBoost<T extends BoostOptions>(
    optionsFunc: () => T
) {
    const amount = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const options = optionsFunc();
        const { display, effect } = options;
        const bonus = processGetter(options.bonus);
        
        const vueFeature = vueFeatureMixin("boost", options);

        const total = computed(() => Decimal.add(unref(amount), unref(bonus ?? 0)));

        const boost = {
            display: processGetter(display),
            effect: processGetter(effect),
            bonus: bonus ?? 0,
            amount,
            total,
            ...vueFeature
        } satisfies Boost;

        return boost;
    })
}

export function getFomeBoost(type: FomeTypes, index: 1|2|3|4|5) {
    return unref(fome[type].boosts[index].effect);
}