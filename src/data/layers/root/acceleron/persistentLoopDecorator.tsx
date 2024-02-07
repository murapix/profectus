import { DecimalSource } from "lib/break_eternity";
import { BaseLoop, GenericLoop, Loop, LoopOptions } from "./loop";
import { Persistent, persistent } from "game/persistence";
import { Decorator } from "features/decorators/common";

export interface BasePersistentLoop<T = unknown> extends BaseLoop<T> {
    value: Persistent<DecimalSource>;
}

export type PersistentLoop<T extends LoopOptions<U>, U = unknown> = Loop<T,U> & { value: Persistent<DecimalSource> };

export type GenericPersistentLoop<T = unknown> = GenericLoop<T> & { value: Persistent<DecimalSource> }

export const persistentDecorator: Decorator<LoopOptions, BasePersistentLoop, GenericPersistentLoop> = {
    getPersistentData() {
        return {
            value: persistent<DecimalSource>(0)
        }
    },
    getGatheredProps(loop) {
        return {
            value: loop.value
        }
    }
}