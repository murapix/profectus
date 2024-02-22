<template>
    <component :is="tag ?? 'h2'" :style="{ color, 'text-shadow': '0px 0px 10px ' + color }">
        {{ amount }}
    </component>
</template>

<script setup lang="ts">
import type { Resource } from "features/resources/resource";
import { displayResource } from "features/resources/resource";
import { DecimalSource } from "lib/break_eternity";
import { computed } from "vue";

const props = defineProps<{
    resource: Resource<DecimalSource>;
    color: string;
    tag?: string;
    override?: DecimalSource
}>();

const amount = computed(() => displayResource(props.resource, props.override));
</script>
