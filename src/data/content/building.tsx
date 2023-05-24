import { CoercableComponent } from "features/feature";
import { Resources } from "./resources";
import { BoardNodeType } from "./types";
import { createLazyProxy } from "util/proxies";

export type Storage = {
    resources: Resources[];
    limit: number | "node";
    default?: number;
}

export type Recipe = {
    input: Partial<Record<Resources, number>>;
    output: Partial<Record<Resources, number>>;
    duration: number;
}

export type Building = {
    buildableOn?: BoardNodeType[];
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
            { resources: [Resources.Nanites], limit: 100, default: 100 },
            { resources: [Resources.Scrap], limit: 10 }
        ],
        recipes: [{
            input: { [Resources.Scrap]: 1 },
            output: { [Resources.Nanites]: 1 },
            duration: 1
        }],
        display: false
    })),
    extractor: createLazyProxy(() => ({
        buildableOn: [BoardNodeType.Scrap],
        cost: { [Resources.Nanites]: 25 },
        storage: [{ resources: [Resources.Scrap], limit: "node" }],
        display: "Extract scrap from ruined nodes"
    })),
    router: createLazyProxy(() => ({
        cost: { [Resources.Nanites]: 15 },
        transferDistance: 100,
        display: "Transfer resources to further-away nodes"
    })),
    foundry: createLazyProxy(() => ({
        cost: { [Resources.Nanites]: 75 },
        display: "Form clusters of nanites into structural materials",
        storage: [{ resources: [Resources.Nanites], limit: 50}],
        recipes: [{
            input: { [Resources.Nanites]: 50 },
            output: { [Resources.Plates]: 1 },
            duration: 10
        }]
    }))
}