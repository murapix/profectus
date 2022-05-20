import { createConversion } from "features/conversion";
import { jsx } from "features/feature";
import { createReset } from "features/reset";
import { createResource } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { createLayerTreeNode, createResetButton } from "../../common";
import MainDisplay from "features/resources/MainDisplay.vue";
import Spacer from "components/layout/Spacer.vue";
import { render } from "util/vue";
import { format } from "util/break_eternity";
import { root } from "data/projEntry";
import skyrmion from "./skyrmion";

const layer = createLayer("entangled", () => {
    const name = "Entangled Strings";
    const color = "#9a4500";
    const points = createResource<DecimalSource>(0, "Entangled Strings");

    const conversion = createConversion(() => ({
        scaling: {
            currentGain() {
                return Decimal.dZero;
            },
            currentAt() {
                return Decimal.dInf;
            },
            nextAt() {
                return Decimal.dInf;
            }
        },
        baseResource: skyrmion.skyrmions,
        gainResource: points,
        roundUpCost: false
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => []
    }));

    const treeNode = createLayerTreeNode(() => ({
        display: "E",
        layerID: "entangled",
        color,
        reset
    }));

    const resetButton = createResetButton(() => ({
        conversion,
        tree: root.tree,
        treeNode
    }));

    return {
        name,
        color,
        points,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                <Spacer />
                {render(resetButton)}
                <Spacer />
                <div>The next Entangled String requires:</div>
                <Spacer />
                <div color={color}>
                    Accelerons: {format(skyrmion.pions.value)}/{format(conversion.nextAt.value)}
                </div>
                <div color={color}>
                    Stored Inflatons: {format(skyrmion.spinors.value)}/
                    {format(conversion.nextAt.value)}
                </div>
                <div color={color} v-show={false}>
                    Total Timeline Score: {format(skyrmion.skyrmions.value)}/
                    {format(conversion.nextAt.value)}
                </div>
                <Spacer />
            </>
        )),
        treeNode
    };
});

export default layer;
