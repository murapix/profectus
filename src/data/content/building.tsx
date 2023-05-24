import { CoercableComponent } from "features/feature";
import { Resources } from "./resources";
import { BoardNodeType } from "./types";
import { createLazyProxy } from "util/proxies";
import { BoardNode, NodeComputable } from "features/boards/board";

export type Storage = {
    resources: Resources[];
    limit: number | "node";
    default?: number;
    type: "input" | "output";
}

export type Recipe = {
    input: Partial<Record<Resources, number>>;
    output: Partial<Record<Resources, number>>;
    duration: number;
}

export type Building = {
    buildableOn?: BoardNodeType[];
    onBuild?: (node: BoardNode, builtOn?: BoardNode) => void;
    cost: Partial<Record<Resources, number>>;
    storage?: Storage[],
    transferDistance?: number,
    recipes?: Recipe[],
    display: false | CoercableComponent
}

export const buildings: Record<string, Building> = {
    core: createLazyProxy(() => ({
        cost: {},
        transferDistance: 200,
        storage: [
            { resources: [Resources.Nanites], limit: 100, default: 100, type: "output" },
            { resources: [Resources.Scrap], limit: 10, type: "input" }
        ],
        recipes: [{
            input: { [Resources.Scrap]: 1 },
            output: { [Resources.Nanites]: 1 },
            duration: 4
        }],
        display: false
    })),
    extractor: createLazyProxy(() => ({
        buildableOn: [BoardNodeType.Scrap],
        cost: { [Resources.Nanites]: 25 },
        storage: [{ resources: [Resources.Scrap], limit: "node", type: "output" }],
        display: "Extract scrap from ruined nodes",
        onBuild(node, builtOn) {
            if (builtOn === undefined) return;
            node.storage[0] = builtOn.storage[0];
            node.storage[0].limit = builtOn.storage[0].amount;
        }
    })),
    router: createLazyProxy(() => ({
        cost: { [Resources.Nanites]: 15 },
        transferDistance: 100,
        display: "Transfer resources to further-away nodes"
    })),
    foundry: createLazyProxy(() => ({
        cost: { [Resources.Nanites]: 75 },
        display: "Form clusters of nanites into structural materials",
        storage: [
            { resources: [Resources.Nanites], limit: 50, type: "input" },
            { resources: [Resources.Plates], limit: 5, type: "input" }
        ],
        recipes: [{
            input: { [Resources.Nanites]: 50 },
            output: { [Resources.Plates]: 1 },
            duration: 10
        }]
    }))
}