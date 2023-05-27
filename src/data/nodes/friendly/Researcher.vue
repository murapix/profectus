<template>
    <g transform="rotate(45, 0, 0)"
       @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.5 : 1}"
    >
        <circle
            class="body"
            :r="width/sqrtTwo/2"
            :transform="`translate(${offset} 0)`"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <circle
            class="body"
            :r="width/sqrtTwo/2"
            :transform="`translate(0 ${offset})`"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <circle
            class="body"
            :r="width/sqrtTwo/2"
            :transform="`translate(${-offset} 0)`"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <circle
            class="body"
            :r="width/sqrtTwo/2"
            :transform="`translate(0 ${-offset})`"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <rect
            class="body"
            :width="width * sqrtTwo"
            :height="width * sqrtTwo"
            :transform="`translate(${offset} ${offset})`"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <g v-if="build > 0">
            <path
                class="build"
                :d="buildPath"
                fill="var(--outline)"
            />
            <rect
                class="build"
                :width="width * sqrtTwo - 2"
                :height="width * sqrtTwo - 2"
                :transform="`translate(${offset+1} ${offset+1})`"
                fill="var(--locked)"
            />
        </g>
    </g>
</template>

<script setup lang="ts">
import { types } from 'data/content/types';
import { root } from 'data/projEntry';
import { BoardNode, getNodeProperty } from 'features/boards/board';
import { computed } from 'vue';

const sqrtTwo = Math.sqrt(2);

const props = defineProps<{
    node?: BoardNode;
    size?: number;
    placing?: boolean;
}>();
const width = computed(() => props.size ?? 15);
const offset = computed(() => -width.value*sqrtTwo/2)

const stroke = computed(() => {
    if (props.node === undefined || root.board.draggingNode.value === props.node) {
        return 'var(--outline)';
    }

    const node = props.node;
    if (Object.values(node.buildMaterials).some(amount => amount > 0)) {
        return 'var(--locked)' // TODO: set to --danger when no resources available
    }
    if (node.distance === -1) {
        return 'var(--danger)'
    }
    return 'var(--outline)';
});

const build = computed(() => {
    if (props.node === undefined) return 0;
    if (Object.values(props.node.buildMaterials).every(amount => amount === 0)) return 0;
    
    const building = getNodeProperty(types[props.node.type].building, props.node);
    if (building === undefined) return 0;
    
    const cost = Object.values(building.cost).reduce((a,b) => a+b, 0);
    if (cost === 0) return 0;

    const materialsLeft = Object.values(props.node.buildMaterials).reduce((a,b) => a+b, 0);
    return Math.max(0, 1 - materialsLeft / cost);
});
const buildPath = computed(() => {
    const radius = -offset.value + 2;
    const start = { x: radius, y: radius };
    if (build.value < 0.25) {
        const b = build.value*4;
        return [
            'M', 0, 0,
            'L', start.x, start.y,
            'L', start.x, start.y - 2*radius*b,
            'Z'
        ].join(' ');
    }
    else if (build.value < 0.5) {
        const b = (build.value - 0.25)*4;
        return [
            'M', 0, 0,
            'L', start.x, start.y,
            'L', start.x, -start.y,
            'L', start.x - 2*radius*b, -start.y,
            'Z'
        ].join(' ');
    }
    else if (build.value < 0.75) {
        const b = (build.value - 0.5)*4;
        return [
            'M', 0, 0,
            'L', start.x, start.y,
            'L', start.x, -start.y,
            'L', -start.x, -start.y,
            'L', -start.x, -start.y + 2*radius*b,
            'Z'
        ].join(' ');
    }
    else {
        const b = build.value > 1 ? 1 : (build.value - 0.75)*4;
        return [
            'M', 0, 0,
            'L', start.x, start.y,
            'L', start.x, -start.y,
            'L', -start.x, -start.y,
            'L', -start.x, start.y,
            'L', -start.x + 2*radius*b, start.y,
            'Z'
        ].join(' ');
    }
});

const emit = defineEmits<{
    (type: "select-building"): void;
    (type: "place-building", node: BoardNode): void;
}>();

function mouseUp() {
    if (props.node) {
        if (root.board.draggingNode.value === props.node) {
            emit("place-building", props.node);
        }
    }
    else {
        emit("select-building");
    }
}
</script>

<style scoped>
.body {
   cursor: pointer;
}

.build {
    pointer-events: none;
    transition-duration: 0s;
}
</style>