import { Resource } from "features/resources/resource";
import Formula, { calculateCost } from "game/formulas/formulas";
import { FormulaSource } from "game/formulas/types";
import { Persistent, persistent } from "game/persistence";
import { displayRequirements, Requirements, requirementsMet } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { createLazyProxy } from "util/proxies";
import { MaybeRef, MaybeRefOrGetter, Ref, computed, unref } from "vue";
import ResearchComponent from "../inflaton/Research.vue";
import { isJSXElement, Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { Visibility } from "features/feature";
import { processGetter } from "util/computed";

export const ResearchType = Symbol("Research");

export interface ResearchOptions extends VueFeatureOptions {
    prerequisites?: Research[];
    requirements: Requirements;
    display: MaybeRefOrGetter<Renderable>
        | {
            title: MaybeRefOrGetter<Renderable>;
            description: MaybeRefOrGetter<Renderable>;
            effect?: MaybeRefOrGetter<Renderable>;
    };
    canResearch?: MaybeRefOrGetter<boolean>;
    onResearch?: VoidFunction;
    research: (force: boolean) => void;
    isResearching: () => boolean;
}

export interface Research extends VueFeature {
    prerequisites?: Research[];
    requirements: Requirements;
    display: MaybeRef<Renderable>;
    canResearch: MaybeRef<boolean>;
    progress: Persistent<DecimalSource>;
    progressPercentage: Ref<DecimalSource>;
    researched: Ref<boolean>;
    research: (force: boolean) => void;
    isResearching: MaybeRef<boolean>;
}

export function createResearch<T extends ResearchOptions>(
    optionsFunc: () => T
) {
    const progress = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const options = optionsFunc();
        const {
            visibility: _visibility,
            canResearch: _canResearch,
            prerequisites,
            requirements,
            display: _display,
            isResearching: _isResearching,
            research: _research,
            ...props
        } = options;

        const canResearch = computed(() => {
            if (_canResearch != null) {
                if (!unref(_canResearch)) {
                    return false;
                }
            }
            return prerequisites?.every(research => unref(research.researched)) ?? true;
        })
        
        const visibility = (() => {
            const processedVisibility = processGetter(_visibility);
            const visibility = computed(() => {
                if (unref(researched)) return Visibility.Visible;
                if (prerequisites?.every(research => unref(research.researched) || unref(canResearch)) ?? true) {
                    return unref(processedVisibility) ?? Visibility.Visible;
                }
                return Visibility.None;
            });
            return visibility;
        })();

        const researched = computed(() => requirementsMet(requirements));

        const progressPercentage = computed(() => {
            if (Array.isArray(requirements)) {
                let cost = Decimal.dZero;
                let current = Decimal.dZero;
                for (const requirement of requirements) {
                    if (!('cost' in requirement && 'resource' in requirement)) continue;
                    const reqCost = requirement.cost as Formula<[FormulaSource] | FormulaSource[]> | MaybeRef<DecimalSource>
                    const reqResource = requirement.resource as Resource<DecimalSource>;
                    cost = cost.plus(reqCost instanceof Formula
                        ? calculateCost(reqCost, 1, false, 0)
                        : unref(reqCost)
                    );
                    current = current.plus(unref(reqResource));
                }
                return cost.gte(0) ? cost.div(current) : 0;
            }
            else {
                if (!('cost' in requirements && 'resource' in requirements)) return 0;
                const cost = requirements.cost as Formula<[FormulaSource] | FormulaSource[]> | MaybeRef<DecimalSource>;
                const resource = requirements.resource as Resource<DecimalSource>;
                return Decimal.div(unref(resource), (cost instanceof Formula ? calculateCost(cost, 1, false, 0) : unref(cost)));
            }
        });

        const display = (() => {
            const processedDisplay = processGetter(_display);
            return computed(() => {
                const currentDisplay = unref(processedDisplay);
                if (isJSXElement(currentDisplay)) return currentDisplay;
                if (typeof currentDisplay === 'string') return currentDisplay;

                const Title = <h3>{currentDisplay.title}</h3>
                const Description = <>{currentDisplay.description}</>;
                const Effect = <>{currentDisplay.effect}</>;
                return <>
                    <span>{ Title }</span>
                    <span>{ Description }</span>
                    { currentDisplay.effect ? <span>Currently: { Effect }</span> : undefined }
                    { displayRequirements(requirements) }
                </>
            });
        })();

        const isResearching = processGetter(_isResearching);

        const research = {
            ...props,
            progress,
            canResearch,
            progressPercentage,
            isResearching,
            researched,
            requirements,
            display,
            research: _research,
            ...vueFeatureMixin("research", {
                ...options,
                visibility
            }, () => <ResearchComponent
                visibility={visibility}
                display={unref(display)}
                id={research.id}
                requirements={requirements}
                canResearch={canResearch}
                isResearching={isResearching}
                progress={progress}
                progressPercentage={progressPercentage}
                research={_research}
                researched={researched}
            />)
        }

        return research;
    })
}

export function getResearchEffect<T = unknown>(research: Research & { effect: MaybeRef<T> }, defaultValue: T): T {
    return unref(research.researched) ? unref(research.effect) : defaultValue;
}