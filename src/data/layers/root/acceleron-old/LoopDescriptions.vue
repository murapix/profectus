<template>
    <div v-for="loop in loops" :key="loop.id">
        <component v-if="unref(loop.built)" :is="render(unref(loop.display).description)" />
    </div>
</template>

<script lang="ts">
import { render } from "util/vue";
import { defineComponent, unref } from "vue";
import acceleron from "./acceleron";

export default defineComponent({
    setup() {
        return {
            unref,
            render,
            
            loops: acceleron.loops
        }
    }
})
</script>

<style scoped>
div {
    font-size: 12px;
    color: var(--link);
}
</style>