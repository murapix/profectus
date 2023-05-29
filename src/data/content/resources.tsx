import { CoercableComponent, Visibility } from "features/feature";
import { computed } from "vue";
import { root } from "data/projEntry";
import { Alignment, types } from "./types";
import { ProcessedComputable } from "util/computed";
import { getNodeProperty } from "features/boards/board";

export enum Resources {
    Empty = "empty",
    Nanites = "nanites",
    Scrap = "scrap",
    Plates = "plates",
    Circuits = "circuits",

    ConsumptionResearch = "consumption",
    LogisticalResearch = "logistics",
    BalisticsResearch = "balistics",
    RampancyResearch = "rampancy",
    CircularResearch = "circularLogic"
}

export const amounts = computed(() => {
    const nodes = root.board.nodes.value;

    const amounts: Partial<Record<Resources, number>> = {};
    for (const node of nodes) {
        const nodeType = types[node.type];
        if (nodeType.alignment !== Alignment.Friendly) continue;
        if (!nodeType.building) continue;
        
        const building = getNodeProperty(nodeType.building, node);
        if (!building.storage) continue;
        
        if (Object.values(node.buildMaterials).some(amount => amount > 0)) continue;

        for (let i = 0; i < node.storage.length; i++) {
            const storage = getNodeProperty.storage[i];
            if (!(resources[storage.resource].includeInput ?? false)) {
                if (building.storage[i].type === "input") {
                    continue;
                }
            }
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
    [Resources.Circuits]: {
        name: "Basic Circuit",
        symbol: '⏚'
    },    
    
    [Resources.ConsumptionResearch]: {
        name: "Consumption Reports",
        symbol: '🔌&#xFE0E;',
        includeInput: true
    },
    [Resources.LogisticalResearch]: {
        name: "Logistical Notes",
        symbol: '🔩&#xFE0E;',
        includeInput: true
    },
    [Resources.BalisticsResearch]: {
        name: "Balistics Tests",
        symbol: '🔶&#xFE0E;',
        includeInput: true
    },
    [Resources.RampancyResearch]: {
        name: "Rampant Studies",
        symbol: '<div style="transform: rotate(45deg)">💢&#xFE0E;</div>',
        includeInput: true
    },
    [Resources.CircularResearch]: {
        name: "Circular Logic",
        symbol: '🌀&#xFE0E;',
        includeInput: true
    }
};

export type ResourceDisplay = {
    name: string,
    symbol: CoercableComponent,
    color?: string,
    visibility?: ProcessedComputable<Visibility | boolean>;
    includeOutput?: boolean
}