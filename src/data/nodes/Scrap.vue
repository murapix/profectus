<template>
    <g>
        <rect
            class="body"
            :width="size"
            :height="size"
            :transform="`translate(${offset} ${offset})`"
            fill="var(--locked)"
            stroke="var(--highlighted)"
            stroke-width=2
        />
    </g>
</template>

<script setup lang="ts">
import { BoardNode } from 'features/boards/board';
import { computed } from 'vue';

const props = defineProps<{
    node: BoardNode;
    size?: number;
}>();
const width = computed(() => props.size ?? 10);
const offset = computed(() => -width.value/2);
</script>