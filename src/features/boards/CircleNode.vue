<template>
    <g>
        <circle
            v-if="canAccept"
            class="receiver"
            :r="size + 8"
            :fill="backgroundColor"
            :stroke="receivingNode ? '#0F0' : '#0F03'"
            :stroke-width="2"
        />

        <circle
            class="body"
            :r="size"
            :fill="fillColor"
            :stroke="outlineColor"
            :stroke-width="4"
        />

        <circle
            class="progress progressFill"
            v-if="progressDisplay === ProgressDisplay.Fill"
            :r="Math.max(size * progress - 2, 0)"
            :fill="progressColor"
        />
        <circle
            v-else
            :r="size + 4.5"
            class="progress progressRing"
            fill="transparent"
            :stroke-dasharray="(size + 4.5) * 2 * Math.PI"
            :stroke-width="5"
            :stroke-dashoffset="(size + 4.5) * 2 * Math.PI - progress * (size + 4.5) * 2 * Math.PI"
            :stroke="progressColor"
        />
    </g>
</template>

<script setup lang="ts">
import { ProgressDisplay } from './board';

defineProps<{
    receivingNode?: boolean,
    canAccept: boolean,
    size: number,
    progress: number,
    progressDisplay: ProgressDisplay,
    progressColor: string,
    backgroundColor: string,
    fillColor: string,
    outlineColor: string
}>();
</script>

<style scoped>
.progress {
    transition-duration: 0.05s;
}

.progressRing {
    transform: rotate(-90deg);
}
</style>