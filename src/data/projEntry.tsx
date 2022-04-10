import Spacer from "components/layout/Spacer.vue";
import { jsx } from "features/feature";
import { createTree, defaultResetPropagation, GenericTree } from "features/trees/tree";
import { createLayer, GenericLayer } from "game/layers";
import player, { PlayerData } from "game/player";
import { format, formatTime } from "util/bignum";
import { render } from "util/vue";
import { computed, toRaw } from "vue";
import entangled from "./layers/root/entangled";
import fome from "./layers/root/fome";
import skyrmion from "./layers/root/skyrmion/layer";

/**
 * @hidden
 */
export const root = createLayer(() => {
    const tree = createTree(() => ({
        nodes: [[skyrmion.treeNode], [fome.treeNode], [entangled.treeNode]],
        branches: [{ startNode: fome.treeNode, endNode: skyrmion.treeNode }],
        onReset() {
            toRaw(this.resettingNode.value) === toRaw(skyrmion.treeNode) ? 0 : 10;
        },
        resetPropagation: defaultResetPropagation
    })) as GenericTree;

    return {
        id: "root",
        name: "Tree",
        links: tree.links,
        display: jsx(() => (
            <>
                <div v-show={player.devSpeed === 0}>Game Paused</div>
                <div v-show={player.devSpeed && player.devSpeed !== 1}>
                    Dev Speed: {format(player.devSpeed || 0)}x
                </div>
                <div v-show={player.offlineTime != undefined}>
                    Offline Time: {formatTime(player.offlineTime || 0)}
                </div>
                <Spacer />
                {render(tree)}
            </>
        )),
        tree
    };
});

export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<PlayerData>
): Array<GenericLayer> => [root, skyrmion, fome, entangled];

export const hasWon = computed(() => {
    return false;
});

/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
