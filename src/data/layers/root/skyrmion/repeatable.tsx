import { AutobuyFeatureOptions, autobuyDecorator } from "features/decorators/autobuyDecorator";
import { BonusAmountFeatureOptions, GenericBonusAmountFeature, bonusAmountDecorator } from "features/decorators/bonusDecorator";
import { EffectFeatureOptions, GenericEffectFeature, effectDecorator } from "features/decorators/common";
import { CoercableComponent, Visibility, jsx } from "features/feature";
import { RepeatableOptions } from "features/repeatable";
import { createRepeatable } from "features/repeatable";
import { GenericRepeatable } from "features/repeatable";
import { addTooltip } from "features/tooltips/tooltip";
import { Requirements, displayRequirements } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { formatSmall, formatWhole } from "util/break_eternity";
import { Direction } from "util/common";
import { Computable } from "util/computed";
import { unref } from "vue";
import skyrmion from "./skyrmion";

export interface SkyrmionRepeatableData {
    visibility?: Computable<Visibility | boolean>;
    requirements: Requirements;
    display: {
        name: string;
        description: JSX.Element;
        effect?(effect: unknown): CoercableComponent;
    };
    shouldAutobuy: Computable<boolean>;
    effect?(amount: DecimalSource): unknown;
    bonusAmount?: Computable<DecimalSource>;
}

export interface SkyrmionRepeatableOptions extends RepeatableOptions, EffectFeatureOptions, BonusAmountFeatureOptions, AutobuyFeatureOptions {};
export type SkyrmionRepeatable = GenericRepeatable & GenericEffectFeature & GenericBonusAmountFeature;

export function createSkyrmionRepeatable(
    data: SkyrmionRepeatableData
): SkyrmionRepeatable {
    if (data.effect === undefined) {
        data.effect = amount => amount;
    }
    if (data.display.effect === undefined) {
        data.display.effect = (effect: DecimalSource) => `${formatSmall(effect)}x`;
    }
    const repeatable = createRepeatable<SkyrmionRepeatableOptions>(feature => ({
        visibility: data.visibility,
        requirements: data.requirements,
        display: data.display.name,
        shouldAutobuy: data.shouldAutobuy,
        eventEmitter: skyrmion.on,
        effect: () => data.effect!(unref((feature as SkyrmionRepeatable).totalAmount)),
        bonusAmount: data.bonusAmount ?? 0
    }), effectDecorator, bonusAmountDecorator, autobuyDecorator) as SkyrmionRepeatable;

    addTooltip(repeatable, {
        direction: Direction.Down,
        yoffset: "var(--upgrade-width)",
        display: jsx(() => {
            const bonusAmount = unref(repeatable.bonusAmount);
            let bonusAmountDisplay;
            if (Decimal.gt(bonusAmount, 0)) {
                bonusAmountDisplay = <>+{formatWhole(unref(repeatable.bonusAmount))}</>
            }
            const effectDisplay = data.display.effect!(unref(repeatable.effect));
            return <>
                {data.display.description}
                <br />
                Amount: {formatWhole(unref(repeatable.amount))}{bonusAmountDisplay}
                <br />
                Currently: {effectDisplay}
                <br />
                {displayRequirements(repeatable.requirements)}
            </>
        })
    });

    return repeatable;
}