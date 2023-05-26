<template>
    <g>
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

const props = defineProps<{
    size?: number;
    canAccept?: boolean;
}>();
const width = computed(() => props.size ?? 10);
const offset = computed(() => -width.value/2);


</script>