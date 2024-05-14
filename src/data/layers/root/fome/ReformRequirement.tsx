import { OptionsFunc, Replace, Visibility } from "features/feature";
import Formula, { calculateCost } from "game/formulas/formulas";
import { GenericFormula } from "game/formulas/types";
import { Requirement } from "game/requirements";
import Decimal, { DecimalSource, formatWhole } from "util/bignum";
import { Computable, ProcessedComputable, processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { computed, unref } from "vue";
import fome, { FomeTypes } from "./fome";

export interface ReformRequirementOptions {
    fomeType: Computable<FomeTypes>;
    cost: Computable<DecimalSource> | GenericFormula;
}

export type ReformRequirement = Replace<
    Requirement & ReformRequirementOptions,
    {
        fomeType: ProcessedComputable<FomeTypes>;
        cost: ProcessedComputable<DecimalSource> | GenericFormula;
    }
>;

export function createReformRequirement<T extends ReformRequirementOptions>(
    optionsFunc: OptionsFunc<T>
): ReformRequirement {
    return createLazyProxy(feature => {
        const req = optionsFunc.call(feature, feature) as T & Partial<Requirement>;

        processComputable(req as T, "fomeType");

        req.partialDisplay = amount => (
            <span
                style={
                    unref(req.requirementMet as ProcessedComputable<boolean>)
                        ? ""
                        : "color: var(--danger)"
                }
            >
                {unref(fome[unref(req.fomeType as ProcessedComputable<FomeTypes>)].amount.displayName)}
                <sup>{formatWhole(Decimal.floor(
                    req.cost instanceof Formula
                        ? calculateCost(req.cost, amount ?? 1, false)
                        : unref(req.cost as ProcessedComputable<DecimalSource>)
                ))}</sup>
            </span>
        );
        req.display = amount => (
            <div>
                Requires: {unref(fome[unref(req.fomeType as ProcessedComputable<FomeTypes>)].amount.displayName)}
                <sup>{formatWhole(Decimal.floor(
                    req.cost instanceof Formula
                        ? calculateCost(req.cost, amount ?? 1, false)
                        : unref(req.cost as ProcessedComputable<DecimalSource>)
                ))}</sup>
            </div>
        );

        req.visibility = Visibility.Visible;
        req.requiresPay = false;
        processComputable(req as T, "cost");
        
        req.requirementMet = computed(() => {
            if (req.cost instanceof Formula) {
                return Decimal.gte(fome[unref(req.fomeType as ProcessedComputable<FomeTypes>)].upgrades.reform.amount.value, req.cost.evaluate());
            } else {
                return Decimal.gte(
                    fome[unref(req.fomeType as ProcessedComputable<FomeTypes>)].upgrades.reform.amount.value,
                    unref(req.cost as ProcessedComputable<DecimalSource>)
                );
            }
        });

        return req as ReformRequirement;
    })
}