<template>
    <g @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.5 : 1}"
    >
        <g transform="rotate(45, 0, 0)">
            <rect
                class="body"
                :width="width * sqrtTwo"
                :height="width * sqrtTwo"
                :transform="`translate(${-width*sqrtTwo/2} ${-width*sqrtTwo/2})`"
                fill="var(--locked)"
                :stroke="stroke"
                stroke-width=2
            />
        </g>
        <circle
            class="body"
            :r="width/sqrtTwo - 1"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <g v-if="build > 0" transform="rotate(90, 0, 0) scale(1, -1)">
            <circle
                class="build"
                :r="width/sqrtTwo - 1"
                fill="none"
                stroke="var(--outline)"
                stroke-width=2
                pathLength=1
                stroke-dasharray="1"
                :stroke-dashoffset="1-build"
            />
        </g>
        <g v-if="storage > 0">
            <path
                class="storage"
                :d="storagePath"
                fill="var(--accent1)"
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
const width = computed(() => props.size ?? 20);

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

const storage = computed(() => {
    if (props.node === undefined) {
        return 0;
    }

    const node = props.node;
    const building = getNodeProperty(types[node.type].building, node);
    if (building === undefined) return 0;

    return node.storage[0].amount / (building.storage![0].limit as number)
});
const storagePath = computed(() => {
    const radius = width.value/sqrtTwo - 2;
    const storageHeight = 2 * radius * (storage.value - 0.5);
    const storageWidth = Math.sqrt(radius*radius - storageHeight*storageHeight);
    if (storage.value >= 1) {
        return [
            'M', radius, 0,
            'A', radius, radius, 0, 0, 0, -radius, 0,
            'A', radius, radius, 0, 0, 0, radius, 0
        ].join(' ')
    }
    else if (storage.value < 0.5) {
        return [
            'M', -storageWidth, -storageHeight,
            'A', radius, radius, 0, 0, 0, storageWidth, -storageHeight,
            'Z'
        ].join(' ');
    }
    else {
        return [
            'M', -storageWidth, -storageHeight,
            'A', radius, radius, 0, 1, 0, storageWidth, -storageHeight,
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