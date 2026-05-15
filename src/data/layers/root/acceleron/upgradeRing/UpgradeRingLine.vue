<template>
    <svg class="ring-line"
        :width="size.width.value"
        :height="size.height.value"
        :style="position"
        v-if="isVisible(upgrade.visibility ?? true)"
    >
        <path :d="path"
              :stroke="color"
              :strokeWidth="`${BORDER_WIDTH}px`"
              fill="none"
        />
    </svg>
</template>

<script setup lang="ts">
import { Upgrade } from 'features/clickables/upgrade';
import { BORDER_WIDTH, LINE_START_OFFSET, LinePlacementData, MARGIN, UPGRADE_SIZE } from './UpgradeRingConstants';
import { isVisible } from 'features/feature';
import { computed } from 'vue';
import { clamp } from 'util/util';

const props = defineProps<{
    outerSegmentRadius: number;
    lineBendDistance: number;
    placementData: LinePlacementData;
    color: string;
    upgrade: Upgrade;
}>();

const isLeft = computed(() => props.placementData.outerCornerPos.x.value < 0);
const horizontalSegmentHeight = computed(() => props.placementData.outerCornerPos.y.value - LINE_START_OFFSET.y);
const radialSegmentAngle = computed(() => {
    // line segments *want* to meet at r=[radius+distance] and y=[horiz_height]
    // both x and angle are unknown, but from trig: sin(θ) = height/hypotenuse
    // therefore sin(angle) = horiz_height/(radius+distance)
    let hopefulAngle = Math.asin(horizontalSegmentHeight.value / (props.outerSegmentRadius + props.lineBendDistance));
    // arcsine assumes we are in [-pi/2, pi/2], but if we're on the right we're on [0,pi/2]+[3pi/2, 2pi],
    // and on the left we're on [pi/2, 3pi/2]
    if (isLeft.value) hopefulAngle += Math.PI;
    if (hopefulAngle < 0) hopefulAngle += 2*Math.PI;

    const { min, max } = props.placementData.segmentAngleLimits;
    return clamp(hopefulAngle, min.value, max.value);
});
const meetingRadius = computed(() => horizontalSegmentHeight.value / Math.sin(radialSegmentAngle.value));

const points = [
    computed(() => ({ x: props.placementData.outerCornerPos.x.value + LINE_START_OFFSET.x, y: horizontalSegmentHeight.value })),
    computed(() => ({ x: Math.cos(radialSegmentAngle.value) * meetingRadius.value, y: horizontalSegmentHeight.value })),
    computed(() => ({ x: Math.cos(radialSegmentAngle.value) * props.outerSegmentRadius, y: Math.sin(radialSegmentAngle.value) * props.outerSegmentRadius }))
];

const bounds = {
    minX: computed(() => Math.min(...points.map(point => point.value.x))),
    minY: computed(() => Math.min(...points.map(point => point.value.y))),

    maxX: computed(() => Math.max(...points.map(point => point.value.x))),
    maxY: computed(() => Math.max(...points.map(point => point.value.y)))
}

const size = {
    width: computed(() => bounds.maxX.value - bounds.minX.value + BORDER_WIDTH),
    height: computed(() => bounds.maxY.value - bounds.minY.value + BORDER_WIDTH)
}

const position = computed(() => ({
    top: `${bounds.minY.value - BORDER_WIDTH/2}px`,
    left: `${bounds.minX.value - BORDER_WIDTH/2}px`
}));

const path = computed(() => {
    const p = points.map(point => ({
        x: point.value.x - bounds.minX.value + BORDER_WIDTH/2,
        y: point.value.y - bounds.minY.value + BORDER_WIDTH/2
    }));
    return [
        `M ${p[0].x} ${p[0].y}`,
        `L ${p[1].x} ${p[1].y}`,
        `L ${p[2].x} ${p[2].y}`
    ].join(' ');
});
</script>

<style scoped>
.ring-line {
    position: absolute;
    top: 0;
    left: 0;
}
</style>