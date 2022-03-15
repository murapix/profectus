import Spacer from "components/layout/Spacer.vue";
import { jsx } from "features/feature";
import { createTree, defaultResetPropagation, GenericTree } from "features/trees/tree";
import { createLayer, GenericLayer } from "game/layers";
import player, { PlayerData } from "game/player";
import { format, formatTime } from "util/bignum";
import { render } from "util/vue";
import { computed, toRaw } from "vue";
import entangled from "./layers/entangled";
import skyrmion from "./layers/skyrmion";

export const main = createLayer(() => {
    const tree = createTree(() => ({
        nodes: [[skyrmion.treeNode], [entangled.treeNode]],
        branches: [],
        onReset() {
            toRaw(this.resettingNode.value) === toRaw(skyrmion.treeNode) ? 0 : 10;
        },
        resetPropagation: defaultResetPropagation
    })) as GenericTree;

    return {
        id: "main",
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
): Array<GenericLayer> => [main, skyrmion, entangled];

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
