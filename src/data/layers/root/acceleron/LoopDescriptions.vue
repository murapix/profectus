<template>
    <div v-for="loop in loops" :key="loop.id">
        <component v-if="unref(loop.built)" :is="render(unref(loop.display).description)" />
    </div>
</template>

<script setup lang="ts" generic="T">
import { render } from "util/vue";
import { unref } from "vue";
import { GenericLoop } from "./loop";

defineProps<{
    loops: GenericLoop<T>[]
}>();
</script>

<style scoped>
div {
    font-size: 12px;
    color: var(--link);
}
</style>