import { BoardNode, getUniqueNodeID } from "features/boards/board"
import { FactoryNodeType, FactoryNodeTypeOptions, types } from "./types"
import factory from "./factory";
import { State } from "game/persistence";
import { computed } from "vue";
import { buildings } from "./building";

export interface FactoryNode extends BoardNode {
    type: FactoryNodeType
}

export type BoardNodeOptions = {
    position: { x: number, y: number },
    type: FactoryNodeType,
    state?: Record<string | number, State>
}

function processNodeState(type: FactoryNodeTypeOptions, state: Record<string | number, State>) {
    if (type.building && type.building.storage) {
        state.storage = type.building.storage.map(() => ({
            resource: "empty",
            amount: 0
        }));
    }
}

export function createStartNode(data: BoardNodeOptions): Omit<BoardNode, "id"> {
    if (data.state) { processNodeState(types[data.type], data.state); }
    return data
}
export function createNode(data: BoardNodeOptions): BoardNode {
    if (data.state) { processNodeState(types[data.type], data.state); }
    if (data.state) {
        if ('max' in data.state && !('current' in data.state)) {
            data.state.current = data.state.max
        }
    }
    return {
        ...data,
        id: getUniqueNodeID(factory.board)
    }
}

export const core = computed(() => factory.board.nodes.value[0]);

export function startNodes() {
    return [
        createStartNode({
            position: {x: 0, y: 0},
            type: FactoryNodeType.Core,
            state: {
                scrap: {
                    current: 0,
                    max: 10
                },
                nanites: {
                    max: 10
                },
                activeNodes: [],
                maxActiveNodes: 1
            }
        }),
        createStartNode({
            position: {x: 200, y: -50},
            type: FactoryNodeType.Scrap,
            state: { max: 50 }
        }),
        createStartNode({
            position: {x: -100, y: -150},
            type: FactoryNodeType.Scrap,
            state: { max: 35 }
        }),
        createStartNode({
            position: {x: -150, y: 250},
            type: FactoryNodeType.Scrap,
            state: { max: 120 }
        })
    ]
}