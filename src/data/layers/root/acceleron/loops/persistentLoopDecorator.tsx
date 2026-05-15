import { persistent } from "game/persistence";
import { DecimalSource } from "lib/break_eternity";

export function persistedMixin() {
    return {
        value: persistent<DecimalSource>(0)
    }
}
