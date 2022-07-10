import { jsx } from "features/feature";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { BaseLayer, createLayer } from "game/layers";

const id = "timecube";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Timecubes";
    const color = "#f037ea";
    
    const timecubes = createResource(0, "Timecubes");

    return {
        name,
        color,
        timecubes,
        display: jsx(() => (
            <>
                <MainDisplayVue resource={timecubes} color={color} />
            </>
        ))
    }
})

export default layer;