import Text from "components/fields/Text.vue";
import Row from "components/layout/Row.vue";
import Spacer from "components/layout/Spacer.vue";
import { createClickable } from "features/clickables/clickable";
import { jsx } from "features/feature";
import { getUpgradeEffect } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { noPersist, persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { render, renderRow } from "util/vue";
import { computed, ref, unref, watch } from "vue";
import acceleron from "../acceleron/acceleron";
import timecube from "./timecube";
import { Timesquare, createTimesquare } from "./timesquare";

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
    
    const squares: Record<Sides, Timesquare> = {
        [Sides.FRONT]: createTimesquare(Sides.FRONT, square => ({
            display: {
                title: jsx(() => <>Front</>),
                effect: jsx(() => <>+{format(unref(square.square.effect).minus(1).times(100))}%{
                    Decimal.gt(unref(square.toBuy), 0)
                    ? <> → +{format(unref(square.square.nextEffect!).minus(1).times(100))}%</>
                    : undefined
                } {timecube.timecubes.displayName}</>)
            },
            effect() { return Decimal.pow(unref(square.square.amount), 0.45).times(getUpgradeEffect(timecube.upgrades.turn)).plus(1) },
            nextEffect() { return Decimal.plus(unref(square.square.amount), unref(square.toBuy)).pow(0.45).times(getUpgradeEffect(timecube.upgrades.turn)).plus(1) },
            resource: noPersist(timecube.timecubes),
            baseCost: 1e6,
            buyAmount
        })),
        [Sides.RIGHT]: createTimesquare(Sides.RIGHT, square => ({
            display: {
                title: jsx(() => <>Right</>),
                effect: jsx(() => <>+{format(unref(square.square.effect))}×{
                    Decimal.gt(unref(square.toBuy), 0)
                    ? <> → +{format(unref(square.square.nextEffect!))}</>
                    : undefined
                } Entropic Loop build speed</>)
            },
            effect() { return Decimal.pow(unref(square.square.amount), 0.7).plus(1) },
            nextEffect() { return Decimal.plus(unref(square.square.amount), unref(square.toBuy)).pow(0.7).plus(1) },
            resource: noPersist(timecube.timecubes),
            baseCost: 1e6,
            buyAmount
        })),
        [Sides.TOP]: createTimesquare(Sides.TOP, square => ({
            display: {
                title: jsx(() => <>Top</>),
                effect: jsx(() => <>+{format(unref(square.square.effect).minus(1).times(100))}%{
                    Decimal.gt(unref(square.toBuy), 0)
                    ? <> → +{format(unref(square.square.nextEffect!).minus(1).times(100))}%</>
                    : undefined
                } increased Universe diameter</>)
            },
            effect() { return Decimal.pow(unref(square.square.amount), 0.15).dividedBy(15).plus(1) },
            nextEffect() { return Decimal.plus(unref(square.square.amount), unref(square.toBuy)).pow(0.15).dividedBy(15).plus(1) },
            resource: noPersist(timecube.timecubes),
            baseCost: 1e6,
            buyAmount
        })),
        [Sides.BACK]: createTimesquare(Sides.BACK, square => ({
            display: {
                title: jsx(() => <>Back</>),
                effect: jsx(() => <>+{format(unref(square.square.effect).minus(1).times(100))}%{
                    Decimal.gt(unref(square.toBuy), 0)
                    ? <> → +{format(unref(square.square.nextEffect!).minus(1).times(100))}%</>
                    : undefined
                } {acceleron.accelerons.displayName} effect</>)
            },
            effect() { return Decimal.pow(unref(square.square.amount), 0.2).dividedBy(5).plus(1) },
            nextEffect() { return Decimal.plus(unref(square.square.amount), unref(square.toBuy)).pow(0.2).dividedBy(5).plus(1) },
            resource: noPersist(timecube.timecubes),
            baseCost: 1e6,
            buyAmount
        })),
        [Sides.LEFT]: createTimesquare(Sides.LEFT, square => ({
            display: {
                title: jsx(() => <>Left</>),
                effect: jsx(() => <>1/{format(unref(square.square.effect))}×{
                    Decimal.gt(unref(square.toBuy), 0)
                    ? <> → 1/{format(unref(square.square.nextEffect!))}×</>
                    : undefined
                } Subspatial Construction cost</>)
            },
            effect() { return Decimal.pow(unref(square.square.amount), 0.5).plus(1) },
            nextEffect() { return Decimal.plus(unref(square.square.amount), unref(square.toBuy)).pow(0.5).plus(1) },
            resource: noPersist(timecube.timecubes),
            baseCost: 1e6,
            buyAmount
        })),
        [Sides.BOTTOM]: createTimesquare(Sides.BOTTOM, square => ({
            display: {
                title: jsx(() => <>Bottom</>),
                effect: jsx(() => <>+{format(unref(square.square.effect))}{
                    Decimal.gt(unref(square.toBuy), 0)
                    ? <> → +{format(unref(square.square.nextEffect!))}</>
                    : undefined
                } effective Entropic Enhancements</>)
            },
            effect() { return Decimal.pow(unref(square.square.amount), 0.1).times(getUpgradeEffect(timecube.upgrades.tall)) },
            nextEffect() { return Decimal.plus(unref(square.square.amount), unref(square.toBuy)).pow(0.1).times(getUpgradeEffect(timecube.upgrades.tall)) },
            resource: noPersist(timecube.timecubes),
            baseCost: 1e6,
            buyAmount
        }))
    }

    const buyAmountInput = ref<string>('1');
    watch(buyAmountInput, updated => {
        if (updated === '') { buyAmount.value = Decimal.dOne; return; }
        if (Decimal.isNaN(updated)) return;
        if (Decimal.lt(updated, 1)) { buyAmount.value = Decimal.dOne; return; }
        buyAmount.value = Decimal.floor(updated);
    });

    return {
        buyAmount,
        squares,
        display: jsx(() =>
            <>
                <Row>
                    {render(buyAmountButtons.overTen)}
                    {render(buyAmountButtons.minusTen)}
                    {render(buyAmountButtons.minusOne)}
                    <Text
                        style={{width: 'fit-content'}}
                        onUpdate:modelValue={value => buyAmountInput.value = value}
                        modelValue={buyAmountInput.value}
                        autofocus={false}
                    />
                    {render(buyAmountButtons.plusOne)}
                    {render(buyAmountButtons.plusTen)}
                    {render(buyAmountButtons.timesTen)}
                </Row>
                <Spacer />
                {renderRow(squares.front, squares.right, squares.top)}
                {renderRow(squares.back, squares.left, squares.bottom)}
            </>
        )
    }
});

export default layer;

export enum Sides {
    FRONT = "front",
    RIGHT = "right",
    TOP = "top",
    BACK = "back",
    LEFT = "left",
    BOTTOM = "bottom"
}
