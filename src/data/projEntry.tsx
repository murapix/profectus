import { jsx } from "features/feature";
import type { BaseLayer, GenericLayer } from "game/layers";
import { createLayer } from "game/layers";
import type { Player } from "game/player";
import { render } from "util/vue";
import { Ref, computed } from "vue";
import { createBoard, BoardNodeLink, BoardNode } from "features/boards/board";
import { createHotkey } from "features/hotkey";
import { persistent } from "game/persistence";
import { tickBuild, tickRecipe, tickTransfer } from "./content/building";
import { startNodes, propagateDistance } from "./content/nodes";
import MapTabVue from "./tabs/MapTab.vue";
import { types } from "./content/types";

/**
 * @hidden
 */
export const root = createLayer("main", function (this: BaseLayer) {
    const board = createBoard(board => ({
        startNodes,
        types,
        links() {
            const links = [] as BoardNodeLink[];
            for (const node of board.nodes.value) {
                for (const connectedNode of node.connectedNodes.map(id => idToNodeMap.value[id])) {
                    if (node.distance < connectedNode.distance ||
                        (
                            node.distance === connectedNode.distance &&
                            node.id < connectedNode.id
                        )
                    ) {
                        links.push({
                            startNode: node,
                            endNode: connectedNode,
                            stroke: 'var(--accent1)',
                            strokeWidth: 5
                        })
                    }
                }
            }

            return links;
        },
        style: {
            height: '100%',
            overflow: "hidden"
        }
    }));
    const dirty = persistent<boolean>(true);
    const idToNodeMap = computed(() => {
        const map = {} as Record<number, BoardNode>;
        for (const node of board.nodes.value) {
            map[node.id] = node;
        }
        return map;
    });

    this.on('preUpdate', diff => {
        // tick all recipes
        for (const node of board.nodes.value) {
            tickRecipe(node, diff);
        }
    });
    this.on('update', diff => {
        // transfer resouces to waiting builds and recipes
        for (const node of board.nodes.value) {
            tickBuild(node, diff);
        }
        for (const node of board.nodes.value) {
            tickTransfer(node, diff);
        }
    });
    this.on('postUpdate', () => {
        if (dirty.value) {
            propagateDistance(board.nodes.value, board.nodes.value[0])
            dirty.value = false;
        }
    });

    const dropBuilding = createHotkey(() => ({
        enabled: board.draggingNode as unknown as Ref<boolean>,
        key: "Escape",
        description: "Deselect Building",
        onPress() {
            board.draggingNode.value = null;
        }
    }));

    return {
        board,
        idToNodeMap,
        dirty,
        dropBuilding,
        display: jsx(() =>
            <MapTabVue>
                {render(board)}
            </MapTabVue>
        ),

        minimizable: false
    }
});

/**
 * Given a player save data object being loaded, return a list of layers that should currently be enabled.
 * If your project does not use dynamic layers, this should just return all layers.
 */
export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<Player>
): Array<GenericLayer> => [root];

/**
 * A computed ref whose value is true whenever the game is over.
 */
export const hasWon = computed(() => {
    return false;
});

/**
 * Given a player save data object being loaded with a different version, update the save data object to match the structure of the current version.
 * @param oldVersion The version of the save being loaded in
 * @param player The save data being loaded in
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<Player>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
