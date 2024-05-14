<template>
    <component :is="tag ?? 'h2'" :style="{ color, 'text-shadow': '0px 0px 10px ' + color }">
        {{ amount }}
    </component><template v-if="includeName">
        {{ " " + name }}
    </template>
</template>

<script setup lang="ts">
import type { Resource } from "features/resources/resource";
import { displayResource } from "features/resources/resource";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { computed, unref } from "vue";

const props = defineProps<{
    resource: Resource<DecimalSource>;
    color: string;
    tag?: string;
    override?: DecimalSource,
    includeName?: boolean;
}>();

const amount = computed(() => displayResource(props.resource, props.override));
const name = computed(() => {
    const resourceAmount = unref(props.override ?? props.resource);
    if (Decimal.gt(resourceAmount, 1.5) || Decimal.lt(resourceAmount, 0.5)) return unref(props.resource.displayName);
    return Decimal.eq(unref(amount), 1) ? unref(props.resource.singularName) : unref(props.resource.displayName);
});
</script>
