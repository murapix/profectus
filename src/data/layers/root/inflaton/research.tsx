import { CoercableComponent, Component, GatherProps, getUniqueID, jsx, OptionsFunc, OptionsObject, Replace, setDefault, Visibility } from "features/feature";
import { persistent, Persistent, State } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/break_eternity";
import { isFunction } from "util/common";
import { Computable, GetComputableType, GetComputableTypeWithDefault, processComputable, ProcessedComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent } from "util/vue";
import { computed, ComputedRef, isRef, Ref, unref, watch } from "vue";
import RepeatableResearchVue from "./RepeatableResearch.vue";
import ResearchVue from "./Research.vue";

export const ResearchType = Symbol("Research");

type ResearchDisplay = CoercableComponent
| {
    title: CoercableComponent;
    description: CoercableComponent;
    effectDisplay?: CoercableComponent;
}

export interface ResearchOptions {
    visibility?: Computable<Visibility>;
    requirements?: GenericResearch[];
    display: Computable<ResearchDisplay>;
    position?: [number, number];
    effect?: Computable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    cost: Computable<DecimalSource>;
    canResearch?: Computable<boolean>;
    onResearch?: VoidFunction;
    research: (force: boolean) => void;
    isResearching: (this: GenericResearch) => boolean;
}

export interface BaseResearch {
    id: string;
    progress: Persistent<DecimalSource>;
    progressPercentage: Ref<DecimalSource>;
    researched: Ref<boolean>;
    research: (force: boolean) => void;
    isResearching: Computable<boolean>;
    type: typeof ResearchType;
    [Component]: typeof ResearchVue;
    [GatherProps]: () => Record<string, unknown>;
}

export type Research<T extends ResearchOptions> = Replace<
    T & BaseResearch,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        display: GetComputableType<T["display"]>;
        effect: GetComputableType<T["effect"]>;
        cost: GetComputableType<T["cost"]>;
        isResearching: GetComputableType<T["isResearching"]>;
    }
>;

export type GenericResearch = Replace<
    Research<ResearchOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        cost: ProcessedComputable<DecimalSource>;
        isResearching: ProcessedComputable<boolean>;
    }
>;

type ResearchOptionsObject<T extends ResearchOptions> = OptionsObject<T, BaseRepeatableResearch, GenericRepeatableResearch>;
type ResearchDecorator<T extends ResearchOptions, P extends State = State> = {
    getPersistents?(): {[key in string]: Persistent<P>};
    preConstruct?(research: ResearchOptionsObject<T>): void;
    postConstruct?(research: ResearchOptionsObject<T>): void;
    getGatheredProps?(research: ResearchOptionsObject<T>): Partial<ResearchOptionsObject<T>>;
}

