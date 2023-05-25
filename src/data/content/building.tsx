import { CoercableComponent } from "features/feature";
import { Resources } from "./resources";
import { BoardNodeType, findResource, types } from "./types";
import { createLazyProxy } from "util/proxies";
import { BoardNode, getNodeProperty } from "features/boards/board";
import { root } from "data/projEntry";
import { onFinishBuild } from "./nodes";

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
            duration: 1
        }],
        display: false
    })),
    extractor: createLazyProxy(() => ({
        buildableOn: [BoardNodeType.Scrap],
        cost: { [Resources.Nanites]: 10 },
        storage: [{ resources: [Resources.Scrap], limit: "node", type: "output" }],
        display: "Extract scrap from ruined nodes",
        onBuild(node, builtOn) {
            if (builtOn === undefined) return;
            node.storage[0] = builtOn.storage[0];
            node.storage[0].limit = builtOn.storage[0].amount;
        }
    })),
    router: createLazyProxy(() => ({
        cost: { [Resources.Nanites]: 5 },
        transferDistance: 100,
        display: "Transfer resources to further-away nodes"
    })),
    foundry: createLazyProxy(() => ({
        cost: { [Resources.Nanites]: 25 },
        display: "Form clusters of nanites into structural materials",
        storage: [
            { resources: [Resources.Nanites], limit: 50, type: "input" },
            { resources: [Resources.Plates], limit: 5, type: "input" }
        ],
        recipes: [{
            input: { [Resources.Nanites]: 10 },
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
        const outputs = [] as [typeof node.storage[0], Storage][];
        for (let i = 0; i < node.storage.length; i++) {
            if (storage[i].type !== "output") continue;
            outputs.push([node.storage[i], storage[i]]);
        }
        for (const resource of Object.keys(recipe.output) as Resources[]) {
            const output = outputs.find(store => store[0].resource === resource);
            if (output === undefined) continue;
            if (output[0].amount + recipe.output[resource]! >= (output[1].limit === "node" ? output[0].limit! : output[1].limit)) return;
        }

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
        for (const id of node.transferRoute.path) {
            if (id in root.idToNodeMap.value && root.idToNodeMap.value[id].distance >= 0) continue;
            delete node.transferRoute;
            return;
        }
        
        const source = root.idToNodeMap.value[node.transferRoute.path[0]];
        const { resource, store } = node.transferRoute;
        const transferred = Math.min(source.storage[store].amount, node.buildMaterials[resource]!, 1 * diff); // TODO: replace with <buildSpeed>
        node.buildMaterials[resource]! -= transferred;
        source.storage[store].amount -= transferred;
        if (source.storage[store].amount <= 0) {
            source.storage[store].amount = 0;
            source.storage[store].resource = Resources.Empty;
            delete node.transferRoute;
        }
        if (node.buildMaterials[resource]! <= 0) {
            node.buildMaterials[resource]! = 0;
            if (Object.values(node.buildMaterials).every(amount => amount === 0)) {
                onFinishBuild(node);
            }
            delete node.transferRoute;
        }
    }
}

export function tickTransfer(node: BoardNode, diff: number) {
    if (node.distance < 0) return;
    if (Object.values(node.buildMaterials).some(amount => amount > 0)) return;
    if (node.activeRecipe === undefined) return;
    const building = getNodeProperty(types[node.type].building, node);
    if (building === undefined) return;
    if (building.storage === undefined) return;
    if (building.recipes === undefined) return;
    
    const stores = [] as [typeof node.storage[0], typeof building.storage[0]][];
    for (let i = 0; i < node.storage.length; i++) {
        const buildingStore = building.storage[i];
        if (buildingStore.type !== "input") continue;
        stores.push([node.storage[i], building.storage[i]]);
    }

    if (node.transferRoute === undefined) {
        const inputs = building.recipes[node.activeRecipe].input;
        const fullInputs = [] as Resources[];
        const metInputs = [] as Resources[];
        const unmetInputs = [] as Resources[];
        for (let i = 0; i < stores.length; i++) {
            for (const [resource, amount] of Object.entries(inputs) as [Resources, number][]) {
                if (fullInputs.includes(resource)) continue;
                if (metInputs.includes(resource)) continue;
                if (unmetInputs.includes(resource)) continue;
                if (stores[i][0].resource === resource) {
                    if (stores[i][0].amount >= amount) {
                        const nodeStore = node.storage[i];
                        const buildingStore = building.storage[i];
                        if (nodeStore.amount >= (buildingStore.limit === "node" ? nodeStore.limit! : buildingStore.limit))
                            fullInputs.push(resource);
                        else metInputs.push(resource);
                    }
                    else unmetInputs.push(resource);
                    break;
                }
            }
        }
        unmetInputs.push(...(Object.keys(inputs) as Resources[]).filter(input => !fullInputs.includes(input))
                                                                .filter(input => !metInputs.includes(input))
                                                                .filter(input => !unmetInputs.includes(input)));
        for (const input of unmetInputs) {
            node.transferRoute = findResource(node, input);
            if (node.transferRoute !== undefined) return;
        }
        for (const input of metInputs) {
            node.transferRoute = findResource(node, input);
            if (node.transferRoute !== undefined) return;
        }
    }
    else {
        for (const id of node.transferRoute.path) {
            if (id in root.idToNodeMap.value && root.idToNodeMap.value[id].distance >= 0) continue;
            delete node.transferRoute;
            return;
        }

        const source = root.idToNodeMap.value[node.transferRoute.path[0]];
        const { resource, store } = node.transferRoute;
        let sinkStore = stores.find(([node, _]) => node.resource === resource);
        if (sinkStore === undefined) sinkStore = stores.find(([node, building]) => node.resource === Resources.Empty && building.resources.includes(resource));
        if (sinkStore === undefined) {
            delete node.transferRoute;
            return;
        }

        const limit = sinkStore[1].limit === "node" ? sinkStore[0].limit! : sinkStore[1].limit
        const availableSpace = limit - sinkStore[0].amount;
        const transferred = Math.min(source.storage[store].amount, availableSpace, 1 * diff); // TODO: replace with <transferSpeed>
        sinkStore[0].resource = resource;
        sinkStore[0].amount += transferred;
        source.storage[store].amount -= transferred;
        if (source.storage[store].amount <= 0) {
            source.storage[store].amount = 0;
            source.storage[store].resource = Resources.Empty;
            types[source.type].onStoreEmpty?.(source, store);
            delete node.transferRoute;
        }
        if (limit - sinkStore[0].amount <= 0) {
            sinkStore[0].amount = limit;
            delete node.transferRoute;
        }
    }
}

export function normalizeStorage() {
    for (const node of root.board.nodes.value) {
        for (const store of node.storage) {
            if (store.resource === Resources.Empty) continue;
            if (store.amount > 0.98) continue;
            store.amount = Math.round(store.amount * 100) / 100;
            if (store.amount <= 0) {
                store.amount = 0;
                store.resource = Resources.Empty;
            }
        }
    }
}