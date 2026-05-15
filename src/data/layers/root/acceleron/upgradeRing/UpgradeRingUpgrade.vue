<template>
    <div :id="`${upgrade.id}-upgrade`">
        <component :is="render(upgrade)"
            :style="{...position, width: UPGRADE_SIZE.width, minHeight: UPGRADE_SIZE.height }"
             class="ring-upgrade"
            :class="side"
            @mouseenter="$emit('mouseenter')"
            @mouseleave="$emit('mouseleave')"
        />
    </div>
</template>

<script setup lang="ts">
import { Upgrade } from 'features/clickables/upgrade';
import { render } from 'util/vue';
import { Direction, LinePlacementData, MARGIN, Side, UPGRADE_SIZE } from './UpgradeRingConstants';

const props = defineProps<{
    angle: number;
    radius: number;
    distance: number;
    side: Side;
    upgrade: Upgrade;
    segmentAngle: number;
    initialAngle: number;
    direction: Direction;
    placementData: LinePlacementData;
}>();

const isLeft = Math.cos(props.angle) < 0;

const distance = (() => {
    if (props.angle === 0) return props.radius;
    const segmentIndex = (props.initialAngle + props.direction * props.angle) / props.segmentAngle;
    const height = (UPGRADE_SIZE.height + MARGIN) * segmentIndex;
    return height / Math.sin(props.angle);
})();

const offset = (() => {
    const outerPos = Math.cos(props.angle) * distance;
    const innerPos = Math.cos(props.angle) * props.radius;

    const minOrMax = isLeft ? 'min' : 'max';
    const boundary = isLeft ? -props.distance : props.distance;
    const offset = {
        x: Math[minOrMax](outerPos - innerPos, boundary) + innerPos - UPGRADE_SIZE.width/2,
        y: Math.sin(props.angle) * distance
    }
    return offset;
})();

props.placementData.outerCornerPos.y.value = offset.y - UPGRADE_SIZE.height/2;
props.placementData.outerCornerPos.x.value = offset.x + (isLeft ? -UPGRADE_SIZE.width/2 : UPGRADE_SIZE.width/2);

const position = {
    top: `${offset.y - UPGRADE_SIZE.height/2}px`,
    left: `${offset.x - UPGRADE_SIZE.width/2}px`
}
</script>

<style scoped>
:deep(.ring-upgrade.ring-upgrade) {
    pointer-events: all;
    
    margin: 0;
    padding: 5px 10px;
    width: 250px;
    min-height: 125px;
    
    position: absolute;
    top: 0;
    left: 0;

    border-radius: 0;
    border-width: 2px;
}

:deep(.ring-upgrade.left) {
    text-align: left;
    border-style: solid solid solid none;
    background: linear-gradient(to right, var(--transparent), var(--quarter-transparent));
}

:deep(.ring-upgrade.right) {
    text-align: right;
    border-style: solid none solid solid;
    background: linear-gradient(to left, var(--transparent), var(--quarter-transparent));
}

:deep(.ring-upgrade.locked) {
    border-color: var(--locked);
    color: var(--locked);
}

:deep(.ring-upgrade.can) {
    border-color: var(--feature-background);
    color: var(--feature-background);
}

:deep(.ring-upgrade.bought) {
    border-color: var(--bought);
    color: var(--bought);
}

:deep(.ring-upgrade.can:hover), :deep(.ring-upgrade.can.hover) {
    transform: none;
    box-shadow: inset 0 0 20px var(--feature-background);
}
</style>