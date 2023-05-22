import { BoardNode, getUniqueNodeID } from "features/boards/board"
import { FactoryNodeType, FactoryNodeTypeOptions, types } from "./types"
import factory from "../tabs/factory";
import { State } from "game/persistence";
import { computed } from "vue";
import { Resources } from "./resources";

export interface FactoryNode extends BoardNode {
    type: FactoryNodeType,
    buildMaterials: Partial<Record<Resources, number>>;
    storage: { resource: Resources, amount: number }[];
    recipes: number[];
}

export type BoardNodeOptions = {
    position: { x: number, y: number },
    type: FactoryNodeType,
    state?: Record<string | number, State>
}

function generateFactoryData(
    node: Omit<BoardNode, "id"> & Partial<FactoryNode>,
    starter = false
) {
    const type = types[node.type];
    if (type.building) {
        const building = type.building;

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
}

export function createStartNode(data: BoardNodeOptions): Omit<FactoryNode, "id"> {
    generateFactoryData(data, true);
    return data as FactoryNode;
}
export function createNode(data: BoardNodeOptions): FactoryNode {
    generateFactoryData(data);
    return {
        ...data,
        id: getUniqueNodeID(factory.board)
    } as FactoryNode;
}

export const core = computed(() => factory.board.nodes.value[0]);

export function startNodes() {
    return [
        createStartNode({
            position: {x: 0, y: 0},
            type: FactoryNodeType.Core
        }),
        createStartNode({
            position: {x: 400, y: 375},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: 375, y: -375},
            type: FactoryNodeType.Extractor
        }),
        createStartNode({
            position: {x: -275, y: -350},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: 350, y: 125},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: -500, y: -200},
            type: FactoryNodeType.Extractor
        }),
        createStartNode({
            position: {x: 150, y: 325},
            type: FactoryNodeType.Extractor
        }),
        createStartNode({
            position: {x: -175, y: 500},
            type: FactoryNodeType.Extractor
        }),
        createStartNode({
            position: {x: 0, y: -425},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: 200, y: -425},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: 450, y: -225},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: -375, y: 75},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: -300, y: 225},
            type: FactoryNodeType.Extractor
        }),
        createStartNode({
            position: {x: -50, y: 300},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: -625, y: 25},
            type: FactoryNodeType.Router
        }),
        createStartNode({
            position: {x: -525, y: -500},
            type: FactoryNodeType.Router
        })
    ]
}