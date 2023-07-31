<template>
    <circle stroke="#242526" 
            :stroke-width="width/2"
            :cx="center"
            :cy="center"
            :r="radius" />
    <circle v-if="angle > 0"
            :stroke="color"
            :stroke-width="width"
            :stroke-dasharray="arcString"
            :cx="center"
            :cy="center"
            :r="radius"
            stroke-linecap="round"
            :style="{
                transitionDuration: '0s',
                transform: rotationString,
                transformOrigin: `${center}px ${center}px`
            }"
            />
</template>

<script setup lang="ts">
import { computed, unref } from "vue";

const props = defineProps<{
    color: string;
    width: number;
    radius: number;
    offset: number;
    angle: number;
}>();

const circumference = computed(() => props.radius * Math.PI * 2);
const arc = computed(() => unref(circumference) * props.angle / 360);
const center = computed(() => props.radius + props.width/2);

const arcString = computed(() => `${unref(arc)}, ${unref(circumference)}`);
const rotationString = computed(() => `rotate(${props.offset}deg)`);

// arc: arcString,
// rotate: rotationString,
// center,
// unref
</script>