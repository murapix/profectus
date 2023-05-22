import { createBoard } from "features/boards/board";
import { jsx } from "features/feature";
import { BaseLayer, createLayer } from "game/layers";
import { render } from "util/vue";
import { types } from "../content/types";
import { FactoryNode, startNodes } from "../content/nodes";
import ResourceTab from "./ResourceTab.vue";
import BuildTab from "./BuildTab.vue";

const id = "factory";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Factory";
    const color = "#888888";

    const board = createBoard(board => ({
        startNodes,
        types,
        links() {
            const nodes = board.nodes.value.slice().sort(
                (left, right) => Math.abs(left.position.x) + Math.abs(left.position.y) - Math.abs(right.position.x) - Math.abs(right.position.y)
            ) as FactoryNode[];
            const nodeTypes = nodes.map(node => types[node.type]);
            const nodeBuildings = nodeTypes.map(type => type.building);

            const links = [];
            for (let i = 0; i < nodes.length; i++) {
                if (nodeBuildings[i] === undefined) continue;

                for (let j = i+1; j < nodes.length; j++) {
                    if (nodeBuildings[j] === undefined) continue;
                    if (nodeBuildings[i]!.transfer === undefined && nodeBuildings[j]!.transfer === undefined) continue;
                    const distance = Math.abs(nodes[i].position.x - nodes[j].position.x)
                                   + Math.abs(nodes[i].position.y - nodes[j].position.y);
                    if (nodeBuildings[i]!.transfer !== undefined && distance <= nodeBuildings[i]!.transfer!.range) {
                        links.push({
                            startNode: nodes[i],
                            endNode: nodes[j],
                            stroke: 'var(--accent1)',
                            'stroke-width': 15
                        });
                    }
                    else if (nodeBuildings[j]!.transfer !== undefined && distance <= nodeBuildings[j]!.transfer!.range) {
                        links.push({
                            startNode: nodes[j],
                            endNode: nodes[i],
                            stroke: 'var(--accent)',
                            'stroke-width': 15
                        });
                    }
                }
            }
            return links;
        },
        style: {
            height: '100%',
            overflow: "hidden"
        }
    }))

    return {
        name,
        color,
        board,
        display: jsx(() => (
            <div style={{
                '--border-thickness': '4px',
                '--text-padding': '2px',
                display: 'grid',
                gridTemplateColumns: '300px 1fr 300px',
                height: '100%'
            }}>
                <div style={{
                    height: '100%',
                    width: 'calc(100% - var(--border-thickness))',
                    borderRight: 'solid var(--border-thickness)',
                    background: 'var(--locked)'
                }}></div>
                <div style={{
                    display: 'grid',
                    gridTemplateRows: '1fr 225px',
                    height: '100%',
                    width: '100%'
                }}>
                    {render(board)}
                    <BuildTab />
                </div>
                <ResourceTab />
            </div>
        ))
    }
})

export default layer;