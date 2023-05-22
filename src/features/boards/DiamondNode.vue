<template>
    <g transform="rotate(45, 0, 0)">
        <rect
            v-if="canAccept"
            class="receiver"
            :width="size * sqrtTwo + 16"
            :height="size * sqrtTwo + 16"
            :transform="`translate(${-(size * sqrtTwo + 16) / 2}, ${
                -(size * sqrtTwo + 16) / 2
            })`"
            :fill="backgroundColor"
            :stroke="receivingNode ? '#0F0' : '#0F03'"
            :stroke-width="2"
        />

        <rect
            class="body"
            :width="size * sqrtTwo"
            :height="size * sqrtTwo"
            :transform="`translate(${(-size * sqrtTwo) / 2}, ${(-size * sqrtTwo) / 2})`"
            :fill="fillColor"
            :stroke="outlineColor"
            :stroke-width="4"
        />

        <rect
            v-if="progressDisplay === ProgressDisplay.Fill"
            class="progress progressFill"
            :width="Math.max(size * sqrtTwo * progress - 2, 0)"
            :height="Math.max(size * sqrtTwo * progress - 2, 0)"
            :transform="`translate(${-Math.max(size * sqrtTwo * progress - 2, 0) / 2}, ${
                -Math.max(size * sqrtTwo * progress - 2, 0) / 2
            })`"
            :fill="progressColor"
        />
        <rect
            v-else
            class="progress progressDiamond"
            :width="size * sqrtTwo + 9"
            :height="size * sqrtTwo + 9"
            :transform="`translate(${-(size * sqrtTwo + 9) / 2}, ${
                -(size * sqrtTwo + 9) / 2
            })`"
            fill="transparent"
            :stroke-dasharray="(size * sqrtTwo + 9) * 4"
            :stroke-width="5"
            :stroke-dashoffset="
                (size * sqrtTwo + 9) * 4 - progress * (size * sqrtTwo + 9) * 4
            "
            :stroke="progressColor"
        />
    </g>
</template>

<script setup lang="ts">
import { ProgressDisplay } from './board';

defineProps<{
    receivingNode?: boolean;
    canAccept: boolean;
    size: number;
    progress: number;
    progressDisplay: ProgressDisplay;
    progressColor: string;
    backgroundColor: string;
    fillColor: string;
    outlineColor: string;
}>();

const sqrtTwo = Math.sqrt(2);
</script>

<style scoped>
.progress {
    transition-duration: 0.05s;
}

</style>