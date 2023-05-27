<template>
    <g @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.5 : 1}"
    >
        <circle
            class="body"
            :r="size ?? 10"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <g v-if="build > 0" transform="rotate(90, 0, 0) scale(1, -1)">
            <circle
                class="build"
                :r="size ?? 10"
                fill="none"
                stroke="var(--outline)"
                stroke-width=2
                pathLength=1
                stroke-dasharray="1"
                :stroke-dashoffset="1-build"
            />
        </g>
    </g>
</template>

<script setup lang="ts">
import { types } from 'data/content/types';
import { root } from 'data/projEntry';
import { BoardNode, getNodeProperty } from 'features/boards/board';
import { computed } from 'vue';

const props = defineProps<{
    node?: BoardNode;
    size?: number;
    placing?: boolean;
}>();

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