<template>
    <g @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.5 : 1}">
        <Target v-if="canAccept" :size="width" />
        <rect
            class="body"
            :width="width"
            :height="width"
            :transform="`translate(${offset} ${offset})`"
            fill="var(--locked)"
            stroke="var(--highlighted)"
            stroke-width=2
        />
    </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Target from '../utility/Target.vue'
import { BoardNode } from 'features/boards/board';
import { root } from 'data/projEntry';

const props = defineProps<{
    node?: BoardNode;
    size?: number;
    canAccept?: boolean;
    placing?: boolean;
}>();
const width = computed(() => props.size ?? 10);
const offset = computed(() => -width.value/2);

const emit = defineEmits<{
    (type: "place-building", node: BoardNode): void;
}>();
function mouseUp() {
    if (props.node) {
        if (root.board.draggingNode.value === props.node) {
            emit("place-building", props.node);
        }
    }
}
</script>