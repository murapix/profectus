import { jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { createLayer } from "game/layers";
import { DecimalSource } from "util/bignum";
import { $enum } from "ts-enum-util";

export enum FomeTypes {
    protoversal = "protoversal",
    infinitesimal = "infinitesimal",
    subspatial = "subspatial",
    subplanck = "subplanck",
    quantum = "quantum"
}

const layer = createLayer(() => {
    const id = "fome";
    const name = "Quantum Foam";
    const color = "#ffffff";

    const fomeAmounts = $enum(FomeTypes).map(value => createResource<DecimalSource>(0, value));

    return {
        id,
        name,
        color,
        fomeAmounts,
        display: jsx(() => <></>)
    };
});

export default layer;
