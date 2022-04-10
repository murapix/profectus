<template>
    <component :is="tag ?? 'h2'" :style="{ color: color, 'text-shadow': '0px 0px 10px ' + color }">
        {{ amount }}
    </component>
</template>

<script setup lang="ts">
import { displayResource, Resource } from "features/resources/resource";
import { computed } from "vue";

const props = defineProps<{
    resource: Resource;
    color: string;
    tag?: string;
}>();

const amount = computed(() => displayResource(props.resource));
</script>
