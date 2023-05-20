import { CoercableComponent, Visibility } from "features/feature";
import { computed } from "vue";
import factory from "./factory";
import { FactoryNode } from "./nodes";
import { Alignment, types } from "./types";
import { ProcessedComputable } from "util/computed";

export enum Resources {
    Empty = "empty",
    Nanites = "nanites",
    Scrap = "scrap"
}

export const amounts = computed(() => {
    const nodes = factory.board.nodes.value as FactoryNode[];

    const amounts: Partial<Record<Resources, number>> = {};
    for (const node of nodes) {
        const nodeType = types[node.type];
        if (nodeType.alignment !== Alignment.Friendly) continue;
        if (!nodeType.building) continue;
        
        const building = nodeType.building;
        if (!building.storage) continue;
        
        const state = node.state! as { storage: {resource: Resources, amount: number}[] }
        for (const storage of state.storage) {
            if (amounts[storage.resource] === undefined) amounts[storage.resource] = 0;
            amounts[storage.resource]! += storage.amount;
        }
    }
    return amounts;
})

export const resources: Record<Resources, ResourceDisplay> = {
    [Resources.Empty]: {
        name: "Empty",
        visibility: false
    },
    [Resources.Nanites]: {
        name: "Nanites"
    },
    [Resources.Scrap]: {
        name: "Scrap"
    }
};

export type ResourceDisplay = {
    name: CoercableComponent,
    color?: string,
    visibility?: ProcessedComputable<Visibility | boolean>;
}