import { Ref } from "vue";

export const MARGIN = 5;
export const BORDER_WIDTH = 2;

// Upgrade ring upgrades are a static pixel size
export const UPGRADE_SIZE = { width: 250, height: 125 };

// Each upgrade's line begins 32px down and 8px in from the outer top corner
export const LINE_START_OFFSET = { x: 8, y: 32 };

export const enum Side {
    top = 'top', left = 'left', bottom = 'bottom', right = 'right'
}
export const Sides = [Side.top, Side.left, Side.bottom, Side.right];

export enum Direction { 
    clockwise = 1, counterclockwise = -1
}

export type LinePlacementData = {
    outerCornerPos: { x: Ref<number>, y: Ref<number> },
    segmentAngleLimits: { min: Ref<number>, max: Ref<number> }
}