import { CoercableComponent } from "features/feature";
import { Resources } from "./resources";
import { FactoryNodeType } from "./types";
import { createLazyProxy } from "util/proxies";

export type Storage = {
    resources: Resources[];
    limit: number | "node"
}

export type Recipe = {
    input: Partial<Record<Resources, number>>;
    output: Partial<Record<Resources, number>>;
    duration: number;
}

export type Building = {
    buildableOn?: FactoryNodeType[];
    cost: Partial<Record<Resources, number>>;
    storage?: Storage[],
    transfer?: { rate: number, range: number },
    recipes?: Recipe[],
    display: false | CoercableComponent
}

export const buildings: Record<string, Building> = {
    core: createLazyProxy(() => ({
        cost: {},
        transfer: { rate: 5, range: 300 },
        storage: [
            { resources: [Resources.Nanites], limit: 100 },
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
        buildableOn: [FactoryNodeType.Scrap],
        cost: { [Resources.Nanites]: 100 },
        storage: [{ resources: [Resources.Scrap], limit: "node" }],
        display: "Extract scrap from ruined nodes"
    })),
    router: createLazyProxy(() => ({
        cost: { [Resources.Nanites]: 15 },
        transfer: { rate: 5, range: 300 },
        display: "Transfer resources to further-away nodes"
    }))
}