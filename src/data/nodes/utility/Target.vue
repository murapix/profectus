<template>
    <g
        :stroke="stroke"
        stroke-width=2
        stroke-linecap="square"
    >
        <line :x1="size" :x2="size*1.25" :y1="0" :y2="size/4" />
        <line :x1="size" :x2="size*1.25" :y1="0" :y2="-size/4" />

        <line :x1="-size" :x2="-size*1.25" :y1="0" :y2="size/4" />
        <line :x1="-size" :x2="-size*1.25" :y1="0" :y2="-size/4" />

        <line :y1="size" :y2="size*1.25" :x1="0" :x2="size/4" />
        <line :y1="size" :y2="size*1.25" :x1="0" :x2="-size/4" />

        <line :y1="-size" :y2="-size*1.25" :x1="0" :x2="size/4" />
        <line :y1="-size" :y2="-size*1.25" :x1="0" :x2="-size/4" />
    </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    size: number;
    stroke?: string;
}>();

const stroke = computed(() => props.stroke ?? 'var(--outline)');
</script>