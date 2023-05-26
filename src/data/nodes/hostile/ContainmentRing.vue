<template>
    <g :transform="`translate(${origin.x-node.position.x}, ${origin.y-node.position.y}) rotate(${degrees - 45})`">
        <path
            class="body"
            :d="arcPath"
            fill="var(--locked)"
            stroke="var(--link)"
            stroke-width=2
        />
        <path
            class="health"
            :d="healthPath"
            fill="#2A6DA1"
        />
    </g>
</template>

<script setup lang="ts">
import { types } from 'data/content/types';
import { BoardNode, getNodeProperty } from 'features/boards/board';
import { computed } from 'vue';

const props = defineProps<{
    node: BoardNode;
    size: number;
}>();

const origin = computed(() => (props.node.state as { origin: { x: number, y: number } }).origin ?? { x: 0, y: 0 });

const minRadius = computed(() => {
    const xDiff = props.node.position.x - origin.value.x;
    const yDiff = props.node.position.y - origin.value.y;
    const distance = Math.sqrt(xDiff*xDiff + yDiff*yDiff);
    return Math.trunc(distance/100)*100;
});
const maxRadius = computed(() => {
    return minRadius.value + props.size;
});

const state = computed(() => props.node.state as { durability: number, angle: number });
const angle = computed(() => state.value.angle );
const degrees = computed(() => angle.value * 180 / Math.PI);

const health = computed(() => {
    const maxDurability = getNodeProperty(types[props.node.type].durability, props.node)!;
    return state.value.durability / maxDurability;
});

const gap = Math.PI/360/2;

const arcPath = computed(() => {
    const angle = Math.PI/4;
    const startCartesian = { x: Math.cos(gap), y: Math.sin(gap) };
    const endCartesian = { x: Math.cos(angle - gap), y: Math.sin(angle - gap) };
    const points = [
        { x: maxRadius.value * startCartesian.x, y: maxRadius.value * startCartesian.y },
        { x: maxRadius.value * endCartesian.x, y: maxRadius.value * endCartesian.y },
        { x: minRadius.value * endCartesian.x, y: minRadius.value * endCartesian.y },
        { x: minRadius.value * startCartesian.x, y: minRadius.value * startCartesian.y }
    ];
    return [
        'M', points[0].x, points[0].y,
        'A', maxRadius.value, maxRadius.value, 0, 0, 1, points[1].x, points[1].y,
        'L', points[2].x, points[2].y,
        'A', minRadius.value, minRadius.value, 0, 0, 0, points[3].x, points[3].y,
        'Z'
    ].join(' ');
});

const healthPath = computed(() => {
    const min = minRadius.value + 1;
    const max = maxRadius.value - 1;
    const fullAngle = Math.PI/4;
    const angle = fullAngle * health.value;
    const startAngle = (fullAngle - angle)/2 + gap + Math.PI/360/8;
    const endAngle = startAngle + angle - 2*gap - 2*Math.PI/360/8;
    const startCartesian = { x: Math.cos(startAngle), y: Math.sin(startAngle) };
    const endCartesian = { x: Math.cos(endAngle), y: Math.sin(endAngle) };
    const points = [
        { x: max * startCartesian.x, y: max * startCartesian.y },
        { x: max * endCartesian.x, y: max * endCartesian.y },
        { x: min * endCartesian.x, y: min * endCartesian.y },
        { x: min * startCartesian.x, y: min * startCartesian.y }
    ];
    return [
        'M', points[0].x, points[0].y,
        'A', max, max, 0, 0, 1, points[1].x, points[1].y,
        'L', points[2].x, points[2].y,
        'A', min, min, 0, 0, 0, points[3].x, points[3].y,
        'Z'
    ].join(' ');
})
</script>

<style scoped>
g {
    transition-duration: 0s;
}

.body, .health {
    pointer-events: none;
}
</style>