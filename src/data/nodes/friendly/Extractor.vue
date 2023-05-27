<template>
    <Scrap
        v-if="node !== undefined && root.board.draggingNode.value !== node"
        :size="getNodeProperty(types[BoardNodeType.Scrap].size, node)"
    />
    <g transform="rotate(45, 0, 0)"
       @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.5 : 1}"
    >
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
        <path
            v-if="storage > 0"
            class="storage"
            :d="storagePath"
            fill="var(--accent1)"
        />
    </g>
</template>

<script setup lang="ts">
import { root } from 'data/projEntry';
import { BoardNode, getNodeProperty } from 'features/boards/board';
import { computed } from 'vue';
import { types, BoardNodeType } from 'data/content/types';
import Scrap from '../neutral/Scrap.vue';

const sqrtTwo = Math.sqrt(2);

const props = defineProps<{
    node?: BoardNode;
    size?: number;
    placing?: boolean;
}>();
const width = computed(() => props.size ?? 10);
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

const storage = computed(() => {
    if (props.node === undefined) {
        return 0;
    }

    const node = props.node;
    return node.storage[0].amount / (node.storage[0].limit ?? 100)
});
const storagePath = computed(() => {
    const innerWidth = 2*offset.value + 2;
    if (storage.value < 0.5) {
        const start = { x: -innerWidth/2, y: -innerWidth/2 };
        return [
            'M', start.x, start.y,
            'L', start.x + innerWidth*storage.value*2, start.y,
            'L', start.x, start.y + innerWidth*storage.value*2,
            'Z'
        ].join(' ');
    }
    else {
        const start = { x: -innerWidth/2, y: -innerWidth/2 };
        return [
            'M', start.x, start.y,
            'L', start.x + innerWidth, start.y,
            'L', start.x + innerWidth, start.y + innerWidth*(storage.value-0.5)*2,
            'L', start.x + innerWidth*(storage.value-0.5)*2, start.y + innerWidth,
            'L', start.x, start.y + innerWidth,
            'Z'
        ].join(' ');
    }
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
})

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

.storage {
    transition-duration: 0s;
}
</style>