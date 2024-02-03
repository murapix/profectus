import Formula from "game/formulas/formulas";
import { DefaultValue, NonPersistent, SkipPersistence, persistent } from "game/persistence";
import { isRef } from "vue";
import Decimal from "./break_eternity";

export function clonePersistentData(object: unknown) {
    if (object == undefined) return;
    if (typeof object !== "object") return;
    if (object instanceof Decimal) return;
    if (object instanceof Formula) return;
    if (SkipPersistence in object && object[SkipPersistence] === true) return;

    if (DefaultValue in object) {
        const original = object as NonPersistent;
        return persistent(original[DefaultValue]);
    }

    if (isRef(object)) return;

    const copy = {} as Record<string | number | symbol, unknown>;
    for (const [key, value] of Object.entries(object)) {
        let data = clonePersistentData(value);
        if (data !== undefined) copy[key] = clonePersistentData(value);
    }
    return copy;
}

export function swapPersistentData(object: unknown, clone: unknown) {
    if (object == undefined || clone == undefined) return;
    if (typeof object !== "object" || typeof clone !== "object") return;
    if (object instanceof Decimal || clone instanceof Decimal) return;
    if (object instanceof Formula || clone instanceof Formula) return;
    if (SkipPersistence in object && object[SkipPersistence] === true) return;
    if (SkipPersistence in clone && clone[SkipPersistence] === true) return;
    
    if (DefaultValue in clone) {
        const o = (object as NonPersistent);
        const c = (clone as NonPersistent);
        const swap = o.value;
        o.value = c.value;
        c.value = swap;
        return;
    }

    if (isRef(object)) return;
    if (isRef(clone)) return;

    for (const key in clone) {
        swapPersistentData((object as Record<string, unknown>)[key], (clone as Record<string, unknown>)[key]);
    }
}