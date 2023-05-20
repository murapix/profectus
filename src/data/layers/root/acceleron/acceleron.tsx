import { jsx } from "features/feature";
import { createResource, trackBest, trackTotal } from "features/resources/resource";
import Formula from "game/formulas/formulas";
import { BaseLayer, createLayer } from "game/layers";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { computed, unref } from "vue";
import timecube from "../timecube-old/timecube";
import { EffectUpgrade } from "features/upgrades/upgrade";
import entropy from "../acceleron-old/entropy";
import { formatWhole } from "util/break_eternity";
import loops from "./loops";

const id = "acceleron";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Accelerons";
    const color = "#0f52ba";

    const accelerons = createResource<DecimalSource>(0, name);
    const bestAccelerons = trackBest(accelerons);
    const totalAccelerons = trackTotal(accelerons); 

    const timeInput = computed(() => {
        let amount = Decimal.max(unref(bestAccelerons), 0).plus(1);
        return amount.gte(1e12) ? amount.log10().times(5e5/6) : amount.sqrt();
    });
    const timeModifiers = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: (timecube.upgrades.time as EffectUpgrade<DecimalSource>).effect,
            enabled: timecube.upgrades.time.bought,
            description: jsx(() => <>[{timecube.name}] Time</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: entropy.enhancements.dilation.effect as DecimalSource,
            enabled: entropy.enhancements.dilation.bought,
            description: jsx(() => <>[{name}] Entropic Dilation</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => <>[{timecube.name}] Back Time Squares ({formatWhole(Decimal.dZero)})</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => <>[{timecube.name}] Timecube Upgrade 35</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => <>[{timecube.name}] Active Back Timeline Effect</>)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: Decimal.dOne,
            enabled: false,
            description: jsx(() => <>[{timecube.name}] Passive Back Timeline Bonus</>)
        }))
    ]);
    const timeMult = computed(() => Decimal.times(
        timeModifiers.apply(unref(timeInput)),
        unref(loops.isBuilding) ? -1 : 1)
    );

    return {
        name,
        color,
        accelerons,
        bestAccelerons,
        totalAccelerons,
        timeMult,
        display: jsx(() => <>TODO</>),

        loops
    }
})

export default layer;