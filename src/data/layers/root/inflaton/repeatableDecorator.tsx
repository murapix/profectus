import { Persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/break_eternity";
import { isFunction } from "util/common";
import { MaybeRef, MaybeRefOrGetter, Ref, computed, isRef, unref } from "vue";
import { Research, ResearchOptions } from "./research";
import { effectMixin } from "mixins/effects";
import { processGetter } from "util/computed";
import { isJSXElement } from "util/vue";

export interface RepeatableResearchOptions<T = unknown> extends ResearchOptions {
    limit?: MaybeRefOrGetter<DecimalSource>;
    effect: MaybeRefOrGetter<T>;
}

export interface RepeatableResearch<T = unknown> extends Research {
    effect: MaybeRef<T>;
    amount: Persistent<DecimalSource>;
    limit: MaybeRef<DecimalSource>;
    maxed: Ref<boolean>;
}

export function repeatableResearchWrapper<T = unknown>(repeatableData: {
    research: Ref<RepeatableResearch<T>>;
    canResearch?: MaybeRefOrGetter<boolean>;
    onResearch?: VoidFunction;
    display: ResearchOptions["display"];
    effect: MaybeRefOrGetter<T>;
    limit?: MaybeRefOrGetter<DecimalSource>;
}) {
    const { research, canResearch, onResearch, display, effect, limit } = repeatableData;

    (() => {
        if (isRef(display)) return;
        if (isFunction(display)) return;
        if (isJSXElement(display)) return;
        if (typeof display === 'string') return;
        
        const oldTitle = processGetter(display.title);
        display.title = () => <h3>Repeatable: {unref(oldTitle)} {formatRoman(Decimal.add(unref(research.value.amount ?? 0), 1))}</h3>;
    })();

    const processedCanResearch = processGetter(canResearch);
    const _canResearch = computed(() => {
        if (unref(research.value.maxed)) return false;
        return unref(processedCanResearch) ?? true;
    })

    return {
        canResearch: _canResearch,
        onResearch: () => {
            onResearch?.();
            research.value.amount.value = Decimal.add(unref(research.value.amount), 1);
            research.value.progress.value = 0;
        },
        display,
        ...effectMixin(effect),
        limit: processGetter(limit ?? 3998),
        maxed: computed(() => Decimal.gte(
            unref(research.value.amount),
            unref(research.value.limit)
        )),
        researched: computed(() => Decimal.gt(unref(research.value.amount), 0)),
    }
}

export function formatRoman(value: DecimalSource) {
    const romanNumerals: [number, string][] = [
        [1, 'I'], [4, 'IV'], [5, 'V'], [9, 'IX'], [10, 'X'], [40, 'XL'], [50, 'L'], [90, 'XC'], [100, 'C'], [400, 'CD'], [500, 'D'], [900, 'CM'], [1000, 'M']
    ]

    let num = new Decimal(value).trunc().toNumber();
    if (num >= 4000) return format(value);
    if (num < 1) return "Nulla";

    const out = [];
    for (let index = romanNumerals.length-1; num > 0; index--) {
        for (let i = Math.floor(num / romanNumerals[index][0]); i > 0; i--) {
            out.push(romanNumerals[index][1]);
        }
        num %= romanNumerals[index][0];
    }

    return out.join('');
}