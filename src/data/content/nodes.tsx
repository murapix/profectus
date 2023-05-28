import { BoardNode, getNodeProperty, getUniqueNodeID } from "features/boards/board"
import { Alignment, BoardNodeType, types } from "./types"
import { computed } from "vue";
import { Resources } from "./resources";
import { buildings } from "./building";
import { root } from "data/projEntry";

export type BoardNodeOptions = {
    position: { x: number, y: number },
    type: BoardNodeType,
    distance?: number;
}

function generateFactoryData(
    node: Partial<BoardNode>,
    starter: boolean = false
) {
    const type = types[node.type!];
    switch (type.alignment) {
        case Alignment.Friendly: {
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
                    node.recipeTime = 0;
                    if (building.recipes.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node as BoardNode)).length === 1) {
                        node.activeRecipe = building.recipes.indexOf(building.recipes.find(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node as BoardNode))!);
                    }
                }
            }
        
            if (node.type === BoardNodeType.Analyzer) {
                node.state = {
                    timeLeft: 0,
                    index: 4,
                    0: { resource: Resources.ConsumptionResearch, amount: 0 },
                    1: { resource: Resources.LogisticalResearch, amount: 0 },
                    2: { resource: Resources.BalisticsResearch, amount: 0 },
                    3: { resource: Resources.RampancyResearch, amount: 0 },
                    4: { resource: Resources.CircularResearch, amount: 0 }
                }
            }
            break;
        }
        case Alignment.Neutral: {
            break;
        }
        case Alignment.Hostile: {
            break;
        }
    }
    node.connectedNodes ??= [];
    node.distance ??= -1;
    node.buildMaterials ??= {};
}

export function createStartNode(data: BoardNodeOptions): Partial<BoardNode> {
    generateFactoryData(data, true);
    return data as BoardNode;
}
export function createNode(data: BoardNodeOptions): BoardNode {
    generateFactoryData(data);
    return {
        ...data,
        id: getUniqueNodeID(root.board)
    } as BoardNode;
}

export const core = computed(() => root.board.nodes.value[0]);

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
        }),
        createStartNode({
            position: {x: -400, y: 60},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -190, y: 270},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 310, y: -170},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 220, y: 400},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -40, y: 490},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -20, y: -250},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -450, y: 290},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 500, y: 10},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 380, y: 230},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -180, y: -430},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -280, y: -270},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 250, y: -380},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 10, y: -520},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 160, y: 180},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -210, y: -60},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -490, y: -180},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 440, y: -310},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: -270, y: 460},
            type: BoardNodeType.Scrap
        }),
        createStartNode({
            position: {x: 0, y: 0},
            type: BoardNodeType.ContainmentRing
        })
    ];
    {
        nodes[0].storage![0] = {
            resource: Resources.Nanites,
            amount: buildings.core.storage![0].limit as number
        };
        nodes[1].storage = [{
            resource: Resources.Scrap,
            amount: 45
        }];
        nodes[2].storage = [{
            resource: Resources.Scrap,
            amount: 55
        }];
        nodes[3].storage = [{
            resource: Resources.Scrap,
            amount: 95
        }];
        nodes[4].storage = [{
            resource: Resources.Scrap,
            amount: 100
        }];
        nodes[5].storage = [{
            resource: Resources.Scrap,
            amount: 95
        }];
        nodes[6].storage = [{
            resource: Resources.Scrap,
            amount: 45
        }];
        nodes[7].storage = [{
            resource: Resources.Scrap,
            amount: 95
        }];
        nodes[8].storage = [{
            resource: Resources.Scrap,
            amount: 95
        }];
        nodes[9].storage = [{
            resource: Resources.Scrap,
            amount: 50
        }];
        nodes[10].storage = [{
            resource: Resources.Scrap,
            amount: 35
        }];
        nodes[11].storage = [{
            resource: Resources.Scrap,
            amount: 95
        }];
        nodes[12].storage = [{
            resource: Resources.Scrap,
            amount: 40
        }];
        nodes[13].storage = [{
            resource: Resources.Scrap,
            amount: 35
        }];
        nodes[14].storage = [{
            resource: Resources.Scrap,
            amount: 55
        }];
        nodes[15].storage = [{
            resource: Resources.Scrap,
            amount: 55
        }];
        nodes[16].storage = [{
            resource: Resources.Scrap,
            amount: 40
        }];
        nodes[17].storage = [{
            resource: Resources.Scrap,
            amount: 80
        }];
        nodes[18].storage = [{
            resource: Resources.Scrap,
            amount: 95
        }];
        nodes[19].storage = [{
            resource: Resources.Scrap,
            amount: 90
        }];
    }
    nodes[20].state = { durability: 1800, angle: 0, size: 600 };

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

