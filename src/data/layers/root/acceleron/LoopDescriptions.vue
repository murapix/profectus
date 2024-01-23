<template>
    <Tooltip v-if="unref(loopDescriptions).length > 0" :display="joined" :direction="Direction.Up">
        <div>Hover for Current Effects</div>
    </Tooltip>
</template>

<script setup lang="tsx" generic="T">
import { joinJSX, renderJSX } from "util/vue";
import { computed, unref } from "vue";
import { GenericLoop } from "./loop";
import { Direction } from "util/common";
import { jsx } from "features/feature";
import Tooltip from "features/tooltips/Tooltip.vue";

const props = defineProps<{
    loops: GenericLoop<T>[]
}>();

const loopDescriptions = computed(() => props.loops.filter(loop => unref(loop.built)).map(loop => renderJSX(unref(loop.display).description)));
const joined = jsx(() => joinJSX(unref(loopDescriptions), <><br/></>));
</script>

<style scoped>
div {
    color: var(--link);
}

:deep(.tooltip) {
    background-color: rgb(from var(--tooltip-background) r g b / 0.9);
    border-radius: 5px;
    font-size: 12px;
    color: var(--link);
}
</style>