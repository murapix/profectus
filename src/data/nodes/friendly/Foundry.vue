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
            v-if="storage[0] > 0"
            class="storage"
            :d="inputPath"
            fill="var(--accent1)"
        />
        <path
            v-if="storage[1] > 0"
            class="storage"
            :d="outputPath"
            fill="var(--accent1)"
        />
        <path
            class="body"
            :d="columnPath"
            fill="var(--locked)"
        />
        <g transform="rotate(135, 0, 0)">
            <rect
                v-if="progress > 0"
                class="progress"
                :width="progressSize.width"
                :height="progressSize.height*progress"
                :transform="`translate(${-progressSize.width/2} ${-progressSize.height/2})`"
                fill="var(--foreground)"
            />
        </g>
        <path
            class="body"
            :d="columnPath"
            :stroke="stroke"
            stroke-width=2
            fill="none"
        />
    </g>
</template>

<script setup lang="ts">
import { buildings } from 'data/content/building';
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
const offset = computed(() => -width.value*sqrtTwo/2);

const stroke = computed(() => {
    if (props.node === undefined || root.board.draggingNode.value === props.node) {
        return 'var(--outline)';
    }

    const node = props.node;
    if (Object.values(node.buildMaterials).some(amount => amount > 0)) {
        return 'var(--locked)';
    }
    if (node.distance === -1) {
        return 'var(--danger)';
    }
    return 'var(--outline)';
});

const columnPath = computed(() => {
    const radius = width.value/12 * sqrtTwo;
    const corner = { x: -offset.value-1, y: -offset.value-1 };
    return [
        'M', corner.x, corner.y,
        'M', corner.x+radius, corner.y-radius,
        'A', radius, radius, 0, 0, 1, corner.x-radius, corner.y+radius,
        'L', -corner.x-radius, -corner.y+radius,
        'A', radius, radius, 0, 0, 1, -corner.x+radius, -corner.y-radius,
        'Z'
    ].join(' ');
});
const progress = computed(() => {
    if (props.node === undefined) return 0;
    if (props.node.activeRecipe === undefined) return 0;
    if (props.node.recipeTime <= 0) return 0;

    const building = getNodeProperty(types[props.node.type].building, props.node);
    if (building === undefined) return 0;
    if (building.recipes === undefined) return 0;

    return Math.max(0, 1 - props.node.recipeTime / building.recipes[props.node.activeRecipe].duration);
});
const progressSize = computed(() => ({
    width: width.value/6 * sqrtTwo,
    height: 1.5*width.value*sqrtTwo
}));

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
    const radius = -offset.value + 1;
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

const storage = computed(() => {
    const storage = buildings.foundry.storage!;
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
const inputPath = computed(() => {
    const amount = storage.value[0];
    const innerWidth = 2*offset.value + 2;
    const start = { x: -innerWidth/2, y: -innerWidth/2 };
    return (amount < 0.5 ? [
        'M', start.x, start.y,
        'L', start.x + innerWidth*amount*2, start.y,
        'L', start.x + innerWidth*amount, start.y + innerWidth*amount,
        'Z'
    ] : [
        'M', start.x, start.y,
        'L', start.x + innerWidth, start.y,
        'L', start.x + innerWidth, start.y + innerWidth*(amount-0.5)*2,
        'L', innerWidth*(amount-0.5), innerWidth*(amount-0.5),
        'Z'
    ]).join(' ');
});
const outputPath = computed(() => {
    const amount = storage.value[1];
    const innerWidth = 2*offset.value + 2;
    const start = { x: -innerWidth/2, y: -innerWidth/2 };
    return (amount < 0.5 ? [
        'M', start.x, start.y,
        'L', start.x, start.y + innerWidth*amount*2,
        'L', start.x + innerWidth*amount, start.y + innerWidth*amount,
        'Z'
    ] : [
        'M', start.x, start.y,
        'L', start.x, start.y + innerWidth,
        'L', start.x + innerWidth*(amount-0.5)*2, start.y + innerWidth,
        'L', innerWidth*(amount-0.5), innerWidth*(amount-0.5),
        'Z'
    ]).join(' ');
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