import Formula from "game/formulas/formulas";
import { DefaultValue, NonPersistent, SkipPersistence, deletePersistent, persistent } from "game/persistence";
import { computed, isRef, ref, unref } from "vue";
import Decimal from "./break_eternity";
import { Section, createCollapsibleModifierSections } from "data/common";
import { jsx } from "features/feature";
import Modal from "components/Modal.vue";
import { Computable, convertComputable } from "./computed";

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
        if (['requirements', 'tabs', 'prerequisites'].includes(key)) continue;
        const data = clonePersistentData(value);
        if (data !== undefined) copy[key] = data;
    }
    if (Object.keys(copy).length === 0) return;
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

export function createModifierModal(
    title: Computable<string>,
    sectionsFunc: () => Section[],
    fontSize?: string
) {
    const [modifiers, collapsed] = createCollapsibleModifierSections(sectionsFunc);
    const computedTitle = convertComputable(title);
    deletePersistent(collapsed);

    const showModifiers = ref(false);

    return jsx(() => (
        <>
            <button class="button"
                    style={{
                        display: "inline-block",
                        fontSize: fontSize ?? "20px"
                    }}
                    onClick={() => showModifiers.value = true}
            >🛈</button>
            <Modal
                modelValue={showModifiers.value}
                onUpdate:modelValue={value => showModifiers.value = value}
                v-slots={{
                    header: () => <h2>{unref(computedTitle)}</h2>,
                    body: modifiers
                }}
            />
        </>
    ))
}