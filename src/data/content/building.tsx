import { CoercableComponent } from "features/feature";
import { Resources } from "./resources";
import { BoardNodeType, findResource, types } from "./types";
import { createLazyProxy } from "util/proxies";
import { BoardNode, getNodeProperty } from "features/boards/board";
import { root } from "data/projEntry";

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

export function tickRecipe(node: BoardNode, diff: number) {
    if (node.activeRecipe === undefined) return;
    const building = getNodeProperty(types[node.type].building, node);
    if (building === undefined) return;
    if (building.storage === undefined) return;
    if (building.recipes === undefined) return;

    const storage = building.storage;
    const recipe = building.recipes[node.activeRecipe];
    if (node.recipeTime > 0) {
        node.recipeTime -= diff;
        if (node.recipeTime <= 0) {
            node.recipeTime = 0;
            const outputsToFill = [];
            const outputs = node.storage.filter((_, index) => storage[index].type === "output");
            for (const [resource, amount] of Object.entries(recipe.output) as [Resources, number][]) {
                const output = outputs.find(store => store.resource === resource);
                if (output === undefined) outputsToFill.push(resource);
                else output.amount += amount;
            }
            for (const resource of outputsToFill) {
                const output = outputs.find((store, index) => store.resource === Resources.Empty && storage[index].resources.includes(resource));
                if (output === undefined) {
                    console.error(`Node ${node.id} storage too full for recipe!`, node);
                    return;
                }
                output.resource = resource;
                output.amount += recipe.output[resource]!;
            }
        }
    }
    else {
        const inputs = node.storage.filter((_, index) => storage[index].type === "input");
        const foundInputs = {} as Record<Resources, { amount: number }>;
        for (const [resource, amount] of Object.entries(recipe.input) as [Resources, number][]) {
            for (let i = 0; i < node.storage.length; i++) {
                if (storage[i].type !== "input") continue;
            }
            const input = inputs.find(store => store.resource === resource);
            if (input === undefined) return;
            if (input.amount < amount) return;
            foundInputs[resource] = input;
        }
        if (Object.keys(foundInputs).length !== Object.keys(recipe.input).length) return;
        for (const [resource, store] of Object.entries(foundInputs) as [Resources, { resource: Resources, amount: number }][]) {
            store.amount -= recipe.input[resource]!;
            if (store.amount <= 0) {
                store.amount = 0;
                store.resource = Resources.Empty;
            }
        }
        node.recipeTime = recipe.duration;
    }
}

export function tickBuild(node: BoardNode, diff: number) {
    if (node.distance < 0) return;
    if (Object.values(node.buildMaterials).every(amount => amount === 0)) return;

    if (node.transferRoute === undefined) {
        for (const resource of (Object.keys(node.buildMaterials) as Resources[]).filter(resource => node.buildMaterials[resource]! > 0)) {
            node.transferRoute = findResource(node, resource);
            if (node.transferRoute !== undefined) return;
        }
    }
    else {
        for (const id of node.transferRoute) {
            if (id in root.idToNodeMap.value && root.idToNodeMap.value[id].distance >= 0) continue;
            delete node.transferRoute;
            return;
        }
        

        // if so, move up to `transferRate` (default 1) resources per second across the route
    }
}