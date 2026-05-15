import { Persistent, persistent } from "game/persistence";
import { DecimalSource } from "lib/break_eternity";
import { createLazyProxy } from "util/proxies";
import TimelineComponent from "./TimelineComponent.vue";
import { Sides } from "./timesquares";
import { VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";

export const TimelineType = Symbol("Timeline");

export interface TimelineOptions extends VueFeatureOptions {
    sides: [Sides, Sides]
}

export interface Timeline extends VueFeature {
    active: Persistent<boolean>;
    next: Persistent<boolean>;
    score: Persistent<DecimalSource>;

    onClick: (e?: MouseEvent | TouchEvent) => void;

    sides: [Sides, Sides]
}

export function createTimeline<T extends TimelineOptions>(
    options: T
) {
    const active = persistent<boolean>(false);
    const next = persistent<boolean>(false);
    const score = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const { sides } = options;

        const timeline = {
            active,
            next,
            score,
            ...vueFeatureMixin("timeline", options, () => <TimelineComponent {...timeline}/>),
            onClick: () => next.value = !next.value,
            sides
        } satisfies Timeline;

        return timeline;
    });
}