<template>
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
        <path
            v-if="storage[0] > 0"
            class="storage"
            :d="nanitePath"
            fill="var(--accent1)"
        />
        <path
            v-if="storage[1] > 0"
            class="storage"
            :d="scrapPath"
            fill="var(--accent1)"
        />
        <line
            :x1="width * sqrtTwo / 2"
            :y1="width * sqrtTwo / 2"
            :x2="-width * sqrtTwo / 2"
            :y2="-width * sqrtTwo / 2"
            :stroke="stroke"
            stroke-width=2
        />
    </g>
</template>

<script setup lang="ts">
import { buildings } from 'data/content/building';
import { BoardNode } from 'features/boards/board';
import { computed } from 'vue';

const sqrtTwo = Math.sqrt(2);

const props = defineProps<{
    node?: BoardNode;
    size?: number;
    placing?: boolean;
}>();
const width = computed(() => props.size ?? 10);
const offset = computed(() => -width.value*sqrtTwo/2);
const innerWidth = computed(() => 2*offset.value + 2);

const stroke = computed(() => {
    if (props.node === undefined) {
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
    const storage = buildings.core.storage!;
    if (props.node === undefined) {
        return Array.from<number>({length: storage.length}).fill(0);
    }

    const node = props.node;
    const amounts = [] as number[];
    for (let i = 0; i < storage.length; i++) {
        const store = storage[i];
        amounts[i] = node.storage[i].amount / (store.limit === "node" ? (node.storage[i].limit ?? 1) : store.limit);
        if (amounts[i] < 0) amounts[i] = 0;
        if (amounts[i] > 1) amounts[i] = 1;
    }
    return amounts;
});
const nanitePath = computed(() => {
    const amount = storage.value[0];
    const start = { x: -innerWidth.value/2, y: -innerWidth.value/2 };
    return (amount < 0.5 ? [
        'M', start.x, start.y,
        'L', start.x + innerWidth.value*amount*2, start.y,
        'L', start.x + innerWidth.value*amount, start.y + innerWidth.value*amount,
        'Z'
    ] : [
        'M', start.x, start.y,
        'L', start.x + innerWidth.value, start.y,
        'L', start.x + innerWidth.value, start.y + innerWidth.value*(amount-0.5)*2,
        'L', innerWidth.value*(amount-0.5), innerWidth.value*(amount-0.5),
        'Z'
    ]).join(' ');
});
const scrapPath = computed(() => {
    const amount = storage.value[1];
    const start = { x: -innerWidth.value/2, y: -innerWidth.value/2 };
    return (amount < 0.5 ? [
        'M', start.x, start.y,
        'L', start.x, start.y + innerWidth.value*amount*2,
        'L', start.x + innerWidth.value*amount, start.y + innerWidth.value*amount,
        'Z'
    ] : [
        'M', start.x, start.y,
        'L', start.x, start.y + innerWidth.value,
        'L', start.x + innerWidth.value*(amount-0.5)*2, start.y + innerWidth.value,
        'L', innerWidth.value*(amount-0.5), innerWidth.value*(amount-0.5),
        'Z'
    ]).join(' ');
});

const emit = defineEmits<{
    (type: "select", event: MouseEvent | TouchEvent): void;
    (type: "click", event: MouseEvent | TouchEvent, node: BoardNode): void;
}>();

function mouseUp(event: MouseEvent | TouchEvent) {
    if (props.node) {
        emit("click", event, props.node);
    }
    else {
        emit("select", event);
    }
}
</script>

<style scoped>
.storage {
    transition-duration: 0s;
}
</style>