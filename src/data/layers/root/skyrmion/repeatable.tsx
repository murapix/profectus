import { BonusAmountFeatureOptions, GenericBonusAmountFeature, bonusAmountDecorator } from "features/decorators/bonusDecorator";
import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import { CoercableComponent, Visibility, jsx } from "features/feature";
import { GenericRepeatable, RepeatableOptions, createRepeatable } from "features/repeatable";
import { addTooltip } from "features/tooltips/tooltip";
import { Requirements, displayRequirements } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { formatSmall, formatWhole } from "util/break_eternity";
import { Direction } from "util/common";
import { Computable } from "util/computed";
import { trackHover } from "util/vue";
import { Ref, unref } from "vue";

export interface SkyrmionRepeatableData {
    visibility?: Computable<Visibility | boolean>;
    requirements: Requirements;
    display: {
        name: string;
        description: JSX.Element;
        effect?(effect: unknown, nextEffect: unknown): CoercableComponent;
    };
    effect?(amount: DecimalSource): DecimalSource;
    bonusAmount?: Computable<DecimalSource>;
}

export interface SkyrmionRepeatableOptions extends RepeatableOptions, EffectFeatureOptions, BonusAmountFeatureOptions {};
export type SkyrmionRepeatable = GenericRepeatable & GenericEffectFeature<DecimalSource> & GenericBonusAmountFeature & { isHovered: Ref<boolean> };

export function createSkyrmionRepeatable(
    data: SkyrmionRepeatableData
): SkyrmionRepeatable {
    if (data.effect === undefined) {
        data.effect = amount => amount;
    }
    if (data.display.effect === undefined) {
        data.display.effect = (effect: DecimalSource, nextEffect?: DecimalSource) => `${formatSmall(effect)}×${nextEffect ? ` → ${formatSmall(nextEffect)}×` : undefined}`;
    }
    const repeatable = createRepeatable<SkyrmionRepeatableOptions>(feature => ({
        visibility: data.visibility,
        requirements: data.requirements,
        display: data.display.name,
        effect: () => data.effect!(unref((feature as SkyrmionRepeatable).totalAmount)),
        nextEffect: () => data.effect!(Decimal.add(unref((feature as SkyrmionRepeatable).totalAmount), 1)),
        bonusAmount: data.bonusAmount ?? 0
    }), effectDecorator, bonusAmountDecorator) as SkyrmionRepeatable;

    addTooltip(repeatable, {
        direction: Direction.Down,
        yoffset: "var(--upgrade-width)",
        display: jsx(() => {
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
        })
    });

    repeatable.isHovered = trackHover(repeatable);

    return repeatable;
}