import { Visibility } from "features/feature";
import Formula, { calculateCost } from "game/formulas/formulas";
import { GenericFormula } from "game/formulas/types";
import Decimal, { DecimalSource, formatWhole } from "util/bignum";
import { createLazyProxy } from "util/proxies";
import { computed, MaybeRef, unref } from "vue";
import fome, { FomeTypes } from "./fome";
import { MaybeGetter, processGetter } from "util/computed";
import { Requirement } from "game/requirements";
import { SkipPersistence } from "game/persistence";

export interface ReformRequirementOptions {
    fomeType: MaybeGetter<FomeTypes>;
    cost: MaybeGetter<DecimalSource> | GenericFormula;
}

export interface ReformRequirement extends Requirement {
    fomeType: MaybeRef<FomeTypes>;
    cost: MaybeRef<DecimalSource> | GenericFormula;
}

export function createReformRequirement<T extends ReformRequirementOptions>(
    optionsFunc: () => T
) {
    return createLazyProxy(() => {
        const options = optionsFunc();
        
        const fomeType = processGetter(options.fomeType);
        const cost = processGetter(options.cost);

        const requirementMet = (
            cost instanceof Formula
            ? computed((): boolean => Decimal.gte(
                fome[unref(fomeType)].upgrades.reform.amount.value,
                cost.evaluate()
            ))
            : computed((): boolean => Decimal.gte(
                fome[unref(fomeType)].upgrades.reform.amount.value,
                unref(cost as MaybeRef<DecimalSource>)
            ))
        );
        const partialDisplay = (amount?: DecimalSource) => (
            <span style={ unref(requirementMet) ? "" : "color: var(--danger)" }>
                {unref(fome[unref(fomeType)].amount.displayName)}
                <sup>{formatWhole(Decimal.floor(
                    cost instanceof Formula
                        ? calculateCost(cost, amount ?? 1, false)
                        : unref(cost as MaybeRef<DecimalSource>)
                ))}</sup>
            </span>
        );
        const display = (amount?: DecimalSource) => (
            <div>
                Requires: {unref(fome[unref(fomeType)].amount.displayName)}
                <sup>{formatWhole(Decimal.floor(
                    cost instanceof Formula
                        ? calculateCost(cost, amount ?? 1, false)
                        : unref(cost as MaybeRef<DecimalSource>)
                ))}</sup>
            </div>
        );
        const requirement = {
            visibility: Visibility.Visible,
            cost,
            fomeType,
            requiresPay: false,
            requirementMet,
            partialDisplay,
            display,
            [SkipPersistence]: true
        } satisfies ReformRequirement;

        return requirement;
    });
}