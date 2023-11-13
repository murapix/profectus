import { createClickable, GenericClickable } from "features/clickables/clickable";
import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import { CoercableComponent, jsx } from "features/feature";
import { GenericRepeatable, RepeatableOptions, createRepeatable } from "features/repeatable";
import { BaseLayer, createLayer } from "game/layers";
import { persistent } from "game/persistence";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { formatWhole } from "util/break_eternity";
import { computed, unref } from "vue";
import timecube from "./timecube";
import { Computable } from "util/computed";
import { createTimesquare, Timesquare } from "./timesquare";

const id = "timesquare";
const layer = createLayer(id, function (this: BaseLayer) {
    const buyAmount = persistent<DecimalSource>(1);
    const buyAmountScale = computed(() => Decimal.clampMin(unref(buyAmount), 1).log10().floor().minus(1).pow10());
    const canReduceAmount = computed(() => Decimal.gt(unref(buyAmount), 1));
    const buyAmountStyle = { minHeight: '30px', width: '50px' };
    const buyAmountButtons = {
        timesTen: createClickable(() => ({
            display: 'x10',
            onClick() { buyAmount.value = Decimal.times(unref(buyAmount), 10); },
            style: buyAmountStyle
        })),
        plusTen: createClickable(() => ({
            display: jsx(() => <>+{formatWhole(unref(buyAmountScale).times(10))}</>),
            onClick() { buyAmount.value = unref(buyAmountScale).times(10).plus(unref(buyAmount)); },
            style: buyAmountStyle
        })),
        plusOne: createClickable(() => ({
            display: jsx(() => <>+{formatWhole(unref(buyAmountScale))}</>),
            onClick() { buyAmount.value = unref(buyAmountScale).plus(unref(buyAmount)); },
            style: buyAmountStyle
        })),
        minusOne: createClickable(() => ({
            canClick: canReduceAmount,
            display: jsx(() => <>-{formatWhole(unref(buyAmountScale))}</>),
            onClick() { buyAmount.value = Decimal.minus(unref(buyAmount), unref(buyAmountScale)).clampMin(1); },
            style: buyAmountStyle
        })),
        minusTen: createClickable(() => ({
            canClick: canReduceAmount,
            display: jsx(() => <>-{formatWhole(unref(buyAmountScale).times(10))}</>),
            onClick() { buyAmount.value = Decimal.minus(unref(buyAmount), unref(buyAmountScale).times(10)).clampMin(1); },
            style: buyAmountStyle
        })),
        overTen: createClickable(() => ({
            canClick: canReduceAmount,
            display: '/10',
            onClick() { buyAmount.value = Decimal.div(unref(buyAmount), 10).clampMin(1); },
            style: buyAmountStyle
        }))
    }
    
    enum Squares {
        FRONT = "front",
        RIGHT = "right",
        TOP = "top",
        BACK = "back",
        LEFT = "left",
        BOTTOM = "bottom"
    }
    const squares: Record<Squares, Timesquare> = {
        [Squares.FRONT]: createTimesquare(square => ({
            display: jsx(() => <></>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.RIGHT]: createTimesquare(square => ({
            display: jsx(() => <></>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.TOP]: createTimesquare(square => ({
            display: jsx(() => <></>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.BACK]: createTimesquare(square => ({
            display: jsx(() => <></>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.LEFT]: createTimesquare(square => ({
            display: jsx(() => <></>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.BOTTOM]: createTimesquare(square => ({
            display: jsx(() => <></>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        }))
    }

    return {
        buyAmount,
        display: jsx(() => <></>)
    }
});

export default layer;