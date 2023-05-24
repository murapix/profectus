import { BoardNode, getNodeProperty, getUniqueNodeID } from "features/boards/board"
import { Alignment, BoardNodeType, types } from "./types"
import factory from "../tabs/factory";
import { computed } from "vue";
import { Resources } from "./resources";
import { buildings } from "./building";

export type BoardNodeOptions = {
    position: { x: number, y: number },
    type: BoardNodeType,
    distance?: number;
}

function generateFactoryData(
    node: Partial<BoardNode>,
    starter = false
) {
    const type = types[node.type!];
    if (type.building) {
        const building = getNodeProperty(type.building, node as BoardNode);

        node.buildMaterials = Object.fromEntries(
            Object.entries(building.cost).map(
                ([resource, amount]) => [resource, starter ? 0 : amount]
            )
        );

        if (building.storage) {
            node.storage = building.storage.map(storage => ({
                resource: Resources.Empty,
                amount: storage.default ?? 0
            }));
        }

        if (building.recipes) {
            node.recipes = building.recipes.map(() => 0);
        }
    }

    node.connectedNodes ??= [];
    node.distance ??= -1;
}

export function createStartNode(data: BoardNodeOptions): Partial<BoardNode> {
    generateFactoryData(data, true);
    return data as BoardNode;
}
export function createNode(data: BoardNodeOptions): BoardNode {
    generateFactoryData(data);
    return {
        ...data,
        id: getUniqueNodeID(factory.board)
    } as BoardNode;
}

export const core = computed(() => factory.board.nodes.value[0]);

export function startNodes() {
    const nodes = [
        createStartNode({
            position: {x: 0, y: 0},
            type: BoardNodeType.Core,
            distance: 0
        }),
        createStartNode({
            position: {x: -100, y: 0},
            type: BoardNodeType.Scrap
        })
    ];
    nodes[0].storage![0] = {
        resource: Resources.Nanites,
        amount: buildings.core.storage![0].limit as number
    };
    nodes[0].storage![1] = {
        resource: Resources.Scrap,
        amount: 0
    };
    nodes[1].storage = [{
        resource: Resources.Scrap,
        amount: 45
    }];

    initializeConnections(nodes);

    return nodes as Omit<BoardNode, "id">[];
}

function initializeConnections(nodes: Partial<BoardNode>[]) {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
            if (canConnect(nodes[i] as BoardNode, nodes[j] as BoardNode)) {
                nodes[i].connectedNodes!.push(j);
                nodes[j].connectedNodes!.push(i);
            }
        }
    }
}

export function propagateDistance(nodes: BoardNode[], root: BoardNode, resetDistances: boolean = false) {
    const idMap = Object.fromEntries(nodes.map(node => [node.id, node]));
    if (resetDistances) {
        for (const node of nodes) {
            node.distance = -1;
        }
        root.distance = 0;
    }

    const toCheck = [root];
    while (toCheck.length > 0) {
        const node = toCheck.shift()!;
        for (const neighbor of node.connectedNodes.map(id => idMap[id])) {
            if (neighbor.distance >= 0 && neighbor.distance <= node.distance+1) continue;
            neighbor.distance = node.distance+1;
            
            if (Object.values(node.buildMaterials).some(amount => amount > 0)) continue;
            if (getNodeProperty(types[neighbor.type].building, node)!.transferDistance === undefined) continue;
            toCheck.push(neighbor);
        }
    }
}

export function placeNode(data: BoardNodeOptions) {
    const newNode = createNode(data);
    const nodes = factory.board.nodes.value.filter(node => canConnect(node, newNode));
    for (const node of nodes) {
        node.connectedNodes.push(newNode.id);
        newNode.connectedNodes.push(node.id);
    }

    factory.board.nodes.value.push(newNode);
}

export function onFinishBuild(node: BoardNode) {
    if (types[node.type].alignment !== Alignment.Neutral) factory.dirty.value = true;
}

export function removeNode(node: BoardNode) {
    factory.board.state.value.nodes = factory.board.state.value.nodes.filter(other => other.id !== node.id);

    const alignment = types[node.type].alignment;
    const nodes = factory.board.nodes.value;
    const friendlies = nodes.filter(node => types[node.type].alignment === alignment);
    for (const friend of friendlies) {
        friend.connectedNodes = friend.connectedNodes.filter(id => id !== node.id);
    }
    factory.dirty.value = true;
}

export function transferRange(node: BoardNode) {
    const building = getNodeProperty(types[node.type].building, node);
    if (building === undefined) return 0;
    if (building.transferDistance === undefined) return 0;
    if (Object.values(node.buildMaterials).some(amount => amount > 0)) return 0;
    return building.transferDistance;
}

export function canConnect(node: BoardNode, otherNode: BoardNode) {
    if (types[node.type].alignment !== types[otherNode.type].alignment) return false;
    const distance = Math.abs(node.position.x - otherNode.position.x) + Math.abs(node.position.y - otherNode.position.y);
    return distance <= transferRange(node) || distance <= transferRange(otherNode);
}

