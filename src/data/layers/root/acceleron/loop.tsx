import { Visibility, CoercableComponent, GatherProps, Replace, OptionsFunc, getUniqueID, Component } from "features/feature";
import { Persistent, persistent } from "game/persistence";
import { DecimalSource } from "lib/break_eternity";
import { Computable, GetComputableTypeWithDefault, GetComputableType, processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import LoopVue from "./Loop.vue";

export const LoopType = Symbol("Loop");

export interface LoopOptions {
    visibility: Computable<Visibility>;
    buildRequirement: Computable<DecimalSource>;
    triggerRequirement: Computable<DecimalSource>;
    display: Computable<{
        color: string;
        width: number;
        description: CoercableComponent;
    }>;
    effect: Computable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    trigger: (this: BaseLoop, intervals?: DecimalSource) => void;
}

export interface BaseLoop {
    id: string;
    triggerProgress: Persistent<DecimalSource>;
    triggerRequirement: Computable<DecimalSource>;
    buildProgress: Persistent<DecimalSource>;
    buildRequirement: Computable<DecimalSource>;
    built: Persistent<boolean>;
    effect: Computable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    trigger(intervals?: DecimalSource): void;
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
    return createLazyProxy(() => {
        const loop = optionsFunc();

        loop.id = getUniqueID("loop-");
        loop.type = LoopType;

        loop.triggerProgress = triggerProgress;
        loop.buildProgress = buildProgress;
        loop.built = built;

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
                triggerRequirement
            } = this;
            return {
                visibility,
                display,
                buildProgress,
                buildRequirement,
                built,
                triggerProgress,
                triggerRequirement
            };
        };

        return loop as unknown as Loop<T>;
    });
}