import { Visibility, CoercableComponent, GatherProps, Replace, OptionsFunc, getUniqueID, Component } from "features/feature";
import { Persistent, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { Computable, GetComputableTypeWithDefault, GetComputableType, processComputable, ProcessedComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { unref, watch } from "vue";
import LoopVue from "./Loop.vue";
import { GenericDecorator } from "features/decorators/common";

export const LoopType = Symbol("Loop");

export interface LoopOptions<T = unknown> {
    visibility: Computable<Visibility | boolean>;
    buildRequirement: Computable<DecimalSource>;
    triggerRequirement: Computable<DecimalSource>;
    display: Computable<{
        color: ProcessedComputable<string>;
        width: number;
        description: CoercableComponent;
    }>;
    effect: Computable<T>;
    trigger: (this: BaseLoop, intervals: DecimalSource) => void;
}

export interface BaseLoop<T = unknown> {
    id: string;
    triggerProgress: Persistent<DecimalSource>;
    triggerRequirement: Computable<DecimalSource>;
    buildProgress: Persistent<DecimalSource>;
    buildRequirement: Computable<DecimalSource>;
    built: Persistent<boolean>;
    effect: Computable<T>;
    trigger(intervals: DecimalSource): void;
    type: typeof LoopType;
    [Component]: typeof LoopVue;
    [GatherProps]: () => Record<string, unknown>;
}

export type Loop<T extends LoopOptions<U>, U = unknown> = Replace<
    T & BaseLoop<U>,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        triggerRequirement: GetComputableType<T["triggerRequirement"]>;
        buildRequirement: GetComputableType<T["buildRequirement"]>;
        display: GetComputableType<T["display"]>;
        effect: GetComputableType<T["effect"]>;
    }
>;

export type GenericLoop<T = unknown> = Loop<LoopOptions<T>>;

export function createLoop<T extends LoopOptions<U>, U = unknown>(
    optionsFunc: OptionsFunc<T, BaseLoop<U>, GenericLoop<U>>,
    ...decorators: GenericDecorator[]
): Loop<T, U> {
    const triggerProgress = persistent<DecimalSource>(0);
    const buildProgress = persistent<DecimalSource>(0);
    const built = persistent<boolean>(false);
    const decoratedData = decorators.reduce((current, next) => Object.assign(current, next.getPersistentData?.()), {});
    return createLazyProxy(feature => {
        const loop = optionsFunc.call(feature, feature as BaseLoop<U>);

        loop.id = getUniqueID("loop-");
        loop.type = LoopType;
        loop[Component] = LoopVue;
        
        for (const decorator of decorators) {
            decorator.preConstruct?.(loop);
        }

        loop.triggerProgress = triggerProgress;
        loop.buildProgress = buildProgress;
        loop.built = built;
        Object.assign(loop, decoratedData);

        watch(loop.buildProgress, progress => {
            if (Decimal.gte(progress, unref(loop.buildRequirement as ProcessedComputable<DecimalSource>)))
                built.value = true;
        })
        
        processComputable(loop as T, "visibility");
        processComputable(loop as T, "buildRequirement");
        processComputable(loop as T, "triggerRequirement");
        processComputable(loop as T, "display");
        processComputable(loop as T, "effect");

        for (const decorator of decorators) {
            decorator.postConstruct?.(loop);
        }

        const decoratedProps = decorators.reduce((current, next) => Object.assign(current, next.getGatheredProps?.(loop)), {});
        loop[GatherProps] = function (this: GenericLoop<U>) {
            const {
                visibility,
                display,
                buildProgress,
                buildRequirement,
                built,
                triggerProgress,
                triggerRequirement
            } = this;
            return {
                visibility,
                display,
                buildProgress,
                buildRequirement,
                built,
                triggerProgress,
                triggerRequirement,
                ...decoratedProps
            };
        };

        return loop as unknown as Loop<T>;
    });
}