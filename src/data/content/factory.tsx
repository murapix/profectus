import { createBoard } from "features/boards/board";
import { jsx } from "features/feature";
import { BaseLayer, createLayer } from "game/layers";
import { render } from "util/vue";
import { types } from "./types";
import { startNodes } from "./nodes";
import ResourceTab from "./ResourceTab.vue";

const id = "factory";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Factory";
    const color = "#888888";

    const board = createBoard(board => ({
        startNodes,
        types,
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
                '--text-padding': '4px',
                display: 'grid',
                gridTemplateColumns: '200px 1fr 200px',
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
                    gridTemplateRows: '1fr 100px',
                    height: '100%',
                    width: '100%'
                }}>
                    {render(board)}
                    <div style={{
                        height: 'calc(100% - var(--border-thickness))',
                        width: '100%',
                        borderTop: 'solid var(--border-thickness)',
                        background: 'var(--locked)'
                    }}></div>
                </div>
                <ResourceTab />
            </div>
        ))
    }
})

export default layer;