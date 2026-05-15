import { MaybeGetter, processGetter } from "util/computed";
import { ComputedRef } from "vue";

type InferredOut<T> = T extends () => infer S ? ComputedRef<S> : T;
export function effectMixin(): undefined;
export function effectMixin<T>(effect: MaybeGetter<T>): { effect: InferredOut<T> }
export function effectMixin<T>(effect: MaybeGetter<T>, nextEffect: MaybeGetter<T>): { effect: InferredOut<T>, nextEffect: InferredOut<T> }
export function effectMixin<T>(
    effect?: MaybeGetter<T>,
    nextEffect?: MaybeGetter<T>
) {
    if (effect == undefined) return undefined;
    const out: Record<string, any> = { effect: processGetter(effect) };
    if (nextEffect == undefined) return out as {
        effect: T extends () => infer S ? ComputedRef<S> : T
    };
    out.nextEffect = processGetter(nextEffect);
    return out as {
        effect: T extends () => infer S ? ComputedRef<S> : T
        nextEffect: T extends () => infer S ? ComputedRef<S> : T
    };
}