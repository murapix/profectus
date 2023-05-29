import { BoardNode, BoardNodeActionOptions, NodeTypeOptions, Shape, getNodeProperty } from "features/boards/board";
import { buildings, scrapyardSource, tickResearcher } from "./building";
import { createLazyProxy } from "util/proxies";
import { Resources, resources } from "./resources";
import { root } from "data/projEntry";
import { createNode, maxBuildableRadius, placeNode, removeNode } from "./nodes";
import { formatWhole } from "util/break_eternity";

export enum Alignment {
    Friendly = "friendly",
    Neutral = "neutral",
    Hostile = "hostile"
}

export enum BoardNodeType {
    Core = "core",
    Extractor = "extractor",
    Router = "router",
    Foundry = "foundry",
    Analyzer = "analyzer",
    Researcher = "researcher",
    Bore = "bore",

    Scrap = "scrap",

    ContainmentRing = "containmentRing"
}

export const types: Record<BoardNodeType, NodeTypeOptions> = createLazyProxy(() => {
    const deleteNode = {
        id: "delete-node",
        visibility: true,
        icon: '🗑️',
        tooltip() {
            return {
                text: "Remove this node",
                color: 'var(--foreground)'
            }
        },
        onClick(node: BoardNode) {
            removeNode(node);
        }
    }
    const placeScrap = {
        id: "place-scrap",
        visibility(node: BoardNode) {
            return !((node.state as number) in root.idToNodeMap.value);
        },
        icon: '🔗',
        tooltip() {
            return {
                text: "Pick the output scrap pile location",
                color: 'var(--foreground)'
            }
        },
        onClick(node: BoardNode) {
            scrapyardSource.value = node;
            const scrapPile = createNode({
                position: {x: 0, y: 0},
                type: BoardNodeType.Scrap
            });
            scrapPile.storage = [{
                resource: Resources.Scrap,
                amount: 0
            }];
            node.state = scrapPile.id;
            root.board.draggingNode.value = scrapPile;
        }
    }

    const previousRecipe = {
        id: "previous-recipe",
        visibility(node: BoardNode) {
            if (node.activeRecipe !== undefined) return false;
            const building = getNodeProperty(types[node.type].building, node);
            if (building === undefined) return false;
            if (building.recipes === undefined) return false;
            const unlockedRecipes = building.recipes.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            return unlockedRecipes.length > 1;
        },
        icon: '<',
        tooltip(node: BoardNode) {
            const building = getNodeProperty(types[node.type].building, node)!;
            const unlockedRecipes = building.recipes!.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            const selected = node.selectedRecipe ?? 0;
            const text = "Current Recipe:"
            const input = Object.entries(unlockedRecipes[selected].input).map(([resource, amount]) =>
                `${formatWhole(amount)} ${resources[resource as Resources].name}`
            ).join(', ');
            const output = Object.entries(unlockedRecipes[selected].output).map(([resource, amount]) =>
                `${formatWhole(amount)} ${resources[resource as Resources].name}`
            ).join(', ');
            return {
                text: `${text} ${input} -> ${output}`,
                color: 'var(--foreground)'
            }
        },
        onClick(node: BoardNode) {
            const building = getNodeProperty(types[node.type].building, node)!;
            const unlockedRecipes = building.recipes!.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            const selected = (node.selectedRecipe ?? 0) - 1;
            node.selectedRecipe = selected < 0 ? unlockedRecipes.length-1 : selected;
        }
    }
    const nextRecipe = {
        id: "next-recipe",
        visibility(node: BoardNode) {
            if (node.activeRecipe !== undefined) return false;
            const building = getNodeProperty(types[node.type].building, node);
            if (building === undefined) return false;
            if (building.recipes === undefined) return false;
            const unlockedRecipes = building.recipes.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            return unlockedRecipes.length > 1;
        },
        icon: '>',
        tooltip(node: BoardNode) {
            const building = getNodeProperty(types[node.type].building, node)!;
            const unlockedRecipes = building.recipes!.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            const selected = node.selectedRecipe ?? 0;
            const text = "Current Recipe:"
            const input = Object.entries(unlockedRecipes[selected].input).map(([resource, amount]) =>
                `${formatWhole(amount)} ${resources[resource as Resources].name}`
            ).join(', ');
            const output = Object.entries(unlockedRecipes[selected].output).map(([resource, amount]) =>
                `${formatWhole(amount)} ${resources[resource as Resources].name}`
            ).join(', ');
            return {
                text: `${text} ${input} -> ${output}`,
                color: 'var(--foreground)'
            }
        },
        onClick(node: BoardNode) {
            const building = getNodeProperty(types[node.type].building, node)!;
            const unlockedRecipes = building.recipes!.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            const selected = (node.selectedRecipe ?? 0) + 1;
            node.selectedRecipe = selected >= unlockedRecipes.length ? 0 : selected;
        }
    }
    const selectRecipe = {
        id: "select-recipe",
        visibility(node: BoardNode) {
            if (node.activeRecipe !== undefined) return false;
            const building = getNodeProperty(types[node.type].building, node);
            if (building === undefined) return false;
            if (building.recipes === undefined) return false;
            const unlockedRecipes = building.recipes.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            return unlockedRecipes.length > 1;
        },
        icon: '⏻',
        tooltip(node: BoardNode) {
            const building = getNodeProperty(types[node.type].building, node)!;
            const unlockedRecipes = building.recipes!.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            const selected = node.selectedRecipe ?? 0;
            const text = "Select Recipe:"
            const input = Object.entries(unlockedRecipes[selected].input).map(([resource, amount]) =>
                `${formatWhole(amount)} ${resources[resource as Resources].name}`
            ).join(', ');
            const output = Object.entries(unlockedRecipes[selected].output).map(([resource, amount]) =>
                `${formatWhole(amount)} ${resources[resource as Resources].name}`
            ).join(', ');
            return {
                text: `${text} ${input} -> ${output}`,
                color: 'var(--foreground)'
            }
        },
        onClick(node: BoardNode) {
            const building = getNodeProperty(types[node.type].building, node)!;
            const unlockedRecipes = building.recipes!.filter(recipe => recipe.unlocked === undefined || getNodeProperty(recipe.unlocked, node));
            node.activeRecipe = building.recipes!.indexOf(unlockedRecipes[node.selectedRecipe ?? 0]);
            if (node.activeRecipe < 0) delete node.activeRecipe;
        }
    }

    const internalTypes = {
        [Alignment.Friendly]: {
            [BoardNodeType.Core]: {
                size: 20,
                shape: () => Shape.Core,
                building: buildings.core,
                label: (node) => {
                    if (root.board.selectedNode.value !== node) return;
                    const buiding = getNodeProperty(types[node.type].building, node);
                    if (building === undefined) return;
                    if (building.recipes === undefined) return;
                    if (building.activeRecipe === undefined) return;

                    const text = "Active Recipe:"
                    const input = Object.entries(building.recipes[node.activeRecipe].input).map(([resource, amount]) =>
                        `${formatWhole(amount)} ${resources[resource as Resources].name}`
                    ).join(', ');
                    const output = Object.entries(building.recipes[node.activeRecipe].output).map(([resource, amount]) =>
                        `${formatWhole(amount)} ${resources[resource as Resources].name}`
                    ).join(', ');
                    return {
                        text: `${text} ${input} -> ${output}`,
                        color: 'var(--foreground)'
                    }
                }
            },
            [BoardNodeType.Extractor]: {
                size: 10,
                shape: () => Shape.Extractor,
                building: buildings.extractor,
                onStoreEmpty(node) {
                    removeNode(node);
                },
                label: (node) => {
                    if (root.board.selectedNode.value !== node) return;
                    const storage = node.storage[0];
                    if (storage.limit === undefined) return;

                    return {
                        text: `${resources[storage.resource].name}: ${formatWhole(storage.amount)}/${formatWhole(storage.limit!)}`
                    }
                },
                actions: [deleteNode]
            },
            [BoardNodeType.Router]: {
                size: 10,
                shape: () => Shape.Router,
                building: buildings.router,
                actions: [deleteNode]
            },
            [BoardNodeType.Foundry]: {
                size: 15,
                shape: () => Shape.Foundry,
                building: buildings.foundry,
                label: (node) => {
                    if (root.board.selectedNode.value !== node) return;
                    const buiding = getNodeProperty(types[node.type].building, node);
                    if (building === undefined) return;
                    if (building.recipes === undefined) return;
                    if (building.activeRecipe === undefined) return;

                    const text = "Active Recipe:"
                    const input = Object.entries(building.recipes[node.activeRecipe].input).map(([resource, amount]) =>
                        `${formatWhole(amount)} ${resources[resource as Resources].name}`
                    ).join(', ');
                    const output = Object.entries(building.recipes[node.activeRecipe].output).map(([resource, amount]) =>
                        `${formatWhole(amount)} ${resources[resource as Resources].name}`
                    ).join(', ');
                    return {
                        text: `${text} ${input} -> ${output}`,
                        color: 'var(--foreground)'
                    }
                },
                actions: [previousRecipe, selectRecipe, nextRecipe, deleteNode]
            },
            [BoardNodeType.Analyzer]: {
                size: 15,
                shape: () => Shape.Analyzer,
                building: buildings.analyzer,
                update(node, diff) {
                    const building = getNodeProperty(types[node.type].building, node);
                    if (building === undefined) return;
                    if (Object.values(node.buildMaterials).some(amount => amount > 0)) return;

                    const state = node.state as {
                        timeLeft: number,
                        index: 0|1|2|3|4,
                        0: { resource: Resources.ConsumptionResearch, amount: number },
                        1: { resource: Resources.LogisticalResearch, amount: number },
                        2: { resource: Resources.BalisticsResearch, amount: number },
                        3: { resource: Resources.RampancyResearch, amount: number },
                        4: { resource: Resources.CircularResearch, amount: number }
                    };

                    if (state.timeLeft > 0) {
                        state.timeLeft -= diff;
                        if (state.timeLeft <= 0) {
                            state.timeLeft = 0;

                            const limit = building.storage![state.index].limit === "node" ? node.storage[state.index].limit! : building.storage![state.index].limit as number;
                            const spaceLeft = limit - node.storage[state.index].amount;
                            node.storage[state.index].amount += Math.min(1, state[state.index].amount, spaceLeft);
                            node.storage[state.index].resource = state[state.index].resource;
                            state[state.index].amount -= Math.min(1, state[state.index].amount, spaceLeft);
                        }
                    }
                    if (state.timeLeft === 0) {
                        for (let i = state.index+1; i < state.index+6; i++) {
                            const index = i % 5 as 0|1|2|3|4;
                            const nodeStore = node.storage[index];
                            const buildingStore = building.storage![index];
                            const stateStore = state[index];

                            if (stateStore.amount < 1) continue;
                            const limit = buildingStore.limit === "node" ? nodeStore.limit! : buildingStore.limit;
                            const spaceLeft = limit - nodeStore.amount;
                            if (spaceLeft < 1) continue;
                            
                            state.timeLeft = 1;
                            state.index = index;
                            return;
                        }
                    }
                },
                actions: [deleteNode]
            },
            [BoardNodeType.Researcher]: {
                size: 15,
                shape: () => Shape.Researcher,
                building: buildings.researcher,
                update(node, diff) {
                    tickResearcher(node, diff);
                },
                actions: [deleteNode]
            },
            [BoardNodeType.Bore]: {
                size: 20,
                shape: () => Shape.Bore,
                building: buildings.bore,
                update(node, diff) {
                    if (node.storage[0].amount < diff) return;
                    if (node.state === undefined) return;
                    if (node.state === root.board.draggingNode.value?.id) return;
                    if (!((node.state as number) in root.idToNodeMap.value)) {
                        node.state = undefined;
                        return;
                    }
                    
                    if (node.position.x**2 + node.position.y**2 < (maxBuildableRadius.value-100)**2) return;
                    node.storage[0].amount -= diff;
                    const output = root.idToNodeMap.value[node.state as number].storage[0];
                    output.resource = Resources.Scrap;
                    output.amount += diff * 1.5;
                    if (output.amount > output.limit!) output.limit = output.amount;
                    const ring = root.board.nodes.value.find(node => node.type === BoardNodeType.ContainmentRing)!;
                    const state = ring.state as { durability: number };
                    state.durability -= diff;

                    for (const analyzer of root.board.nodes.value.filter(node => node.type === BoardNodeType.Analyzer)) {
                        const squareDistance = (node.position.x - analyzer.position.x)**2 + (node.position.y - analyzer.position.y)**2;
                        if (squareDistance > 100**2) continue;
                        const state = analyzer.state as { 2: { amount: number } };
                        state[2].amount += diff;
                        if (state[2].amount > 100) state[2].amount = 100;
                    }
                },
                actions: [placeScrap, deleteNode]
            }
        },
        [Alignment.Neutral]: {
            [BoardNodeType.Scrap]: {
                size: 15,
                shape: () => Shape.Scrap,
                label: (node) => {
                    let showLabel = false;
                    if (root.board.selectedNode.value === node) showLabel = true;
                    if (root.board.draggingNode.value != undefined && canPlaceOn(node, root.board.draggingNode.value)) showLabel = true;

                    if (showLabel) {
                        const storage = node.storage[0];
                        return {
                            text: `${resources[storage.resource].name}: ${formatWhole(storage.amount)}`
                        }
                    }
                }
            }
        },
        [Alignment.Hostile]: {
            [BoardNodeType.ContainmentRing]: {
                size: 0,
                shape: () => Shape.ContainmentRing,
                durability(node) {
                     // start at 30 minutes of a single bore
                    const state = node.state as { size: number };
                    if (state === undefined) return 1800;
                    return 180*10**(state.size/600);
                },
                update(node, diff) {
                    const state = node.state as { durability: number, angle: number, size: number };
                    if (state.durability <= 0) {
                        removeNode(node);

                        const count = 1 + (node.state as { size: number}).size / 600;
                        const nextRing = createNode({
                            position: {x: 0, y: 0},
                            type: BoardNodeType.ContainmentRing
                        });
                        nextRing.state = {
                            durability: 180*10**count,
                            angle: 0,
                            size: 600*count
                        };
                        placeNode(nextRing);

                        return;
                    }

                    // 1 minute rotation cycle = 60 seconds => 2PI / 60
                    state.angle += diff * Math.PI/30;
                    state.angle %= 2*Math.PI;
                }
            }
        }
    } as Record<Alignment, Partial<Record<BoardNodeType, Partial<NodeTypeOptions>>>>;

    for (const type of Object.values(internalTypes[Alignment.Friendly])) {
        type.canAccept = canPlaceOn;
        type.onDrop = placeOn;
        type.alignment = Alignment.Friendly;
    }
    for (const type of Object.values(internalTypes[Alignment.Neutral])) {
        type.canAccept = canPlaceOn;
        type.onDrop = placeOn;
        type.alignment = Alignment.Neutral;
    }
    for (const type of Object.values(internalTypes[Alignment.Hostile])) {
        type.alignment = Alignment.Hostile;
        type.onClick = (node) => {};
    }

    return {
        ...internalTypes[Alignment.Friendly],
        ...internalTypes[Alignment.Neutral],
        ...internalTypes[Alignment.Hostile]
    } as Record<BoardNodeType, NodeTypeOptions>;
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

export function findResource(node: BoardNode, resource: Resources, path: number[] = [], visited: Set<number> = new Set()): { resource: Resources, path: number[], store: number } | undefined {
    visited.add(node.id);

    const neighbors = node.connectedNodes.filter(id => !visited.has(id));
    for (const neighbor of neighbors) {
        visited.add(neighbor);
    }
    for (const neighborNode of neighbors.map(id => root.idToNodeMap.value[id])) {
        if (Object.values(neighborNode.buildMaterials).some(amount => amount > 0)) continue;
        const route = findResourceHelper(neighborNode, resource, [node.id, ...path], visited);
        if (route !== undefined) return route;
    }
}

function findResourceHelper(node: BoardNode, resource: Resources, path: number[], visited: Set<number>): { resource: Resources, path: number[], store: number } | undefined {
    const building = getNodeProperty(types[node.type].building, node);
    if (building === undefined) return;
    if (building.storage !== undefined) {
        for (let i = 0; i < node.storage.length; i++) {
            if (building.storage[i].type !== "output") continue;
            const storage = node.storage[i];
            if (storage.resource !== resource) continue;
            if (storage.amount <= 0) continue;
            return {
                resource,
                path: [node.id, ...path],
                store: i
            };
        }
    }
    if (building.transferDistance === undefined) return;
    
    const neighbors = node.connectedNodes.filter(id => !visited.has(id));
    for (const neighbor of neighbors) {
        visited.add(neighbor);
    }
    for (const neighborNode of neighbors.map(id => root.idToNodeMap.value[id])) {
        if (Object.values(neighborNode.buildMaterials).some(amount => amount > 0)) continue;
        const route = findResourceHelper(neighborNode, resource, [node.id, ...path], visited);
        if (route !== undefined) return route;
    }
}