import { BoardNode, BoardNodeLink, createBoard } from "features/boards/board";
import { jsx } from "features/feature";
import { BaseLayer, createLayer } from "game/layers";
import { render } from "util/vue";
import { types } from "../content/types";
import { propagateDistance, placeNode, removeNode, startNodes } from "../content/nodes";
import MapTabVue from "./MapTab.vue";
import { persistent } from "game/persistence";
import { createHotkey } from "features/hotkey";
import { Ref } from "vue";

const id = "factory";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Factory";
    const color = "#888888";

    const board = createBoard(board => ({
        startNodes,
        types,
        links() {
            const links = [] as BoardNodeLink[];
            const idToNode = {} as Record<number, BoardNode>;
            for (const node of board.nodes.value) {
                idToNode[node.id] = node;
            }
            for (const node of board.nodes.value) {
                for (const connectedNode of node.connectedNodes.map(id => idToNode[id])) {
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

    this.on('preUpdate', diff => {
        // tick all recipes
    });
    this.on('update', diff => {
        // transfer resouces to waiting recipes
    });
    this.on('postUpdate', diff => {
        if (dirty.value) {
            propagateDistance(board.nodes.value, board.nodes.value[0])
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
        name,
        color,
        board,
        dirty,
        dropBuilding,
        display: jsx(() =>
            <MapTabVue>
                {render(board)}
            </MapTabVue>
        ),
        placeNode,
        removeNode
    }
})

export default layer;