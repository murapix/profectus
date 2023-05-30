import { jsx } from "features/feature";
import type { BaseLayer, GenericLayer } from "game/layers";
import { createLayer } from "game/layers";
import type { Player } from "game/player";
import { coerceComponent, render } from "util/vue";
import { Ref, computed, unref } from "vue";
import { createBoard, BoardNodeLink, BoardNode } from "features/boards/board";
import { createHotkey } from "features/hotkey";
import { persistent } from "game/persistence";
import { normalizeStorage, tickBuild, tickRecipe, tickResearch, tickTransfer, tickWeapons } from "./content/building";
import { startNodes, propagateDistance, transferRouteUsage } from "./content/nodes";
import MapTabVue from "./tabs/MapTab.vue";
import { types } from "./content/types";
import { GenericResearch, createResearch } from "./content/research";
import { Resources } from "./content/resources";
import { useToast } from "vue-toastification";

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
                for (const connectedNode of node.connectedNodes.map(id => idToNodeMap.value[id]).filter(node => node !== undefined)) {
                    if (node.distance < connectedNode.distance ||
                        (
                            node.distance === connectedNode.distance &&
                            node.id < connectedNode.id
                        )
                    ) {
                        links.unshift({
                            startNode: node,
                            endNode: connectedNode,
                            stroke: 'var(--accent1)',
                            strokeWidth: 5
                        });
                        if (node.id in transferRouteUsage.value) {
                            if (connectedNode.id in transferRouteUsage.value[node.id]) {
                                links.push({
                                    startNode: node,
                                    endNode: connectedNode,
                                    stroke: 'var(--foreground)',
                                    strokeWidth: transferRouteUsage.value[node.id][connectedNode.id]
                                });
                            }
                        }
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
        const research = Object.values(root.research).find(research => research.id === root.activeResearch.value);
        if (research !== undefined) {
            for (const node of board.nodes.value) {
                tickResearch(research, node, diff);
            }
            if (research.researched.value) {
                activeResearch.value = "none";
                useToast().info(
                    <div>
                        <h3>Research Complete!</h3>
                        <div>
                            <div style={'color: var(--feature-foreground)'}>{coerceComponent(unref(research.display).title)}</div>
                        </div>
                    </div>
                );
            }
        }
    });
    this.on('update', diff => {
        // transfer resouces to waiting builds and recipes
        for (const node of board.nodes.value) {
            tickBuild(node, diff);
        }
        for (const node of board.nodes.value) {
            tickWeapons(node, diff);
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
        normalizeStorage();
    });

    const dropBuilding = createHotkey(() => ({
        enabled: board.draggingNode as unknown as Ref<boolean>,
        key: "Escape",
        description: "Deselect Building",
        onPress() {
            board.draggingNode.value = null;
        }
    }));

    const research: Record<string, GenericResearch> = {
        bore: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50,
                [Resources.LogisticalResearch]: 15
            },
            display: {
                title: "Nanite Bore",
                description: "Unlock a more permanent form of scrap generation"
            }
        })),
        naniteSmelting: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 100,
                [Resources.LogisticalResearch]: 25
            },
            display: {
                title: "Nanite Forge",
                description: "Allow Foundries to turn Scrap into Nanites"
            }
        })),
        circuits: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50,
                [Resources.LogisticalResearch]: 100,
                [Resources.BalisticsResearch]: 15
            },
            display: {
                title: "Dedicated Circuitry",
                description: "The first step towards more powerful and performant nodes"
            }
        })),
        transferSpeed: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25,
                [Resources.LogisticalResearch]: 50
            },
            display: {
                title: "Improved Logistics I",
                description: "Increase the transfer rate of resources to 2/s"
            }
        })),
        transferSpeed2: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3,
                [Resources.LogisticalResearch]: 50*3
            },
            display: {
                title: "Improved Logistics II",
                description: "Increase the transfer rate of resources to 3/s"
            },
            visibility: research.transferSpeed.researched
        })),
        transferSpeed3: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3**2,
                [Resources.LogisticalResearch]: 50*3**2
            },
            display: {
                title: "Improved Logistics III",
                description: "Increase the transfer rate of resources to 5/s"
            },
            visibility: research.transferSpeed2.researched
        })),
        transferSpeed4: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3**3,
                [Resources.LogisticalResearch]: 50*3**3
            },
            display: {
                title: "Improved Logistics IV",
                description: "Increase the transfer rate of resources to 8/s"
            },
            visibility: research.transferSpeed3.researched
        })),
        transferSpeed5: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3**4,
                [Resources.LogisticalResearch]: 50*3**4
            },
            display: {
                title: "Improved Logistics V",
                description: "Increase the transfer rate of resources to 13/s"
            },
            visibility: research.transferSpeed4.researched
        })),
        transferSpeed6: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3**5,
                [Resources.LogisticalResearch]: 50*3**5
            },
            display: {
                title: "Improved Logistics VI",
                description: "Increase the transfer rate of resources to 21/s"
            },
            visibility: research.transferSpeed5.researched
        })),
        transferSpeed7: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3**6,
                [Resources.LogisticalResearch]: 50*3**6
            },
            display: {
                title: "Improved Logistics VII",
                description: "Increase the transfer rate of resources to 34/s"
            },
            visibility: research.transferSpeed6.researched
        })),
        transferSpeed8: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3**7,
                [Resources.LogisticalResearch]: 50*3**7
            },
            display: {
                title: "Improved Logistics VIII",
                description: "Increase the transfer rate of resources to 55/s"
            },
            visibility: research.transferSpeed7.researched
        })),
        transferSpeed9: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3**8,
                [Resources.LogisticalResearch]: 50*3**8
            },
            display: {
                title: "Improved Logistics IX",
                description: "Increase the transfer rate of resources to 89/s"
            },
            visibility: research.transferSpeed8.researched
        })),
        transferSpeed10: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 25*3**9,
                [Resources.LogisticalResearch]: 50*3**9
            },
            display: {
                title: "Improved Logistics X",
                description: "Increase the transfer rate of resources to 144/s"
            },
            visibility: research.transferSpeed9.researched
        })),
        buildSpeed: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50,
                [Resources.LogisticalResearch]: 25
            },
            display: {
                title: "Improved Construction I",
                description: "Increase the construction rate of structures to 2/s"
            }
        })),
        buildSpeed2: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3,
                [Resources.LogisticalResearch]: 25*3
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 3/s"
            },
            visibility: research.buildSpeed.researched
        })),
        buildSpeed3: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3**2,
                [Resources.LogisticalResearch]: 25*3**2
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 5/s"
            },
            visibility: research.buildSpeed2.researched
        })),
        buildSpeed4: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3**3,
                [Resources.LogisticalResearch]: 25*3**3
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 8/s"
            },
            visibility: research.buildSpeed3.researched
        })),
        buildSpeed5: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3**4,
                [Resources.LogisticalResearch]: 25*3**4
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 13/s"
            },
            visibility: research.buildSpeed4.researched
        })),
        buildSpeed6: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3**5,
                [Resources.LogisticalResearch]: 25*3**5
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 21/s"
            },
            visibility: research.buildSpeed5.researched
        })),
        buildSpeed7: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3**6,
                [Resources.LogisticalResearch]: 25*3**6
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 34/s"
            },
            visibility: research.buildSpeed6.researched
        })),
        buildSpeed8: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3**7,
                [Resources.LogisticalResearch]: 25*3**7
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 55/s"
            },
            visibility: research.buildSpeed7.researched
        })),
        buildSpeed9: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3**8,
                [Resources.LogisticalResearch]: 25*3**8
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 89/s"
            },
            visibility: research.buildSpeed8.researched
        })),
        buildSpeed10: createResearch(() => ({
            resources: {
                [Resources.ConsumptionResearch]: 50*3**9,
                [Resources.LogisticalResearch]: 25*3**9
            },
            display: {
                title: "Improved Construction II",
                description: "Increase the construction rate of structures to 144/s"
            },
            visibility: research.buildSpeed9.researched
        })),
    };
    const activeResearch = persistent<string>("none", false);

    return {
        board,
        idToNodeMap,
        dirty,
        research,
        activeResearch,

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
