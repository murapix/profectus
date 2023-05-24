import { BoardNode, NodeTypeOptions, Shape, getNodeProperty } from "features/boards/board";
import { buildings } from "./building";
import { createLazyProxy } from "util/proxies";
import { Resources, resources } from "./resources";
import { root } from "data/projEntry";
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
                if (root.board.selectedNode.value === node) {
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

export function findResource(node: BoardNode, resource: Resources, path: number[] = [], visited: Set<number> = new Set()): number[] | undefined {
    if (!visited.has(node.id)) visited.add(node.id);

    const building = getNodeProperty(types[node.type].building, node);
    if (building === undefined) return;
    if (building.storage !== undefined) {
        for (let i = 0; i < node.storage.length; i++) {
            if (building.storage[i].type !== "output") continue;
            const storage = node.storage[i];
            if (storage.resource !== resource) continue;
            if (storage.amount <= 0) continue;
            return [node.id, ...path];
        }
    }
    if (building.transferDistance === undefined) return;
    
    const neighbors = node.connectedNodes.filter(id => !visited.has(id));
    for (const neighbor of neighbors) {
        visited.add(neighbor);
    }
    for (const neighborNode of neighbors.map(id => root.idToNodeMap.value[id])) {
        const route = findResource(neighborNode, resource, [node.id, ...path], visited);
        if (route !== undefined) return route;
    }
}