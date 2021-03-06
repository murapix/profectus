import {
    Clickable,
    ClickableOptions,
    createClickable,
    GenericClickable
} from "@/features/clickables/clickable";
import { GenericConversion } from "@/features/conversion";
import { CoercableComponent, jsx, Replace, setDefault } from "@/features/feature";
import { displayResource } from "@/features/resources/resource";
import {
    createTreeNode,
    GenericTree,
    GenericTreeNode,
    TreeNode,
    TreeNodeOptions
} from "@/features/trees/tree";
import player from "@/game/player";
import Decimal from "@/util/bignum";
import {
    Computable,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { computed, Ref, unref } from "vue";

export interface ResetButtonOptions extends ClickableOptions {
    conversion: GenericConversion;
    tree: GenericTree;
    treeNode: GenericTreeNode;
    resetDescription?: Computable<string>;
    showNextAt?: Computable<boolean>;
    display?: Computable<CoercableComponent>;
    canClick?: Computable<boolean>;
}

type ResetButton<T extends ResetButtonOptions> = Replace<
    Clickable<T>,
    {
        resetDescription: GetComputableTypeWithDefault<T["resetDescription"], Ref<string>>;
        showNextAt: GetComputableTypeWithDefault<T["showNextAt"], true>;
        display: GetComputableTypeWithDefault<T["display"], Ref<JSX.Element>>;
        canClick: GetComputableTypeWithDefault<T["canClick"], Ref<boolean>>;
        onClick: VoidFunction;
    }
>;

export type GenericResetButton = Replace<
    GenericClickable & ResetButton<ResetButtonOptions>,
    {
        resetDescription: ProcessedComputable<string>;
        showNextAt: ProcessedComputable<boolean>;
        display: ProcessedComputable<CoercableComponent>;
        canClick: ProcessedComputable<boolean>;
    }
>;

export function createResetButton<T extends ClickableOptions & ResetButtonOptions>(
    optionsFunc: () => T
): ResetButton<T> {
    return createClickable(() => {
        const resetButton = optionsFunc();

        processComputable(resetButton as T, "showNextAt");
        setDefault(resetButton, "showNextAt", true);

        if (resetButton.resetDescription == null) {
            resetButton.resetDescription = computed(() =>
                Decimal.lt(resetButton.conversion.gainResource.value, 1e3) ? "Reset for " : ""
            );
        } else {
            processComputable(resetButton as T, "resetDescription");
        }

        if (resetButton.display == null) {
            resetButton.display = jsx(() => (
                <span>
                    {unref(resetButton.resetDescription as ProcessedComputable<string>)}
                    <b>
                        {displayResource(
                            resetButton.conversion.gainResource,
                            unref(resetButton.conversion.currentGain)
                        )}
                    </b>{" "}
                    {resetButton.conversion.gainResource.displayName}
                    <div v-show={unref(resetButton.showNextAt)}>
                        <br />
                        Next:{" "}
                        {displayResource(
                            resetButton.conversion.baseResource,
                            unref(resetButton.conversion.nextAt)
                        )}{" "}
                        {resetButton.conversion.baseResource.displayName}
                    </div>
                </span>
            ));
        }

        if (resetButton.canClick == null) {
            resetButton.canClick = computed(() =>
                Decimal.gt(unref(resetButton.conversion.currentGain), 0)
            );
        }

        const onClick = resetButton.onClick;
        resetButton.onClick = function () {
            resetButton.conversion.convert();
            resetButton.tree.reset(resetButton.treeNode);
            onClick?.();
        };

        return resetButton;
    }) as unknown as ResetButton<T>;
}

export interface LayerTreeNodeOptions extends TreeNodeOptions {
    layerID: string;
    color: string;
    append?: boolean;
}
export type LayerTreeNode<T extends LayerTreeNodeOptions> = Replace<
    TreeNode<T>,
    {
        append: ProcessedComputable<boolean>;
    }
>;
export type GenericLayerTreeNode = LayerTreeNode<LayerTreeNodeOptions>;

export function createLayerTreeNode<T extends LayerTreeNodeOptions>(
    optionsFunc: () => T
): LayerTreeNode<T> {
    return createTreeNode(() => {
        const options = optionsFunc();
        processComputable(options as T, "append");
        return {
            ...options,
            display: options.layerID,
            onClick:
                options.append != null && options.append
                    ? function () {
                          if (player.tabs.includes(options.layerID)) {
                              const index = player.tabs.lastIndexOf(options.layerID);
                              player.tabs.splice(index, 1);
                          } else {
                              player.tabs.push(options.layerID);
                          }
                      }
                    : function () {
                          player.tabs.splice(1, 1, options.layerID);
                      }
        };
    }) as unknown as LayerTreeNode<T>;
}
