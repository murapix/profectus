import abyss from "data/layers/root/skyrmion/abyss";
import { globalBus } from "game/events";
import type { Persistent, State } from "game/persistence";
import { NonPersistent, persistent } from "game/persistence";
import type { DecimalSource } from "util/bignum";
import Decimal, { format, formatWhole } from "util/bignum";
import type { ProcessedComputable } from "util/computed";
import { loadingSave } from "util/save";
import type { ComputedRef, Ref } from "vue";
import { computed, isRef, nextTick, ref, unref, watch } from "vue";

/** An object that represents a named and quantifiable resource in the game. */
export interface Resource<T = DecimalSource> extends Ref<T> {
    /** The name of this resource. */
    displayName: ComputedRef<string>;
    /** The name for a singular amount of this resource, if different. */
    singularName: ComputedRef<string>;
    /** When displaying the value of this resource, how many significant digits to display. */
    precision: number;
    /** Whether or not to display very small values using scientific notation, or rounding to 0. */
    small?: boolean;
    /** Whether or not the resource name is prefixed by 'Abyssal' while within the abyss */
    abyssal?: boolean;
}

export type PersistentResource<T extends State = DecimalSource> = Resource<T> & Persistent<T> & { [NonPersistent]: Resource<T> }

export type ResourceOptions = {
    displayName?: string;
    singularName?: string;
    precision?: number;
    small?: boolean;
    abyssal?: boolean;
}

const inAbyss = ref(false);

/**
 * Creates a resource.
 * @param defaultValue The initial value of the resource
 * @param displayName The human readable name of this resource
 * @param singularName An alternate name to use when displaying a single amount of this resource
 * @param precision The number of significant digits to display by default
 * @param small Whether or not to display very small values or round to 0, by default
 */
export function createResource<T extends State>(defaultValue: T): Resource<T> & Persistent<T> & { [NonPersistent]: Resource<T> };
export function createResource<T extends State>(defaultValue: T, {}: ResourceOptions): Resource<T> & Persistent<T> & { [NonPersistent]: Resource<T> };
export function createResource<T extends State>(defaultValue: Ref<T>): Resource<T>;
export function createResource<T extends State>(defaultValue: Ref<T>, {}: ResourceOptions): Resource<T>;
export function createResource<T extends State>(defaultValue: T | Ref<T>, {
    displayName = "points",
    singularName = displayName,
    precision = 0,
    small = undefined,
    abyssal = false
}: ResourceOptions = {}) {
    nextTick(() => {
        if (unref(abyss.challenge.active)) inAbyss.value = true;
        watch(abyss.challenge.active, active => { inAbyss.value = active; })
    });

    const resource: Partial<Resource<T>> = isRef(defaultValue)
        ? defaultValue
        : persistent(defaultValue);
    resource.displayName = computed(() => {
        if (inAbyss.value && abyssal) return `Abyssal ${displayName}`;
        return displayName;
    });
    resource.singularName = computed(() => {
        if (inAbyss.value && abyssal) return `Abyssal ${singularName}`;
        return singularName;
    });
    resource.precision = precision;
    resource.small = small;
    if (!isRef(defaultValue)) {
        const nonPersistentResource = (resource as Persistent<T>)[
            NonPersistent
        ] as unknown as Resource<T>;
        nonPersistentResource.displayName = computed(() => {
            if (inAbyss.value && abyssal) return `Abyssal ${displayName}`;
            return displayName;
        });
        nonPersistentResource.singularName = computed(() => {
            if (inAbyss.value && abyssal) return `Abyssal ${singularName}`;
            return singularName;
        });
        nonPersistentResource.precision = precision;
        nonPersistentResource.small = small;
    }
    return resource as Resource<T>;
}

/** Returns a reference to the highest amount of the resource ever owned, which is updated automatically. */
export function trackBest(resource: Resource): Ref<DecimalSource> {
    const best = persistent(resource.value);
    watch(resource, amount => {
        if (loadingSave.value) {
            return;
        }
        if (Decimal.gt(amount, best.value)) {
            best.value = amount;
        }
    });
    return best;
}

/** Returns a reference to the total amount of the resource gained, updated automatically. "Refunds" count as gain. */
export function trackTotal(resource: Resource): Ref<DecimalSource> {
    const total = persistent(resource.value);
    watch(resource, (amount, prevAmount) => {
        if (loadingSave.value) {
            return;
        }
        if (Decimal.gt(amount, prevAmount)) {
            total.value = Decimal.add(total.value, Decimal.sub(amount, prevAmount));
        }
    });
    return total;
}

const tetra8 = new Decimal("10^^8");
const e100 = new Decimal("1e100");
/** Returns a reference to the amount of resource being gained in terms of orders of magnitude per second, calcualted over the last tick. Useful for situations where the gain rate is increasing very rapidly. */
export function trackOOMPS(
    resource: Resource,
    pointGain?: ComputedRef<DecimalSource>
): Ref<string> {
    const oomps = ref<DecimalSource>(0);
    const oompsMag = ref(0);
    const lastPoints = ref<DecimalSource>(0);

    globalBus.on("update", diff => {
        oompsMag.value = 0;
        if (Decimal.lte(resource.value, e100)) {
            lastPoints.value = resource.value;
            return;
        }

        let curr = resource.value;
        let prev = lastPoints.value;
        lastPoints.value = curr;
        if (Decimal.gt(curr, prev)) {
            if (Decimal.gte(curr, tetra8)) {
                curr = Decimal.slog(curr, 1e10);
                prev = Decimal.slog(prev, 1e10);
                oomps.value = curr.sub(prev).div(diff);
                oompsMag.value = -1;
            } else {
                while (
                    Decimal.div(curr, prev).log(10).div(diff).gte("100") &&
                    oompsMag.value <= 5 &&
                    Decimal.gt(prev, 0)
                ) {
                    curr = Decimal.log10(curr);
                    prev = Decimal.log10(prev);
                    oomps.value = curr.sub(prev).div(diff);
                    oompsMag.value++;
                }
            }
        }
    });

    const oompsString = computed(() => {
        if (oompsMag.value === 0) {
            return pointGain
                ? format(pointGain.value, resource.precision, resource.small) +
                      " " +
                      unref(resource.displayName) +
                      "/s"
                : "";
        }
        return (
            format(oomps.value) +
            " OOM" +
            (oompsMag.value < 0 ? "^OOM" : "^" + oompsMag.value) +
            "s/sec"
        );
    });
    return oompsString;
}

/** Utility for displaying a resource with the correct precision. */
export function displayResource(resource: Resource, overrideAmount?: DecimalSource): string {
    const amount = overrideAmount ?? resource.value;
    if (resource.small && Decimal.lt(amount, 0.98)) {
        return format(amount, undefined, resource.small);
    }
    if (Decimal.eq(resource.precision, 0)) {
        return formatWhole(resource.small ? amount : Decimal.floor(amount));
    }
    return format(amount, resource.precision, resource.small);
}

/** Utility for unwrapping a resource that may or may not be inside a ref. */
export function unwrapResource(resource: ProcessedComputable<Resource>): Resource {
    if ("displayName" in resource) {
        return resource;
    }
    return unref(resource);
}
