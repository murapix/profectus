<template>
    <g transform="rotate(45, 0, 0)"
       @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.7 : 1}"
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
        <path
            v-if="storage > 0"
            class="storage"
            :d="storagePath"
            fill="var(--accent1)"
        />
    </g>
</template>

<script setup lang="ts">
import factory from 'data/tabs/factory';
import { BoardNode } from 'features/boards/board';
import { computed } from 'vue';

const sqrtTwo = Math.sqrt(2);

const props = defineProps<{
    node?: BoardNode;
    size?: number;
    placing?: boolean;
}>();
const width = computed(() => props.size ?? 10);
const offset = computed(() => -width.value*sqrtTwo/2)

const stroke = computed(() => {
    if (props.node === undefined || factory.board.draggingNode.value === props.node) {
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
    const innerWidth = 2*offset.value + 1;
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

const emit = defineEmits<{
    (type: "select-building"): void;
    (type: "place-building", event: MouseEvent | TouchEvent, node: BoardNode): void;
}>();

function mouseUp(event: MouseEvent | TouchEvent) {
    if (props.node) {
        emit("place-building", event, props.node);
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

.storage {
    transition-duration: 0s;
}
</style>