export function propagateDistance(nodes: BoardNode[], rootNode: BoardNode) {
    for (const node of nodes) {
        node.distance = -1;
    }
    rootNode.distance = 0;

    const toCheck = [rootNode];
    while (toCheck.length > 0) {
        const node = toCheck.shift()!;
        for (const neighbor of node.connectedNodes.map(id => root.idToNodeMap.value[id])) {
            if (neighbor.distance >= 0 && neighbor.distance <= node.distance+1) continue;
            neighbor.distance = node.distance+1;
            
            if (Object.values(node.buildMaterials).some(amount => amount > 0)) continue;
            if (getNodeProperty(types[neighbor.type].building, node)!.transferDistance === undefined) continue;
            toCheck.push(neighbor);
        }
    }
}

export const maxBuildableRadius = computed(() => {
    let radius = Infinity;
    for (const node of root.board.nodes.value) {
        if (types[node.type].alignment !== Alignment.Hostile) continue;
        if (node.type !== BoardNodeType.ContainmentRing) continue;
        const distance = (node.state as { size: number }).size;
        if (distance < radius) radius = distance;
    }
    return radius;
});

export function canPlaceAtPosition(node: BoardNode) {
    const size = getNodeProperty(types[node.type].size, node);

    // TODO: check for enemy emplacements
    const distanceFromOrigin = Math.sqrt(node.position.x*node.position.x + node.position.y*node.position.y);
    if (distanceFromOrigin + size >= maxBuildableRadius.value) return false;

    for (const otherNode of root.board.nodes.value) {
        const otherSize = getNodeProperty(types[otherNode.type].size, otherNode);
        const minDist = size + otherSize;
        if (Math.abs(node.position.x - otherNode.position.x) >= minDist) continue;
        if (Math.abs(node.position.y - otherNode.position.y) >= minDist) continue;
        return false;
    }
    return true;
}

export function placeNode(newNode: BoardNode) {
    const nodes = root.board.nodes.value.filter(node => canConnect(node, newNode));
    for (const node of nodes) {
        node.connectedNodes.push(newNode.id);
        newNode.connectedNodes.push(node.id);
    }

    root.board.nodes.value.push(newNode);
    root.dirty.value = true;
}

export function onFinishBuild(newNode: BoardNode) {
    const building = getNodeProperty(types[newNode.type].building, newNode);
    if (building !== undefined) {
        const cost = Object.values(building.cost).reduce((a,b) => a+b);
        for (const analyzer of root.board.nodes.value.filter(node => node.type === BoardNodeType.Analyzer).filter(node => node !== newNode)) {
            const squareDistance = (newNode.position.x - analyzer.position.x)**2 + (newNode.position.y - analyzer.position.y)**2;
            if (squareDistance > 100**2) continue;
            const state = analyzer.state as { 1: { amount: number } };
            state[1].amount += cost;
            if (state[1].amount > 100) state[1].amount = 100;
        }
    }

    const nodes = root.board.nodes.value.filter(node => canConnect(node, newNode));
    for (const node of nodes) {
        if (!node.connectedNodes.includes(newNode.id)) node.connectedNodes.push(newNode.id);
        if (!newNode.connectedNodes.includes(node.id)) newNode.connectedNodes.push(node.id);
    }
    root.dirty.value = true;
}

export function removeNode(node: BoardNode) {
    root.board.state.value.nodes = root.board.state.value.nodes.filter(other => other.id !== node.id);

    const alignment = types[node.type].alignment;
    const nodes = root.board.nodes.value;
    const friendlies = nodes.filter(node => types[node.type].alignment === alignment);
    for (const friend of friendlies) {
        friend.connectedNodes = friend.connectedNodes.filter(id => id !== node.id);
    }
    root.dirty.value = true;
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

const allTransferRoutes = computed(() => root.board.nodes.value.filter(node => node.transferRoute).map(node => node.transferRoute!));
export const transferRouteUsage = computed(() => {
    const links = {} as Record<number, Record<number, number>>;
    for (const node of root.board.nodes.value) {
        links[node.id] = {};
    }
    for (const route of allTransferRoutes.value) {
        for (let i = 0; i < route.path.length-1; i++) {
            const start = route.path[i];
            const end = route.path[i+1];
            links[start][end] ??= 0;
            links[start][end] += 1;
            links[end][start] ??= 0;
            links[end][start] += 1;
        }
    }
    return links;
})

export function getLinkUsage(node: BoardNode) {
    
}