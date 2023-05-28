<template>
    <g transform="rotate(45, 0, 0)"
       @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.5 : 1}"
    >
        <circle
            class="body"
            :class="classes"
            :r="width/sqrtTwo/2"
            :transform="`translate(${offset} 0)`"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <circle
            class="body"
            :class="classes"
            :style="styles[0]"
            :r="width/sqrtTwo/2"
            :transform="`translate(0 ${offset})`"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <circle
            class="body"
            :class="classes"
            :style="styles[1]"
            :r="width/sqrtTwo/2"
            :transform="`translate(${-offset} 0)`"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <circle
            class="body"
            :class="classes"
            :style="styles[2]"
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

const researchTypeCount = computed(() => {
    if (props.node === undefined) return 0;
    if (root.activeResearch.value === "none") return 0;
    return props.node.storage.filter(store => store.amount > 0).length;
});
const classes = computed(() => {
    switch (researchTypeCount.value) {
        default: return [];
        case 1: return ['pulsing', 'pulse-one'];
        case 2: return ['pulsing', 'pulse-two'];
        case 3: return ['pulsing', 'pulse-three'];
        case 4: return ['pulsing', 'pulse-four'];
        case 5: return ['pulsing', 'pulse-five'];
    }
});
const styles = computed(() => {
    switch (researchTypeCount.value) {
        default: return [];
        case 1: return [{animationDelay: "-0.625s"}, {animationDelay: "-1.25s"}, {animationDelay: "-1.875s"}]
        case 2: return [{animationDelay: "-0.5s"}, {animationDelay: "-1s"}, {animationDelay: "-1.5s"}]
        case 3: return [{animationDelay: "-0.375s"}, {animationDelay: "-0.75s"}, {animationDelay: "-1.125s"}]
        case 4: return [{animationDelay: "-0.25s"}, {animationDelay: "-0.5s"}, {animationDelay: "-0.75s"}]
        case 5: return [{animationDelay: "-0.125s"}, {animationDelay: "-0.25s"}, {animationDelay: "-0.375s"}]
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

.pulsing {
    animation: pulsing ease-in infinite alternate;
}

.pulse-one {
    animation-duration: 2.5s;
}

.pulse-two {
    animation-duration: 2s;
}

.pulse-three {
    animation-duration: 1.5s;
}

.pulse-four {
    animation-duration: 1s;
}

.pulse-five {
    animation-duration: 0.5s;
}

@keyframes pulsing {
    0% {
        fill: var(--locked);
    }
    50% {
        fill: var(--foreground);
    }
}
</style>