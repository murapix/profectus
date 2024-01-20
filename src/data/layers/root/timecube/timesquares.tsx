import { createClickable, GenericClickable } from "features/clickables/clickable";
import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import { CoercableComponent, jsx } from "features/feature";
import { GenericRepeatable, RepeatableOptions, createRepeatable } from "features/repeatable";
import { BaseLayer, createLayer } from "game/layers";
import { persistent } from "game/persistence";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { computed, unref } from "vue";
import timecube from "./timecube";
import { Computable } from "util/computed";
import { createTimesquare, Timesquare } from "./timesquare";
import RowVue from "components/layout/Row.vue";
import { render } from "util/vue";
import SpacerVue from "components/layout/Spacer.vue";
import TextVue from "components/fields/Text.vue";
import ColumnVue from "components/layout/Column.vue";

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
            canClick() { return Decimal.gte(unref(buyAmount), 10) },
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
    };
    
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
            display: jsx(() => <>Front</>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.RIGHT]: createTimesquare(square => ({
            display: jsx(() => <>Right</>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.TOP]: createTimesquare(square => ({
            display: jsx(() => <>Top</>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.BACK]: createTimesquare(square => ({
            display: jsx(() => <>Back</>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.LEFT]: createTimesquare(square => ({
            display: jsx(() => <>Left</>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        })),
        [Squares.BOTTOM]: createTimesquare(square => ({
            display: jsx(() => <>Bottom</>),
            effect() { return new Decimal(unref(square.square.amount)) },
            resource: timecube.timecubes,
            baseCost: 1e6,
            buyAmount
        }))
    }

    return {
        buyAmount,
        squares,
        display: jsx(() =>
            <>
                <RowVue>
                    {render(buyAmountButtons.overTen)}
                    {render(buyAmountButtons.minusTen)}
                    {render(buyAmountButtons.minusOne)}
                    <TextVue
                        style={{width: 'fit-content'}}
                        onUpdate:modelValue={value => Decimal.isNaN(value) && Decimal.gte(value, 1)
                            ? (buyAmount.value = value)
                            : null
                        }
                        modelValue={formatWhole(buyAmount.value)}
                    />
                    {render(buyAmountButtons.plusOne)}
                    {render(buyAmountButtons.plusTen)}
                    {render(buyAmountButtons.timesTen)}
                </RowVue>
                <SpacerVue />
                <RowVue>
                    {render(squares.top.square)}
                    <ColumnVue>
                        {render(squares.top.buy)}
                        {render(squares.top.buyNext)}
                        {render(squares.top.buyMax)}
                    </ColumnVue>
                </RowVue>
            </>
        )
    }
});

export default layer;