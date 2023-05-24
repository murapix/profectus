import { BoardNode, NodeTypeOptions, Shape, getNodeProperty } from "features/boards/board";
import { buildings } from "./building";
import { createLazyProxy } from "util/proxies";
import { Resources, resources } from "./resources";
import factory from "data/tabs/factory";
import { placeNode, removeNode } from "./nodes";

export enum Alignment {
    Friendly = "friendly",
    Neutral = "neutral",
    Hostile = "hostile"
}

export enum BoardNodeType {
    Core = "core",
    Scrap = "scrap",
    Extractor = "extractor",
    Router = "router",
}

export const types: Record<BoardNodeType, NodeTypeOptions> = createLazyProxy(() => {
    const types = {
        [BoardNodeType.Core]: {
            size: 20,
            shape: () => Shape.Core,
            alignment: Alignment.Friendly,
            building: buildings.core
        },
        [BoardNodeType.Scrap]: {
            size: 15,
            shape: () => Shape.Scrap,
            alignment: Alignment.Neutral,
            label: (node) => {
                if (factory.board.selectedNode.value === node) {
                    const storage = node.storage[0];
                    return {
                        text: `${resources[storage.resource].name}: ${storage.amount}`
                    }
                }
            }
        },
        [BoardNodeType.Extractor]: {
            size: 10,
            shape: () => Shape.Extractor,
            alignment: Alignment.Friendly,
            building: buildings.extractor
        },
        [BoardNodeType.Router]: {
            size: 10,
            shape: () => Shape.Router,
            alignment: Alignment.Friendly,
            building: buildings.router
        }
    } as Record<BoardNodeType, NodeTypeOptions>;

    for (const type of Object.values(types)) {
        // type.title = getTempTitle;
        type.canAccept = canPlaceOn;
        type.onDrop = placeOn;
    }

    return types;
});

export function canPlaceOn(node: BoardNode, otherNode: BoardNode) {
    const building = getNodeProperty(types[otherNode.type].building, otherNode);
    if (building === undefined) return false;
    if (building.buildableOn === undefined) return false;
    return building.buildableOn.includes(node.type);
}

export function placeOn(node: BoardNode, otherNode: BoardNode) {
    if (!canPlaceOn(node, otherNode)) return;

    otherNode.position = node.position;
    const building = getNodeProperty(types[otherNode.type].building, otherNode);
    building?.onBuild?.(otherNode, node);
    
    removeNode(node);
    placeNode(otherNode);
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
                const output = outputs.find(store => store.resource === Resources.Empty);
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