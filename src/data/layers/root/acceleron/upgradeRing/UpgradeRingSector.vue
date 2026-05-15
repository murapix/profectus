<template>
    <template v-for="(upgrade, index) in upgrades" :key="upgrade.id">
        <UpgradeRingSegment
            :innerRadius="radius"
            :outerRadius="radius+width"
            :angularWidth="segmentAngle"
            :rotation="angles[index]"
            :color="colors[index]"
            :upgrade
            @mouseenter="onMouseEnter(upgrade.id)"
            @mouseleave="onMouseLeave(upgrade.id)"
            :placementData="linePlacementData[index]"
        />
        <UpgradeRingUpgrade
            :initialAngle
            :segmentAngle
            :direction
            :angle="angles[index]"
            :radius
            :distance
            :side
            :upgrade
            @mouseenter="onMouseEnter(upgrade.id)"
            @mouseleave="onMouseLeave(upgrade.id)"
            :placementData="linePlacementData[index]"
        />
        <UpgradeRingLine
            :outerSegmentRadius="radius+width"
            :lineBendDistance="width"
            :placementData="linePlacementData[index]"
            :color="colors[index]"
            :upgrade
        />
    </template>
</template>

<script setup lang="ts">
import { Upgrade } from 'features/clickables/upgrade';
import { isVisible } from 'features/feature';
import UpgradeRingSegment from './UpgradeRingSegment.vue';
import UpgradeRingLine from './UpgradeRingLine.vue';
import UpgradeRingUpgrade from './UpgradeRingUpgrade.vue';
import { ref, unref } from 'vue';
import { Direction, LinePlacementData, Side } from './UpgradeRingConstants';

const props = defineProps<{
    radius: number;
    width: number;
    distance: number;
    segmentAngle: number;
    initialAngle: number;
    direction: Direction;
    side: Side;
    upgrades: Upgrade[];
}>();

const visibleSegments = props.upgrades.filter(upgrade => isVisible(upgrade.visibility ?? true)).length;
const sectorOffset = visibleSegments/2 * props.segmentAngle;

const indices = props.upgrades.map((_, index): number => {
    if (index === 0) return 0;
    return indices[index-1] + (isVisible(props.upgrades[index-1].visibility ?? true) ? 1 : 0);
});
const angles = props.upgrades.map((_, index) => {
    const segmentOffset = indices[index] * props.segmentAngle;
    // add half a segment so the angle points at the segment's midline
    const totalOffset = segmentOffset - sectorOffset + props.segmentAngle/2;
    return props.initialAngle + props.direction*totalOffset;
});

const colors = props.upgrades.map(upgrade => {
    if (unref(upgrade.bought)) return `var(--bought)`;
    if (unref(upgrade.canPurchase)) return `var(--feature-background)`;
    return `var(--locked)`;
});

const linePlacementData = props.upgrades.map(() => ({
    outerCornerPos: { x: ref(NaN), y: ref(NaN) },
    segmentAngleLimits: { min: ref(NaN), max: ref(NaN) }
}) as LinePlacementData);

const { onMouseEnter, onMouseLeave } = (() => {
    let upgrade: Record<string, Element | null> = {};
    let hoverAnimation: Record<string, SVGAnimateElement | null> = {};
    let unhoverAnimation: Record<string, SVGAnimateElement | null> = {};

    function onMouseEnter(id: string) {
        upgrade[id] ??= document.querySelector(`#${id}-upgrade > *`);
        hoverAnimation[id] ??= document.querySelector<SVGAnimateElement>(`#${id}-ring animate:first-child`);
        
        hoverAnimation[id]?.beginElement();
        upgrade[id]?.classList.add("hover");
    }
    function onMouseLeave(id: string) {
        upgrade[id] ??= document.querySelector(`#${id}-upgrade > *`);
        unhoverAnimation[id] ??= document.querySelector<SVGAnimateElement>(`#${id}-ring animate:last-child`);
        
        unhoverAnimation[id]?.beginElement();
        upgrade[id]?.classList.remove("hover");
    }
    return { onMouseEnter, onMouseLeave };
})();
</script>