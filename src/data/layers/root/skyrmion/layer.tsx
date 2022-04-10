import {
    createExponentialScaling,
    createIndependentConversion,
    GenericConversion
} from "features/conversion";
import { jsx } from "features/feature";
import { createReset } from "features/reset";
import { createResource } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/break_eternity";
import { render, renderRow } from "util/vue";
import { computed, unref } from "vue";
import { createLayerTreeNode, createResetButton, GenericResetButton } from "../../../common";
import { root } from "../../../projEntry";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import SpacerVue from "components/layout/Spacer.vue";
import { globalBus } from "game/events";
import SkyrmionVue from "./Skyrmion.vue";
import {
    pions,
    pionUpgrades,
    skyrmions,
    skyrmionUpgrades,
    spinors,
    spinorUpgrades
} from "./skyrmion";
import PionVue from "./Pion.vue";
import RowVue from "components/layout/Row.vue";
import ColumnVue from "components/layout/Column.vue";
import SpinorVue from "./Spinor.vue";
import ResourceVue from "features/resources/Resource.vue";

const layer = createLayer(() => {
    const id = "skyrmion";
    const name = "Skyrmion";
    const color = "#37d7ff";

    const totalSkyrmions = computed(() => Decimal.add(skyrmions.value, 0));
    const genRate = computed(() => {
        // eslint-disable-next-line
        let rate = totalSkyrmions.value
        return rate;
    });
    globalBus.on("update", diff => {
        pions.value = Decimal.times(genRate.value, diff).plus(pions.value);
        spinors.value = Decimal.times(genRate.value, diff).plus(spinors.value);
    });

    const minAmount = computed(() => Decimal.min(pions.value, spinors.value));
    const minResource = createResource<DecimalSource>(minAmount, "Pions and Spinors");

    const gainFunction = {
        currentGain: computed(() => 0),
        currentAt: computed(() => 0),
        nextAt: computed(() => 0)
    };
    const conversion = createIndependentConversion(() => ({
        scaling: createExponentialScaling(10, 1),
        baseResource: minResource,
        gainResource: skyrmions,
        buyMax: true,
        convert() {
            conversion.gainResource.value = unref((conversion as GenericConversion).currentGain);
            const cost = Decimal.div(conversion.nextAt.value, 10);
            pions.value = Decimal.sub(pions.value, cost);
            spinors.value = Decimal.sub(spinors.value, cost);
        }
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => []
    }));

    const treeNode = createLayerTreeNode(() => ({
        display: "S",
        layerID: id,
        color,
        reset
    }));

    const resetButton = createResetButton(() => ({
        conversion,
        tree: root.tree,
        treeNode
    }));

    return {
        id,
        name,
        color,
        skyrmions,
        skyrmionUpgrades,
        pions,
        pionUpgrades,
        spinors,
        spinorUpgrades,
        display: jsx(() => (
            <>
                <MainDisplayVue resource={skyrmions} color={color} />
                <SpacerVue />
                <div v-show={false}>
                    Your Subspatial Foam is granting an additional{" "}
                    <span color={color}>{format(3)}</span> Skyrmions
                    <SpacerVue />
                </div>
                <SkyrmionVue>{render(resetButton)}</SkyrmionVue>
                <SpacerVue />
                <RowVue>
                    <ColumnVue>
                        <div>
                            You have <ResourceVue resource={pions} color={color} tag="h3" />{" "}
                            {pions.displayName}
                        </div>
                        <SpacerVue />
                        <PionVue />
                    </ColumnVue>
                    <SpacerVue />
                    <ColumnVue>
                        <div>
                            You have <ResourceVue resource={spinors} color={color} tag="h3" />{" "}
                            {spinors.displayName}
                        </div>
                        <SpacerVue />
                        <SpinorVue />
                    </ColumnVue>
                </RowVue>
            </>
        )),
        treeNode
    };
});

export default layer;
