<template>
    <div class="ring-container" :style="{top: `${unref(radius)}px`}">
        <template v-for="({ initialAngle, direction, upgrades, original }, side) in sectorData">
            <UpgradeRingSector
                v-if="(typeof original !== 'number')"
                :radius :width :distance :segmentAngle
                :initialAngle :direction :side :upgrades
            />
        </template>
    </div>
    
</template>

<script setup lang="ts">
import { Upgrade } from "features/clickables/upgrade";
import { computed, unref } from "vue";
import UpgradeRingSector from "./UpgradeRingSector.vue";
import { Direction, Side, Sides } from "./UpgradeRingConstants";

const props = defineProps<{
    radius: number;
    width: number;
    distance: number;
    top: number | Upgrade[];
    left: number | Upgrade[];
    bottom: number | Upgrade[];
    right: number | Upgrade[];
}>();

function getSideValue<T>(side: Side, transform: (array: Upgrade[], side: Side) => T, defaultOut?: T): T {
    return typeof props[side] === 'number' ? (defaultOut ?? props[side] as T) : transform(props[side], side);
}

const numSegments = computed(() => Sides.map(side => getSideValue(side, upgrades => upgrades.length)).reduce((a,b) => a+b));
const segmentAngle = computed(() => 2*Math.PI / unref(numSegments));

/**
 * The ring is split into four sectors, one for each cardinal direction.
 * It is also split into segments equal to the total size of all the sectors - the lengths of the arrays + the number-valued sides
 * 
 * Each upgrade's render is split into three sections: the upgrade itself, the ring segment, and the line between the two
 * 
 * Ring Segments:
 *   Each ring segment has an angular size equal to its portion of the whole - with 5 upgrades left and right, and spacers of 5 on top and bottom,
 *   each segment is given 1/20th of the whole circle, aka 18° - with the segment plus its margin fitting within that region.
 *   The inner radius of these segments is the entire ring's radius, and the outer is the ring's width beyond that
 *   - the inner arc is along [r=props.radius], the outer arc at [r=props.radius+props.width]
 * 
 * Upgrades:
 *   Upgrades are placed further out, centered on a circle of radius [r=props.radius+props.width+props.distance] out.
 *   These upgrades have a strict size of 250px*125px, and visible ones are spaced [MARGIN] pixels apart along their circle.
 *   As part of their display, their borders have three sides, with the outside edge blending in with the scene background.
 * 
 * Lines:
 *   Connecting each upgrade and ring segment is a two-part line. One segment crosses the upgrade itself, beginning just below the upgrade's title
 *   - 32px from the top, 8px from the outer edge - and extending horizontally towards the center. A second segment begins from the ring segment,
 *   extending directly outwards along the radius, positioned to meet the horizontal segment at as close to [r=props.radius+2*props.width] as possible.
 *   As the segment must both be a radial line *and* connect to the ring segment, it may extend futher than this expected meeting point in order to
 *   meet the horizontal segment.
 */


const sectorData = {
    [Side.right]:  { initialAngle: 0,           direction:  1, upgrades: getSideValue(Side.right,  upgrades => upgrades, []), original: props[Side.top] },
    [Side.bottom]: { initialAngle: Math.PI/2,   direction:  1, upgrades: getSideValue(Side.bottom, upgrades => upgrades, []), original: props[Side.top] },
    [Side.left]:   { initialAngle: Math.PI,     direction: -1, upgrades: getSideValue(Side.left,   upgrades => upgrades, []), original: props[Side.top] },
    [Side.top]:    { initialAngle: Math.PI*3/2, direction: -1, upgrades: getSideValue(Side.top,    upgrades => upgrades, []), original: props[Side.top] }
} satisfies Record<Side, { initialAngle: number, direction: Direction, upgrades: Upgrade[], original: number | Upgrade[] }>;
</script>

<style scoped>
.ring-container {
    pointer-events: none;
    position: relative;
    width: max-content;
    min-height: max-content;
}
</style>