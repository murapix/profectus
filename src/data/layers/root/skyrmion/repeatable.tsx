import { createRepeatable, Repeatable, RepeatableOptions } from "features/clickables/repeatable";
import { Visibility, isVisible } from "features/feature";
import { Requirements, displayRequirements } from "game/requirements";
import settings from "game/settings";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { bonusAmountMixin } from "mixins/bonusAmount";
import { effectMixin } from "mixins/effects";
import { formatSmall, formatWhole } from "util/break_eternity";
import { Direction } from "util/common";
import { MaybeGetter, processGetter } from "util/computed";
import { Renderable, trackHover } from "util/vue";
import { computed, MaybeRef, MaybeRefOrGetter, Ref, unref } from "vue";
import { JSX } from "vue/jsx-runtime";
import { addTooltip } from "wrappers/tooltips/tooltip";

export interface SkyrmionRepeatableData {
    visibility?: MaybeRefOrGetter<Visibility | boolean> | MaybeRefOrGetter<Visibility | boolean>[];
    requirements: Requirements;
    display: {
        name: string;
        description: JSX.Element;
        effect?(effect: DecimalSource, nextEffect: DecimalSource): Renderable;
    };
    effect?(amount: DecimalSource): DecimalSource;
    bonusAmount?: MaybeRefOrGetter<DecimalSource>;
}

export interface SkyrmionRepeatableOptions extends RepeatableOptions, Parameters<typeof bonusAmountMixin> { effect: MaybeGetter<DecimalSource> };
export type SkyrmionRepeatable = Repeatable & {
    effect: MaybeRef<DecimalSource>,
    nextEffect: MaybeRef<DecimalSource>
} & ReturnType<typeof bonusAmountMixin>
& {
    isHovered: Ref<boolean>
};

export function createSkyrmionRepeatable(
    data: SkyrmionRepeatableData
): SkyrmionRepeatable {
    if (data.effect === undefined) {
        data.effect = amount => amount;
    }
    if (data.display.effect === undefined) {
        data.display.effect = (effect: DecimalSource, nextEffect?: DecimalSource) => `${formatSmall(effect)}×${(settings.showNextValues && nextEffect) ? ` → ${formatSmall(nextEffect)}×` : ``}`;
    }

    const visibility: MaybeRef<Visibility | boolean>[] = [];
    if (Array.isArray(data.visibility)) {
        visibility.push(...data.visibility.map(condition => processGetter(condition)));
    }
    else if (data.visibility != null) {
        visibility.push(processGetter(data.visibility));
    }
    else {
        visibility.push(true);
    }
    
    const repeatable = createRepeatable(() => {
        const effectFunc = data.effect!;
        const currentAmount: Ref<DecimalSource> = repeatable.amount;
        const currentTotal: Ref<DecimalSource> = repeatable.totalAmount;
        const nextTotal = computed((): Decimal => Decimal.add(unref(repeatable.totalAmount), 1));
        const isHovered = trackHover(repeatable)
        return {
            visibility: () => unref(visibility.filter(check => isVisible(check))[0]) ?? false,
            requirements: data.requirements,
            display: data.display.name,
            ...effectMixin(() => effectFunc(unref(currentTotal)), () => effectFunc(unref(nextTotal))),
            ...bonusAmountMixin(currentAmount, data.bonusAmount ?? 0),
            isHovered
        }
    });


    addTooltip(repeatable, () => ({
        direction: Direction.Down,
        yoffset: "var(--upgrade-width)",
        display: () => {
            const bonusAmount = unref(repeatable.bonusAmount);
            let bonusAmountDisplay;
            if (Decimal.gt(bonusAmount, 0)) {
                bonusAmountDisplay = <>+{formatWhole(unref(repeatable.bonusAmount))}</>
            }
            const effect = data.display.effect!(unref(repeatable.effect), unref(repeatable.nextEffect));
            return <>
                {data.display.description}
                <br />
                Amount: {formatWhole(unref(repeatable.amount))}{bonusAmountDisplay}
                <br />
                Currently: {effect}
                <br />
                {displayRequirements(repeatable.requirements)}
            </>
        }
    }));

    return repeatable;
}