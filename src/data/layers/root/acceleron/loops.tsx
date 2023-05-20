import { jsx } from "features/feature";
import { BaseLayer, createLayer } from "game/layers";
import { persistent } from "game/persistence";

const id = "loops";
const layer = createLayer(id, function (this: BaseLayer) {
    const isBuilding = persistent<boolean>(false);

    return {
        isBuilding,
        display: jsx(() => <>TODO</>)
    }
})

export default layer;