export function createResearch<T extends ResearchOptions>(
    optionsFunc: OptionsFunc<T, BaseResearch, GenericResearch>,
    ...decorators: ResearchDecorator<T>[]
): Research<T> {
    const progress = persistent<DecimalSource>(0);

    const persistents = decorators.map(decorator => decorator.getPersistents?.() ?? {}).reduce((current, next) => Object.assign(current, next), {});

    return createLazyProxy(() => {
        const research = optionsFunc();
        research.id = getUniqueID("research-");
        research.type = ResearchType;
        research[Component] = ResearchVue;

        if (research.visibility == null && research.requirements == null) {
            console.warn(
                "Error: can't create research without a visibility property or a requirements property",
                research
            );
        }

        decorators.forEach(decorator => decorator.preConstruct?.(research));

        research.progress = progress;

        Object.assign(research, persistents);

        processComputable(research as T, "canResearch");
        const canResearch = research.canResearch;
        research.canResearch = computed(() => {
            if (canResearch != null) {
                if (!unref(canResearch))
                    return false;
            }
            return research.requirements?.every(research =>
                unref(research.researched)) ?? true;
        });

        processComputable(research as T, "visibility");
        const visibility = research.visibility as ComputedRef<Visibility>;
        research.visibility = computed(() => {
            if (unref(research.researched)) return Visibility.Visible;
            if (research.requirements?.every(research => unref(research.researched) || unref(research.canResearch)) ?? true) {
                return unref(visibility) ?? Visibility.Visible
            }
            return Visibility.None;
        });

        processComputable(research as T, "effect");
        processComputable(research as T, "cost");
        processComputable(research as T, "display");
        processComputable(research as T, "isResearching");

        research.progressPercentage = computed(() => Decimal.div(unref(research.progress!), unref(research.cost as ProcessedComputable<DecimalSource>)).clamp(0, 1));
        watch(research.progressPercentage, (percent) => {
            if (Decimal.gte(percent, 1)) {
                research.researched!.value = true;
            }
        });
        research.researched = computed(() => Decimal.gte(unref(research.progressPercentage!), 1));

        const gatheredProps: Partial<T> = decorators.map(decorator => decorator.getGatheredProps?.(research) ?? {}).reduce((current, next) => Object.assign(current, next), {});
        research[GatherProps] = function (this: GenericResearch) {
            const {
                visibility,
                display,
                id,
                cost,
                canResearch,
                research,
                isResearching,
                progress,
                progressPercentage,
                researched
            } = this;
            return {
                visibility,
                display,
                id,
                cost,
                canResearch,
                research,
                isResearching,
                progress,
                progressPercentage,
                researched,
                ...gatheredProps
            }
        }

        decorators.forEach(decorator => decorator.postConstruct?.(research));

        return research as Research<T>;
    });
}

export function getResearchEffect(research: GenericResearch, defaultValue: any = 1): any {
    return unref(research.researched) ? unref(research.effect) : defaultValue;
}

/*
 ------------
  DECORATORS
 ------------
*/

export interface RepeatableResearchOptions extends ResearchOptions {
    purchaseLimit?: Computable<DecimalSource>;
}

export interface BaseRepeatableResearch extends BaseResearch {
    amount: Persistent<DecimalSource>,
    maxed: Ref<boolean>
}

export type RepeatableResearch<T extends RepeatableResearchOptions> = Replace<
    T & BaseRepeatableResearch,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        display: GetComputableType<T["display"]>;
        effect: GetComputableType<T["effect"]>;
        cost: GetComputableType<T["cost"]>;
        isResearching: GetComputableType<T["isResearching"]>;
        purchaseLimit: GetComputableTypeWithDefault<T["purchaseLimit"], Decimal>;
    }
>;

export type GenericRepeatableResearch = GenericResearch & Replace<
    RepeatableResearch<RepeatableResearchOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        cost: ProcessedComputable<DecimalSource>;
        isResearching: ProcessedComputable<boolean>;
        purchaseLimit: ProcessedComputable<DecimalSource>;
    }
>;

export const repeatableResearchDecorator: ResearchDecorator<RepeatableResearchOptions> = {
    getPersistents() {
        return {
            amount: persistent<DecimalSource>(0)
        }
    },
    preConstruct(research) {
        research[Component] = RepeatableResearchVue;

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
        processComputable(research, "purchaseLimit");
        setDefault(research, "purchaseLimit", Decimal.dInf);

        research.maxed = computed(() =>
            Decimal.gte(
                unref((research as GenericRepeatableResearch).amount),
                unref((research as GenericRepeatableResearch).purchaseLimit)
            )
        );

        const cost = research.cost;
        research.cost = computed(() => {
            if (Decimal.gte(unref((research as GenericRepeatableResearch).amount), 3998)) return Decimal.dInf;
            return unref(cost as ProcessedComputable<DecimalSource>);
        });

        research.researched = computed(() => Decimal.gte(unref(research.amount!), 1));

        const onResearch = research.onResearch;
        research.onResearch = () => {
            onResearch?.();
            research.amount!.value = Decimal.add(unref(research.amount!), 1);
            research.progress!.value = 0;
        }
    },
    getGatheredProps(research) {
        return {
            amount: research.amount
        }
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