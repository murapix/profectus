import { Visibility } from "features/feature";
import { Persistent, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { createLazyProxy } from "util/proxies";
import { ComputedRef, MaybeRef, MaybeRefOrGetter, unref, watch } from "vue";
import Loop from "./Loop.vue";
import loops from "./loops";
import { Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { MaybeGetter, processGetter } from "util/computed";

export const LoopType = Symbol("Loop");

export interface LoopOptions<T = unknown> extends VueFeatureOptions {
    visibility: MaybeRefOrGetter<Visibility | boolean>;
    buildRequirement: MaybeGetter<DecimalSource>;
    triggerRequirement: MaybeGetter<DecimalSource>;
    display: {
        color: MaybeGetter<string>;
        width: number;
        description: MaybeGetter<Renderable>;
    };
    effect: MaybeGetter<T>;
    trigger: (this: Loop<T>, intervals: DecimalSource) => void;
}

export interface Loop<T = unknown> extends VueFeature {
    visibility: MaybeRef<Visibility | boolean>;
    buildRequirement: MaybeRef<DecimalSource>;
    triggerRequirement: MaybeRef<DecimalSource>;
    buildProgress: Persistent<DecimalSource>;
    triggerProgress: Persistent<DecimalSource>;
    built: Persistent<boolean>;
    display: {
        color: MaybeRef<string>;
        width: number;
        description: MaybeRef<Renderable>;
    };
    effect: MaybeRef<T>;
    trigger: (this: Loop<T>, intervals: DecimalSource) => void;
    type: typeof LoopType;
    value?: Persistent<DecimalSource>
}

export function createLoop<U = unknown, T extends LoopOptions<U> = LoopOptions<U>>(
    optionsFunc: () => T,
    value?: Persistent<DecimalSource>
) {
    const triggerProgress = persistent<DecimalSource>(0);
    const buildProgress = persistent<DecimalSource>(0);
    const built = persistent<boolean>(false);
    return createLazyProxy(() => {
        const options = optionsFunc();
        const { visibility, display, buildRequirement, triggerRequirement, effect, trigger, ...props } = options;

        const vueFeature = vueFeatureMixin("loop", options, () => <></>);

        const loop = {
            type: LoopType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof LoopOptions>),
            ...vueFeature,
            triggerProgress,
            buildProgress,
            built,
            buildRequirement: processGetter(buildRequirement),
            triggerRequirement: processGetter(triggerRequirement),
            visibility: processGetter(visibility),
            display: {
                color: processGetter(display.color),
                width: display.width,
                description: processGetter(display.description)
            },
            effect: processGetter(effect) as ComputedRef<U>,
            trigger,
            ...{ value }
        } satisfies Loop<U>;

        watch(loop.buildProgress, progress => {
            if (Decimal.gte(progress, unref(loop.buildRequirement))) {
                built.value = true;
                loops.isBuilding.value = false;
            }
        });

        return loop;
    });
}