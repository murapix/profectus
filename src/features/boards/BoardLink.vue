<template>
    <line
        class="link"
        v-bind="linkProps"
        :class="{ pulsing: link.pulsing }"
        :x1="startPosition.x"
        :y1="startPosition.y"
        :x2="corner.x"
        :y2="corner.y"
        stroke-linecap="round"
    />
    <line
        class="link"
        v-bind="linkProps"
        :class="{ pulsing: link.pulsing }"
        :x1="corner.x"
        :y1="corner.y"
        :x2="endPosition.x"
        :y2="endPosition.y"
        stroke-linecap="round"
    />
</template>

<script setup lang="ts">
import type { BoardNode, BoardNodeLink } from "features/boards/board";
import { kebabifyObject } from "util/vue";
import { computed, toRefs, unref } from "vue";

const _props = defineProps<{
    link: BoardNodeLink;
    dragging: BoardNode | null;
    dragged?: {
        x: number;
        y: number;
    };
}>();
const props = toRefs(_props);

const startPosition = computed(() => {
    const position = { ...props.link.value.startNode.position };
    if (props.link.value.offsetStart) {
        position.x += unref(props.link.value.offsetStart).x;
        position.y += unref(props.link.value.offsetStart).y;
    }
    if (props.dragging?.value === props.link.value.startNode) {
        position.x += props.dragged?.value?.x ?? 0;
        position.y += props.dragged?.value?.y ?? 0;
    }
    return position;
});

const endPosition = computed(() => {
    const position = { ...props.link.value.endNode.position };
    if (props.link.value.offsetEnd) {
        position.x += unref(props.link.value.offsetEnd).x;
        position.y += unref(props.link.value.offsetEnd).y;
    }
    if (props.dragging?.value === props.link.value.endNode) {
        position.x += props.dragged?.value?.x ?? 0;
        position.y += props.dragged?.value?.y ?? 0;
    }
    return position;
});

const linkProps = computed(() => kebabifyObject(_props.link as unknown as Record<string, unknown>));

const xDiff = computed(() => endPosition.value.x - startPosition.value.x);
const absXDiff = computed(() => Math.abs(xDiff.value));

const yDiff = computed(() => endPosition.value.y - startPosition.value.y);
const absYDiff = computed(() => Math.abs(yDiff.value));

const sharedDistance = computed(() => Math.min(absXDiff.value, absYDiff.value));
const unsharedDistance = computed(() => Math.max(absXDiff.value, absYDiff.value) - sharedDistance.value);

const diagonalFirst = computed(() => sharedDistance.value > unsharedDistance.value);

const corner = computed(() => {
    if (diagonalFirst.value) {
        return {
            x: startPosition.value.x + (xDiff.value > 0 ? sharedDistance.value : -sharedDistance.value),
            y: startPosition.value.y + (yDiff.value > 0 ? sharedDistance.value : -sharedDistance.value)
        }
    }
    else {
        return {
            x: endPosition.value.x - (xDiff.value > 0 ? sharedDistance.value : -sharedDistance.value),
            y: endPosition.value.y - (yDiff.value > 0 ? sharedDistance.value : -sharedDistance.value)
        }
    }
});
</script>

<style scoped>
.link {
    transition-duration: 0s;
    pointer-events: none;
}

.link.pulsing {
    animation: pulsing 2s ease-in infinite;
}

@keyframes pulsing {
    0% {
        opacity: 0.25;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.25;
    }
}
</style>
