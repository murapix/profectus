<template>
    <svg class="ring-segment"
        :id="`${upgrade.id}-ring`"
        v-if="isVisible(upgrade.visibility ?? true)"

        :width="width"
        :height="height"
        :style="{ ...position, '--shadow-id': `url(#${upgrade.id}-shadow)` }"

        @mouseenter="$emit('mouseenter')"
        @mouseleave="$emit('mouseleave')"
        @click="upgrade.purchase"
    >
        <path :d="path"
              :stroke="color"
              :strokeWidth="`${BORDER_WIDTH}px`"
               fill="var(--background)"
              :class="{ can: unref(upgrade.canPurchase) }" />
        <filter :id="`${upgrade.id}-shadow`">
            <feOffset dx="0" dy="0" />
            <feGaussianBlur stdDeviation="0" result="offset-blur">
                <animate attributeName="stdDeviation" restart="whenNotActive" fill="freeze" to="6" dur="0.5s" begin="indefinite" />
                <animate attributeName="stdDeviation" restart="whenNotActive" fill="freeze" to="0" dur="0.5s" begin="indefinite" />
            </feGaussianBlur>
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood :floor-color="color" floodOpacity="1" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
    </svg>
</template>

<script setup lang="ts">
import { Upgrade } from 'features/clickables/upgrade';
import { isVisible } from 'features/feature';
import { unref } from 'vue';
import { MARGIN, BORDER_WIDTH, LinePlacementData } from './UpgradeRingConstants';

const props = defineProps<{
    innerRadius: number;
    outerRadius: number;
    angularWidth: number;
    rotation: number;
    color: string;
    upgrade: Upgrade;
    placementData: LinePlacementData;
}>();

const innerAngularWidth = (props.innerRadius * props.angularWidth - (MARGIN+BORDER_WIDTH)) / props.innerRadius;
const outerAngularWidth = (props.outerRadius * props.angularWidth - (MARGIN+BORDER_WIDTH)) / props.outerRadius;

const points = (() => {
    const innerMin = [props.rotation - innerAngularWidth/2, props.innerRadius];
    const innerMax = [props.rotation + innerAngularWidth/2, props.innerRadius];
    const outerMin = [props.rotation - outerAngularWidth/2, props.outerRadius];
    const outerMax = [props.rotation + outerAngularWidth/2, props.outerRadius];

    props.placementData.segmentAngleLimits.min.value = outerMin[0];
    props.placementData.segmentAngleLimits.max.value = outerMax[0];

    return [innerMin, innerMax, outerMax, outerMin].map(([angle, radius]) => 
        ({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
    );
})();

const bounds = (() => {
    const bounds = {
        minX: Math.min(...points.map(point => point.x)),
        minY: Math.min(...points.map(point => point.y)),

        maxX: Math.max(...points.map(point => point.x)),
        maxY: Math.max(...points.map(point => point.y))
    };
    // If we cross one of the axes, the arcs actually extend slightly further out than the corner points
    // So we extend the boundaries to contain this extra distance
    if (Math.sign(bounds.minY) !== Math.sign(bounds.maxY)) { // crossing the horizontal axis
        // left is -X, right is +X
        if (bounds.minX < 0) bounds.minX = -props.outerRadius;
        else bounds.maxX = props.outerRadius;
    }
    else if (Math.sign(bounds.minX) !== Math.sign(bounds.maxY)) { // crossing the vertical axis
        // up is -Y, down is +Y
        if (bounds.minY < 0) bounds.minY = -props.outerRadius;
        else bounds.maxY = props.outerRadius;
    }
    return bounds;
})();

const width = bounds.maxX - bounds.minX + BORDER_WIDTH;
const height = bounds.maxY - bounds.minY + BORDER_WIDTH;
const position = { top: `${bounds.minY - BORDER_WIDTH/2}px`, left: `${bounds.minX - BORDER_WIDTH/2}px` };

const path = (() => {
    // need to offset the points to fit the placed SVG
    const p = points.map(point => ({
        x: point.x - bounds.minX + BORDER_WIDTH/2,
        y: point.y - bounds.minY + BORDER_WIDTH/2
    }));

    return [
        `M ${p[0].x} ${p[0].y}`,
        `A ${props.innerRadius} ${props.innerRadius} 0 0 1 ${p[1].x} ${p[1].y}`,
        `L ${p[2].x} ${p[2].y}`,
        `A ${props.outerRadius} ${props.outerRadius} 0 0 0 ${p[3].x} ${p[3].y}`,
        `Z`
    ].join(' ');
})();
</script>

<style scoped>
.ring-segment {
    pointer-events: fill;
    position: absolute;
    top: 0;
    left: 0;

    > :deep(.can) {
        transform: none;
        filter: var(--shadow-id);
    }
}
</style>