import { BoardNode, NodeTypeOptions, Shape, getNodeProperty } from "features/boards/board";
import { buildings } from "./building";
import { createLazyProxy } from "util/proxies";

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
            alignment: Alignment.Neutral
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
        type.title = getTempTitle;
        type.canAccept = canPlaceOn;
    }

    return types;
});

function getTempTitle(node: BoardNode) {
    return (node.distance).toFixed(0);
}

function canPlaceOn(node: BoardNode, otherNode: BoardNode) {
    const building = getNodeProperty(types[otherNode.type].building, otherNode);
    if (building === undefined) return false;
    if (building.buildableOn === undefined) return false;
    return building.buildableOn.includes(node.type);
}