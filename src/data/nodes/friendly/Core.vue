<template>
    <g transform="rotate(45, 0, 0)"
       :style="{opacity: placing ? 0.5 : 1}"
    >
        <path
            v-if="progress > 0"
            class="progress"
            :d="progressPath"
            fill="var(--foreground)"
        />
        <rect
            class="body"
            :width="width * sqrtTwo"
            :height="width * sqrtTwo"
            :transform="`translate(${offset} ${offset})`"
            fill="var(--locked)"
            :stroke="stroke"
            :stroke-width="strokeWidth"
        />
        <path
            v-if="storage[1] > 0"
            class="storage"
            :d="scrapPath"
            fill="var(--accent1)"
        />
        <rect
            class="storage"
            :width="-innerWidth/2 + strokeWidth"
            :height="-innerWidth/2 + strokeWidth"
            :transform="`translate(${innerWidth/4-strokeWidth/2} ${innerWidth/4-strokeWidth/2})`"
            fill="var(--locked)"
            :stroke="stroke"
            :stroke-width="strokeWidth"
        />
        <path
            v-if="storage[0] > 0"
            class="storage"
            :d="nanitePath"
            fill="var(--outline)"
        />
    </g>
</template>

<script setup lang="ts">
import { buildings } from 'data/content/building';
import { types } from 'data/content/types';
import { BoardNode, getNodeProperty } from 'features/boards/board';
import { computed } from 'vue';

const sqrtTwo = Math.sqrt(2);

const props = defineProps<{
    node?: BoardNode;
    size?: number;
    placing?: boolean;
}>();
const width = computed(() => props.size ?? 10);
const offset = computed(() => -width.value*sqrtTwo/2);
const innerWidth = computed(() => 2*offset.value + strokeWidth);
const outerWidth = computed(() => 2*offset.value - strokeWidth);

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
const strokeWidth = 2;

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
    const innermostWidth = innerWidth.value/2;
    const start = { x: -innermostWidth/2, y: -innermostWidth/2 };
    return (amount < 0.5 ? [
        'M', start.x, start.y,
        'L', start.x + innermostWidth*amount*2, start.y,
        'L', start.x, start.y + innermostWidth*amount*2,
        'Z'
    ] : [
        'M', start.x, start.y,
        'L', start.x + innermostWidth, start.y,
        'L', start.x + innermostWidth, start.y + innermostWidth*(amount-0.5)*2,
        'L', start.x + innermostWidth*(amount-0.5)*2, start.y + innermostWidth,
        'L', start.x, start.y + innermostWidth,
        'Z'
    ]).join(' ');
});
const scrapPath = computed(() => {
    const amount = storage.value[1];
    const start = { x: -innerWidth.value/2, y: -innerWidth.value/2 };
    return (amount < 0.5 ? [
        'M', start.x, start.y,
        'L', start.x, start.y + innerWidth.value*amount*2,
        'L', start.x + innerWidth.value*amount*2, start.y,
        'Z'
    ] : [
        'M', start.x, start.y,
        'L', start.x, start.y + innerWidth.value,
        'L', start.x + innerWidth.value*(amount-0.5)*2, start.y + innerWidth.value,
        'L', start.x + innerWidth.value, start.y + innerWidth.value*(amount-0.5)*2,
        'L', start.x + innerWidth.value, start.y,
        'Z'
    ]).join(' ');
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
const progressPath = computed(() => {
    const radius = -outerWidth.value/2 + strokeWidth;
    const start = { x: radius, y: radius };
    if (progress.value < 0.25) {
        const p = progress.value*4;
        return [
            'M', 0, 0,
            'L', start.x, start.y,
            'L', start.x, start.y - 2*radius*p,
            'Z'
        ].join(' ');
    }
    else if (progress.value < 0.5) {
        const p = (progress.value - 0.25)*4;
        return [
            'M', 0, 0,
            'L', start.x, start.y,
            'L', start.x, -start.y,
            'L', start.x - 2*radius*p, -start.y,
            'Z'
        ].join(' ');
    }
    else if (progress.value < 0.75) {
        const p = (progress.value - 0.5)*4;
        return [
            'M', 0, 0,
            'L', start.x, start.y,
            'L', start.x, -start.y,
            'L', -start.x, -start.y,
            'L', -start.x, -start.y + 2*radius*p,
            'Z'
        ].join(' ');
    }
    else {
        const p = progress.value > 1 ? 1 : (progress.value - 0.75)*4;
        return [
            'M', 0, 0,
            'L', start.x, start.y,
            'L', start.x, -start.y,
            'L', -start.x, -start.y,
            'L', -start.x, start.y,
            'L', -start.x + 2*radius*p, start.y,
            'Z'
        ].join(' ');
    }
})
</script>

<style scoped>
.storage {
    transition-duration: 0s;
}

.progress {
    transition-duration: 0s;
}
</style>