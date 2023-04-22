import { Replace } from "features/feature";
import { Computable, GetComputableType, ProcessedComputable } from "util/computed";
import { Decorator } from "./common";
import { Requirements } from "game/requirements";
import { LayerEvents } from "game/layers";
import { Emitter } from "nanoevents";
import { unref } from "vue";

export interface AutobuyFeatureOptions {
    requirements: Requirements;
    shouldAutobuy: Computable<boolean>;
    eventEmitter: OmitThisParameter<Emitter<LayerEvents>["on"]>;
}

export type AutobuyFeature<T extends AutobuyFeatureOptions> = Replace<
    T, { shouldAutobuy: GetComputableType<T["shouldAutobuy"]> }
>;

export type GenericAutobuyFeature = Replace<
    AutobuyFeature<AutobuyFeatureOptions>,
    { shouldAutobuy: ProcessedComputable<boolean> }
>;

export const autobuyDecorator: Decorator<AutobuyFeatureOptions, unknown, GenericAutobuyFeature> = {
    postConstruct(feature) {
        if ('purchase' in feature && 'canPurchase' in feature) {
            feature.eventEmitter("update", () => {
                if (unref(feature.shouldAutobuy) && unref(feature.canPurchase)) {
                    (feature.purchase as Function)();
                }
            });
        }
        else if ('onClick' in feature && 'canClick' in feature) {
            feature.eventEmitter("update", () => {
                if (unref(feature.shouldAutobuy) && unref(feature.canClick)) {
                    (feature.onClick as Function)();
                }
            })
        }
    }
}