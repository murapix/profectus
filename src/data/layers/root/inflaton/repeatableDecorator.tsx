import { Decorator, EffectFeatureOptions } from "features/decorators/common";
import { Component, GenericComponent, Replace, Visibility, jsx, setDefault } from "features/feature";
import { Persistent, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/break_eternity";
import { isFunction } from "util/common";
import { Computable, GetComputableType, GetComputableTypeWithDefault, ProcessedComputable, processComputable } from "util/computed";
import { coerceComponent, isCoercableComponent } from "util/vue";
import { ComputedRef, Ref, computed, isRef, unref } from "vue";
import RepeatableResearchComponent from "../inflaton/RepeatableResearch.vue";
import { BaseResearch, ResearchOptions } from "./research";

export interface RepeatableResearchOptions<T = unknown> extends ResearchOptions, EffectFeatureOptions<T> {
    limit?: Computable<DecimalSource>;
}

export interface BaseRepeatableResearch<T = unknown> extends BaseResearch {
    effect: Computable<T>;
    amount: Persistent<DecimalSource>;
    maxed: Ref<boolean>;
}

export type RepeatableResearch<T extends RepeatableResearchOptions<U>, U> = Replace<
    T & BaseRepeatableResearch<U>,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        display: GetComputableType<T["display"]>;
        isResearching: GetComputableType<T["isResearching"]>;
        limit: GetComputableTypeWithDefault<T["limit"], 3998>;
    }
>;

export type GenericRepeatableResearch<T = unknown> = Replace<
    RepeatableResearch<RepeatableResearchOptions<T>, T>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        isResearching: ProcessedComputable<boolean>;
        limit: ProcessedComputable<DecimalSource>;
        effect: ProcessedComputable<T>;
    }
>;

export const repeatableDecorator: Decorator<RepeatableResearchOptions, BaseRepeatableResearch, GenericRepeatableResearch> = {
    getPersistentData() {
        return {
            amount: persistent<DecimalSource>(0)
        }
    },
    preConstruct(research) {
        research[Component] = RepeatableResearchComponent as unknown as GenericComponent;

        if (isCoercableComponent(research.display)) return;
        if (isRef(research.display)) return;
        if (isFunction(research.display)) return;

        const title = research.display.title;
        research.display.title = jsx(() => {
            const Title = coerceComponent(title ?? "");
            return <h3>Repeatable: <Title /> {formatRoman(Decimal.add(unref(research.amount ?? 0), 1))}</h3>
        });
    },
    postConstruct(research) {
        processComputable(research, "limit");
        setDefault(research, "limit", 3998);

        research.maxed = computed(() => Decimal.gte(
            unref(research.amount!),
            unref(research.limit as ProcessedComputable<DecimalSource>)
        ));

        const canResearch = research.canResearch as ComputedRef<boolean>;
        research.canResearch = computed(() => {
            if (unref(research.maxed)) return false;
            return unref(canResearch) ?? true;
        });

        research.researched = computed(() => Decimal.gt(unref(research.amount!), 0));

        const onResearch = research.onResearch;
        research.onResearch = () => {
            onResearch?.();
            research.amount!.value = Decimal.add(unref(research.amount!), 1);
            research.progress!.value = 0;
        }
    },
    getGatheredProps(research) {
        const { amount, maxed } = research;
        return { amount, maxed };
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