import { NodeTypeOptions } from "features/boards/board";
import { Building, buildings } from "./building";
import DiamondNode from "features/boards/DiamondNode.vue";
import CircleNode from "features/boards/CircleNode.vue";
import Router from "data/nodes/Router.vue";
import { GenericComponent } from "features/feature";

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
        component: DiamondNode as GenericComponent,
        alignment: Alignment.Friendly,
        building: buildings.core
    },
    [FactoryNodeType.Scrap]: {
        size: 40,
        component: CircleNode as GenericComponent,
        alignment: Alignment.Neutral
    },
    [FactoryNodeType.Extractor]: {
        size: 25,
        component: DiamondNode as GenericComponent,
        alignment: Alignment.Friendly,
        building: buildings.extractor
    },
    [FactoryNodeType.Router]: {
        size: 25,
        component: CircleNode as GenericComponent,//Router,
        alignment: Alignment.Friendly,
        building: buildings.router
    }
}
