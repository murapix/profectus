import { OptionsFunc, Replace, Visibility, setDefault } from "features/feature";
import { GenericFormula, InvertibleFormula } from "game/formulas/types";
import { Requirement } from "game/requirements";
import Decimal, { DecimalSource, formatWhole } from "util/bignum";
import { Computable, ProcessedComputable, processComputable } from "util/computed";
import { Ref, computed, unref } from "vue";
import fome, { FomeTypes } from "./fome";
import { createLazyProxy } from "util/proxies";
import Formula, { calculateCost, calculateMaxAffordable } from "game/formulas/formulas";
import { createResource } from "features/resources/resource";

export interface ReformRequirementOptions {
    fomeType: FomeTypes;
    cost: Computable<DecimalSource> | GenericFormula;
    visibility?: Computable<Visibility.Visible | Visibility.None | boolean>;
}

export type ReformRequirement = Replace<
    Requirement & ReformRequirementOptions,
    {
        cost: ProcessedComputable<DecimalSource> | GenericFormula;
        visibility: ProcessedComputable<Visibility.Visible | Visibility.None | boolean>;
    }
>;

export function createReformRequirement<T extends ReformRequirementOptions>(
    optionsFunc: OptionsFunc<T>
): ReformRequirement {
    return createLazyProxy(feature => {
        const req = optionsFunc.call(feature, feature) as T & Partial<Requirement>;

        req.partialDisplay = amount => (
            <span
                style={
                    unref(req.requirementMet as ProcessedComputable<boolean>)
                        ? ""
                        : "color: var(--danger)"
                }
            >
                {fome[req.fomeType].amount.displayName}
                <sup>{formatWhole(Decimal.floor(
                    req.cost instanceof Formula
                        ? calculateCost(req.cost, amount ?? 1, false)
                        : unref(req.cost as ProcessedComputable<DecimalSource>)
                ))}</sup>
            </span>
        );
        req.display = amount => (
            <div>
                Requires: {fome[req.fomeType].amount.displayName}
                <sup>{formatWhole(Decimal.floor(
                    req.cost instanceof Formula
                        ? calculateCost(req.cost, amount ?? 1, false)
                        : unref(req.cost as ProcessedComputable<DecimalSource>)
                ))}</sup>
            </div>
        );

        processComputable(req as T, "visibility");
        setDefault(req, "visibility", Visibility.Visible);
        processComputable(req as T, "cost");
        setDefault(req, "pay", () => {});

        req.canMaximize = req.cost instanceof Formula && req.cost.isInvertible();

        if (req.cost instanceof Formula && req.cost.isInvertible()) {
            req.requirementMet = calculateMaxAffordable(
                req.cost,
                createResource(computed(() => unref(fome[req.fomeType].upgrades.reform.amount)), ""),
                false
            );
        } else {
            req.requirementMet = computed(() => {
                if (req.cost instanceof Formula) {
                    return Decimal.gte(fome[req.fomeType].upgrades.reform.amount.value, req.cost.evaluate());
                } else {
                    return Decimal.gte(
                        fome[req.fomeType].upgrades.reform.amount.value,
                        unref(req.cost as ProcessedComputable<DecimalSource>)
                    );
                }
            });
        }

        return req as ReformRequirement;
    })
}