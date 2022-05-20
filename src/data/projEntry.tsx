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
import skyrmion from "./layers/root/skyrmion";

/**
 * @hidden
 */
const id = "root";
export const root = createLayer(id, () => {
    const tree = createTree(() => ({
        nodes: [[skyrmion.treeNode], [fome.treeNode], [entangled.treeNode]],
        branches: [{ startNode: fome.treeNode, endNode: skyrmion.treeNode }],
        onReset() {
            // no-op
        },
        resetPropagation: defaultResetPropagation
    })) as GenericTree;

    return {
        name: "Tree",
        links: tree.links,
        minWidth: 300,
        display: jsx(() => (
            <>
                {player.devSpeed === 0 ? <div>Game Paused</div> : null}
                {player.devSpeed && player.devSpeed !== 1 ? (
                    <div>Dev Speed: {format(player.devSpeed)}x</div>
                ) : null}
                {player.offlineTime ? (
                    <div>Offline Time: {formatTime(player.offlineTime)}</div>
                ) : null}
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
