import { Visibility, CoercableComponent, GatherProps, Replace, OptionsFunc, getUniqueID, Component } from "features/feature";
import { deletePersistent, Persistent, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { Computable, GetComputableTypeWithDefault, GetComputableType, processComputable, ProcessedComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { unref, watch } from "vue";
import LoopVue from "./Loop.vue";

export const LoopType = Symbol("Loop");

export interface LoopOptions {
    visibility: Computable<Visibility | boolean>;
    buildRequirement: Computable<DecimalSource>;
    triggerRequirement: Computable<DecimalSource>;
    display: Computable<{
        color: ProcessedComputable<string>;
        width: number;
        description: CoercableComponent;
    }>;
    persistentBoost?: boolean;
    effect: Computable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    trigger: (this: BaseLoop, intervals: DecimalSource) => void;
}

export interface BaseLoop {
    id: string;
    triggerProgress: Persistent<DecimalSource>;
    triggerRequirement: Computable<DecimalSource>;
    buildProgress: Persistent<DecimalSource>;
    buildRequirement: Computable<DecimalSource>;
    built: Persistent<boolean>;
    currentBoost?: Persistent<DecimalSource>;
    effect: Computable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    trigger(intervals: DecimalSource): void;
    type: typeof LoopType;
    [Component]: typeof LoopVue;
    [GatherProps]: () => Record<string, unknown>;
}

export type Loop<T extends LoopOptions> = Replace<
    T & BaseLoop,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        triggerRequirement: GetComputableType<T["triggerRequirement"]>;
        buildRequirement: GetComputableType<T["buildRequirement"]>;
        display: GetComputableType<T["display"]>;
        effect: GetComputableType<T["effect"]>;
    }
>;

export type GenericLoop = Loop<LoopOptions>;

export function createLoop<T extends LoopOptions>(optionsFunc: OptionsFunc<T, BaseLoop, GenericLoop>): Loop<T> {
    const triggerProgress = persistent<DecimalSource>(0);
    const buildProgress = persistent<DecimalSource>(0);
    const built = persistent<boolean>(false);
    const persistentBoost = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const loop = optionsFunc();

        loop.id = getUniqueID("loop-");
        loop.type = LoopType;

        loop.triggerProgress = triggerProgress;
        loop.buildProgress = buildProgress;
        loop.built = built;

        if (loop.persistentBoost)
            loop.currentBoost = persistentBoost;
        else deletePersistent(persistentBoost);

        watch(loop.buildProgress, progress => {
            if (Decimal.gte(progress, unref(loop.buildRequirement as ProcessedComputable<DecimalSource>)))
                built.value = true;
        })
        
        processComputable(loop as T, "visibility");
        processComputable(loop as T, "buildRequirement");
        processComputable(loop as T, "triggerRequirement");
        processComputable(loop as T, "display");
        processComputable(loop as T, "effect");

        loop[Component] = LoopVue;
        loop[GatherProps] = function (this: GenericLoop) {
            const {
                visibility,
                display,
                buildProgress,
                buildRequirement,
                built,
                triggerProgress,
                triggerRequirement,
                currentBoost
            } = this;
            return {
                visibility,
                display,
                buildProgress,
                buildRequirement,
                built,
                triggerProgress,
                triggerRequirement,
                currentBoost
            };
        };

        return loop as unknown as Loop<T>;
    });
}