import SpacerVue from "components/layout/Spacer.vue";
import { createLayerTreeNode, createResetButton } from "data/common";
import { root } from "data/projEntry";
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
import { jsx } from "features/feature";
import { createReset } from "features/reset";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource, trackBest } from "features/resources/resource";
import { createLayer, BaseLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { render } from "util/vue";
import { computed, unref } from "vue";
import fome, { FomeTypes } from "../fome/fome";

const id = "acceleron";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Accelerons";
    const color = "#0f52ba";

    const accelerons = createResource<DecimalSource>(0, "Accelerons");
    const bestAccelerons = trackBest(accelerons);
    
    const entropy = createResource<DecimalSource>(0, "Entropy");
    const bestEntropy = trackBest(entropy);

    const timeMult = computed(() => {
        let mult = Decimal.max(unref(bestAccelerons), 0).plus(1);
        mult = mult.gte(1e12) ? mult.log10().times(5e5/6) : mult.sqrt();
        return mult.times(1) // timecube upgrade 12
                   .times(1) // acceleron upgrade 113
                   .times(1) // back time square
                   .times(1) // timecube upgrade 35
                   .div(1) // active back timeline
                   .times(1) // passive back timeline
                   .max(1)
                   .times(1) // negate if constructing
    })
    
    const conversions = [
        createCumulativeConversion(() => ({
            scaling: createPolynomialScaling(1e12, 0.1),
            baseResource: fome.amounts[FomeTypes.quantum],
            gainResource: accelerons
        })),
        createCumulativeConversion(() => ({
            scaling: createPolynomialScaling(1e80, 0.05),
            baseResource: fome.amounts[FomeTypes.quantum],
            gainResource: accelerons
        }))
    ];

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => []
    }));

    const treeNode = createLayerTreeNode(() => ({
        display: "A",
        layerID: id,
        color,
        reset
    }));

    const resetButtons = conversions.map(conversion => 
        createResetButton(() => ({
            conversion,
            tree: root.tree,
            treeNode
        }))
    );

    return {
        name,
        color,
        accelerons,
        bestAccelerons,
        timeMult,
        display: jsx(() => (
            <>
                <MainDisplayVue resource={accelerons} color={color} />
                <SpacerVue />
                {render(resetButtons[0])}
            </>
        )),
        treeNode,
        conversions
    }
})

export default layer;