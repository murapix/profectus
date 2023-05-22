import { NodeTypeOptions, Shape } from "features/boards/board";
import { Building, buildings } from "./building";

export enum Alignment {
    Friendly = "friendly",
    Neutral = "neutral",
    Hostile = "hostile"
}

export enum FactoryNodeType {
    Core = "core",
    Scrap = "scrap",
    Extractor = "extractor",
    Router = "router",
}

export interface FactoryNodeTypeOptions extends NodeTypeOptions {
    alignment: Alignment,
    building?: Building
}

export const types: Record<FactoryNodeType, FactoryNodeTypeOptions> = {
    [FactoryNodeType.Core]: {
        size: 50,
        shape: () => Shape.Diamond,
        alignment: Alignment.Friendly,
        building: buildings.core
    },
    [FactoryNodeType.Scrap]: {
        size: 40,
        shape: () => Shape.Circle,
        alignment: Alignment.Neutral
    },
    [FactoryNodeType.Extractor]: {
        size: 25,
        shape: () => Shape.Diamond,
        alignment: Alignment.Friendly,
        building: buildings.extractor
    },
    [FactoryNodeType.Router]: {
        size: 25,
        shape: () => Shape.Router,
        alignment: Alignment.Friendly,
        building: buildings.router
    }
}
