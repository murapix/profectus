import { Component, GatherProps, GenericComponent, OptionsObject, getUniqueID } from "features/feature";
import { Sides } from "./timesquares";
import { Persistent, persistent } from "game/persistence";
import { createLazyProxy } from "util/proxies";
import { DecimalSource } from "lib/break_eternity";
import TimelineComponent from "./Timeline.vue"

export const TimelineType = Symbol("Timeline");

export interface TimelineOptions {
    sides: [Sides, Sides]
}

export interface BaseTimeline {
    id: string;
    type: typeof TimelineType;
    [Component]: GenericComponent;
    [GatherProps]: () => Record<string, unknown>;

    active: Persistent<boolean>;
    next: Persistent<boolean>;
    score: Persistent<DecimalSource>;

    onClick: (e?: MouseEvent | TouchEvent) => void;
}

export type Timeline<T extends TimelineOptions> = T & BaseTimeline;

export type GenericTimeline = Timeline<TimelineOptions>;

export function createTimeline<T extends TimelineOptions>(
    optionsObject: OptionsObject<T, BaseTimeline, GenericTimeline>
): Timeline<T> {
    const active = persistent<boolean>(false);
    const next = persistent<boolean>(false);
    const score = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const timeline = optionsObject;
        timeline.id = getUniqueID("timeline-");
        timeline.type = TimelineType;
        timeline[Component] = TimelineComponent as GenericComponent;

        timeline.active = active;
        timeline.next = next;
        timeline.score = score;

        timeline.onClick = () => {
            next.value = !next.value;
        }

        timeline[GatherProps] = function (this: GenericTimeline) {
            const {
                id,
                sides,
                active,
                next,
                score,
                onClick
            } = this;
            return {
                id,
                sides,
                active,
                next,
                score,
                onClick
            }
        }

        return timeline as Timeline<T>;
    });
}