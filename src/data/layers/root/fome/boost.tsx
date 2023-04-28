import { CoercableComponent, OptionsFunc, Replace, getUniqueID } from "features/feature";
import { Persistent, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "util/bignum";
import { Computable, GetComputableType, ProcessedComputable, processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Ref, computed, unref } from "vue";
import fome, { FomeTypes } from "./fome";

export const BoostType = Symbol("Boost");

export interface BoostOptions {
    display: Computable<CoercableComponent>;
    effect: Computable<DecimalSource>;
    bonus?: Computable<DecimalSource>;
}

export interface BaseBoost {
    id: string;
    amount: Persistent<DecimalSource>;
    total: Ref<DecimalSource>;
    type: typeof BoostType;
}

export type Boost<T extends BoostOptions> = Replace<
    T & BaseBoost,
    {
        display: Ref<CoercableComponent>,
        effect: GetComputableType<T["effect"]>,
        bonus?: GetComputableType<T["bonus"]>
    }
>;

export type GenericBoost = Replace<
    Boost<BoostOptions>,
    {
        effect: ProcessedComputable<DecimalSource>;
        bonus?: ProcessedComputable<DecimalSource>;
    }
>;

export function createBoost<T extends BoostOptions>(
    optionsFunc: OptionsFunc<T, BaseBoost, GenericBoost>
): Boost<T> {
    const amount = persistent<DecimalSource>(0);
    return createLazyProxy<Boost<T>, Boost<T>>(feature => {
        const boost = optionsFunc.call(feature, feature);
        
        boost.id = getUniqueID("boost-");
        boost.type = BoostType;

        boost.amount = amount;

        processComputable(boost as T, "display");
        processComputable(boost as T, "effect");

        if (boost.bonus === undefined) {
            boost.bonus = 0;
        }
        processComputable(boost as T, "bonus");

        boost.total = computed(() => Decimal.add(unref(boost.amount!), unref(boost.bonus as ProcessedComputable<DecimalSource>)));

        return boost as unknown as Boost<T>;
    })
}

export function getFomeBoost(type: FomeTypes, index: 1|2|3|4|5) {
    return unref(fome[type].boosts[index].effect);
}