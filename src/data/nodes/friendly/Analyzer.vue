<template>
    <g @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.5  :1}"
    >
        <g transform="rotate(45, 0, 0)">
            <rect
                class="body"
                :width="width * sqrtTwo / 2"
                :height="width * sqrtTwo / 2"
                :transform="`translate(${-width*sqrtTwo/2} ${-width*sqrtTwo/2})`"
                fill="var(--locked)"
                :stroke="stroke"
                stroke-width=2
            />
            <rect
                class="body"
                :width="width * sqrtTwo / 2"
                :height="width * sqrtTwo / 2"
                fill="var(--locked)"
                :stroke="stroke"
                stroke-width=2
            />
            <path
                v-if="progress > 0 && progress < 0.5 + progressSpread"
                class="progress"
                :d="progressPathOne"
                stroke="var(--foreground)"
                stroke-width=2
            />
            <path
                v-if="progress > 0.5 - progressSpread"
                class="progress"
                transform="rotate(90, 0, 0) scale(-1, 1)"
                :d="progressPathTwo"
                stroke="var(--foreground)"
                stroke-width=2
            />
            <rect
                class="body"
                :width="width * sqrtTwo / 2 - 2"
                :height="width * sqrtTwo / 2 - 2"
                :transform="`translate(${-width*sqrtTwo/2+1} ${-width*sqrtTwo/2+1})`"
                fill="var(--locked)"
            />
            <rect
                class="body"
                :width="width * sqrtTwo / 2 - 2"
                :height="width * sqrtTwo / 2 - 2"
                :transform="`translate(1 1)`"
                fill="var(--locked)"
            />
        </g>
        <circle
            class="body"
            :r="width/2"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
        <g v-if="build > 0" transform="rotate(90, 0, 0) scale(1, -1)">
            <circle
                class="build"
                :r="width/2"
                fill="none"
                stroke="var(--outline)"
                stroke-width=2
                pathLength=1
                stroke-dasharray="1"
                :stroke-dashoffset="1-build"
            />
        </g>
        <circle
            v-if="showRange"
            r="100"
            fill="none"
            stroke="var(--outline)"
            stroke-width=2
        />
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
const progressSpread = 0.05;

const showRange = computed(() => {
    if (props.placing) return true;
    if (props.node === undefined) return false;
    if (root.board.selectedNode.value === props.node) return true;
    return false;
})

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

const progress = computed(() => {
    if (props.node === undefined) return 0;
    if (props.node.state === undefined) return 0;

    const timeLeft = (props.node.state as { timeLeft: number }).timeLeft;
    if (timeLeft <= 0) return 0;
    if (timeLeft >= 1) return 0;
    return 1 - timeLeft;
});

const progressPathOne = computed(() => {
    const radius = (width.value * sqrtTwo) / 2;
    let startAngle = (progress.value - progressSpread) * 2;
    let endAngle = (progress.value + progressSpread) * 2;
    let path = [] as (string|number)[];
    if (startAngle < 0) startAngle = 0;
    if (endAngle > 1) endAngle = 1;
    if (startAngle < 0.25) {
        path.push('M', 0, radius*startAngle*4);
        if (endAngle > 0.25) {
            path.push('L', 0, radius,
                        'L', radius*(endAngle-0.25)*4, radius);
        }
        else {
            path.push('L', 0, radius*endAngle*4);
        }
    }
    else if (startAngle < 0.5) {
        path.push('M', radius*(startAngle-0.25)*4, radius);
        if (endAngle > 0.5) {
            path.push('L', radius, radius,
                        'L', radius, radius - radius*(endAngle-0.5)*4);
        }
        else {
            path.push('L', radius*(endAngle-0.25)*4, radius);
        }
    }
    else if (startAngle < 0.75) {
        path.push('M', radius, radius - radius*(startAngle-0.5)*4);
        if (endAngle > 0.75) {
            path.push('L', radius, 0,
                        'L', radius - radius*(endAngle-0.75)*4, 0);
        }
        else {
            path.push('L', radius, radius - radius*(endAngle-0.5)*4);
        }
    }
    else {
        path.push('M', radius - radius*(startAngle-0.75)*4, 0,
                    'L', radius - radius*(endAngle-0.75)*4, 0);
    }
    path.push('L', radius/2, radius/2,
                'Z');
    return path.join(' ');
});

const progressPathTwo = computed(() => {
    const radius = (width.value * sqrtTwo) / 2;
    let startAngle = (progress.value - 0.5 - progressSpread) * 2;
    let endAngle = (progress.value - 0.5 + progressSpread) * 2;
    let path = [] as (string|number)[];
    if (startAngle < 0) startAngle = 0;
    if (endAngle > 1) endAngle = 1;
    if (startAngle < 0.25) {
        path.push('M', 0, radius*startAngle*4);
        if (endAngle > 0.25) {
            path.push('L', 0, radius,
                        'L', radius*(endAngle-0.25)*4, radius);
        }
        else {
            path.push('L', 0, radius*endAngle*4);
        }
    }
    else if (startAngle < 0.5) {
        path.push('M', radius*(startAngle-0.25)*4, radius);
        if (endAngle > 0.5) {
            path.push('L', radius, radius,
                        'L', radius, radius - radius*(endAngle-0.5)*4);
        }
        else {
            path.push('L', radius*(endAngle-0.25)*4, radius);
        }
    }
    else if (startAngle < 0.75) {
        path.push('M', radius, radius - radius*(startAngle-0.5)*4);
        if (endAngle > 0.75) {
            path.push('L', radius, 0,
                        'L', radius - radius*(endAngle-0.75)*4, 0);
        }
        else {
            path.push('L', radius, radius - radius*(endAngle-0.5)*4);
        }
    }
    else {
        path.push('M', radius - radius*(startAngle-0.75)*4, 0,
                    'L', radius - radius*(endAngle-0.75)*4, 0);
    }
    path.push('L', radius/2, radius/2,
                'Z');
    return path.join(' ');
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

.progress {
    transition-duration: 0s;
}

.storage {
    transition-duration: 0s;
}
</style>