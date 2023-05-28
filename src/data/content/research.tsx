import { CoercableComponent, Component, GatherProps, GenericComponent, OptionsFunc, Replace, Visibility, getUniqueID, setDefault } from "features/feature";
import { Resources } from "./resources";
import { Computable, GetComputableType, GetComputableTypeWithDefault, ProcessedComputable, processComputable } from "util/computed";
import { Persistent, persistent } from "game/persistence";
import { Ref, computed } from "vue";
import { createLazyProxy } from "util/proxies";
import { root } from "data/projEntry";
import ResearchComponent from "./Research.vue";

export const ResearchType = Symbol("Research");

export interface ResearchOptions {
    visibility?: Computable<Visibility | boolean>;
    resources: Partial<Record<Resources, number>>;
    display: Computable<{
        title: CoercableComponent;
        description: CoercableComponent;
    }>;
}

export interface BaseResearch {
    id: string;
    progress: Persistent<Partial<Record<Resources, number>>>;
    progressPercentage: Ref<number>;
    researched: Ref<boolean>;
    isResearching: Ref<boolean>;
    type: typeof ResearchType;
    [Component]: GenericComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Research<T extends ResearchOptions> = Replace<
    T & BaseResearch,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        display: GetComputableType<T["display"]>;
    }
>;

export type GenericResearch = Replace<
    Research<ResearchOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

export function createResearch<T extends ResearchOptions>(
    optionsFunc: OptionsFunc<T, BaseResearch, GenericResearch>
): Research<T> {
    const progress = persistent<Partial<Record<Resources, number>>>({});
    return createLazyProxy<Research<T>, Research<T>>(feature => {
        const research = optionsFunc.call(feature, feature);

        research.id = getUniqueID("research-");
        research.type = ResearchType;
        research[Component] = ResearchComponent as GenericComponent;

        for (const [resource, amount] of Object.entries(research.resources) as [Resources, number][]) {
            progress.value[resource] = amount;
        }
        research.progress = progress;

        processComputable(research as T, "visibility");
        setDefault(research, "visibility", Visibility.Visible);
        processComputable(research as T, "display");

        research.progressPercentage = computed(() => {
            return 1 - Object.values(research.progress!.value).reduce((a,b) => a+b, 0) / Object.values(research.resources).reduce((a,b) => a+b, 0);
        });
        research.isResearching = computed(() => root.activeResearch.value === research.id);
        research.researched = computed(() => Object.values(research.progress!.value).every(amount => amount === 0));

        research[GatherProps] = function (this: GenericResearch) {
            const {
                visibility, display, id, resources, progress, progressPercentage, isResearching, researched
            } = this;
            return {
                visibility, display, id, resources, progress, progressPercentage, isResearching, researched
            }
        }

        return research as unknown as Research<T>;
    });
}