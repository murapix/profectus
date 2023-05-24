import { CoercableComponent, Visibility } from "features/feature";
import { computed } from "vue";
import factory from "../tabs/factory";
import { Alignment, types } from "./types";
import { ProcessedComputable } from "util/computed";

export enum Resources {
    Empty = "empty",
    Nanites = "nanites",
    Scrap = "scrap",
    Plates = "plates",
    CircleResearch = "circleResearch",
    SquareResearch = "squareResearch",
    DiamondResearch = "diamondResearch",
    TriangleResearch = "triangleResearch",
    TriangleResearch2 = "triangleResearch2"
}

export const amounts = computed(() => {
    const nodes = factory.board.nodes.value;

    const amounts: Partial<Record<Resources, number>> = {};
    for (const node of nodes) {
        const nodeType = types[node.type];
        if (nodeType.alignment !== Alignment.Friendly) continue;
        if (!nodeType.building) continue;
        
        const building = nodeType.building;
        if (!building.storage) continue;
        
        for (const storage of node.storage) {
            if (amounts[storage.resource] === undefined) amounts[storage.resource] = 0;
            amounts[storage.resource]! += storage.amount;
        }
    }
    return amounts;
})

export const resources: Record<Resources, ResourceDisplay> = {
    [Resources.Empty]: {
        name: "Empty",
        symbol: '',
        visibility: false
    },
    [Resources.Nanites]: {
        name: "Nanites",
        symbol: '🔗&#xFE0E;'
    },
    [Resources.Scrap]: {
        name: "Scrap",
        symbol: '<div style="transform: rotate(45deg)">📎&#xFE0E;</div>'
    },
    [Resources.Plates]: {
        name: "Metal Plates",
        symbol: '<div style="transform: rotate(45deg)">🔶&#xFE0E;</div>'
    },
    [Resources.CircleResearch]: {
        name: "Circular Logic",
        symbol: '🌀&#xFE0E;'
    },
    [Resources.SquareResearch]: {
        name: "Logistical Notes",
        symbol: '🔩&#xFE0E;'
    },
    [Resources.DiamondResearch]: {
        name: "Balistics Tests",
        symbol: '🔶&#xFE0E;'
    },
    [Resources.TriangleResearch]: {
        name: "Consumption Reports",
        symbol: '🔌&#xFE0E;'
    },
    [Resources.TriangleResearch2]: {
        name: "Rampant Studies",
        symbol: '<div style="transform: rotate(45deg)">💢&#xFE0E;</div>'
    }
};

export type ResourceDisplay = {
    name: CoercableComponent,
    symbol: CoercableComponent,
    color?: string,
    visibility?: ProcessedComputable<Visibility | boolean>;
}