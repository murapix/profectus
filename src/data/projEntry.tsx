import { jsx, showIf, Visibility } from "features/feature";
import { createTab } from "features/tabs/tab";
import { createTabFamily, GenericTabFamily } from "features/tabs/tabFamily";
import { createTree, defaultResetPropagation, GenericTree } from "features/trees/tree";
import { createLayer, GenericLayer } from "game/layers";
import player, { PlayerData } from "game/player";
import { format } from "util/bignum";
import { render } from "util/vue";
import { computed, Ref, unref } from "vue";
import acceleron from "./layers/root/acceleron/acceleron";
import entangled from "./layers/root/entangled/entangled";
import fome from "./layers/root/fome/fome";
import skyrmion from "./layers/root/skyrmion/skyrmion";

/**
 * @hidden
 */
const id = "root";
export const root = createLayer(id, () => {
    const tree = createTree(() => ({
        nodes: [[skyrmion.treeNode], [fome.treeNode], [acceleron.treeNode], [entangled.treeNode]],
        onReset() { /* no-op */ },
        resetPropagation: defaultResetPropagation
    })) as GenericTree;

    type layer = GenericLayer & { unlocked?: Ref<boolean> }
    const layers: layer[] = [skyrmion, fome, acceleron, /*timecube,*/ /*inflaton,*/ entangled];

    const tabs: GenericTabFamily = createTabFamily(Object.fromEntries(layers.map(layer => 
        [layer.name, () => ({
            display: layer.name,
            tab: createTab(() => ({
                style: computed(() => ({
                    "--layer-color": unref(layer.color)
                })),
                display: jsx(() => (
                    <>
                        <div>
                            {player.devSpeed === 0 ? <div>Game Paused</div> : null}
                            {player.devSpeed && player.devSpeed !== 1 ? <div>Dev Speed: {format(player.devSpeed)}x</div> : null}
                            {render(unref(layer.display))}
                        </div>
                    </>
                ))
            })),
            visibility: 'unlocked' in layer ? () => showIf(unref(layer.unlocked ?? true)) : Visibility.Visible
        })]
    )));

    return {
        name: "Tree",
        links: tree.links,
        minWidth: 300,
        minimizable: false,
        display: jsx(() => (
            <>
                {unref(fome.unlocked)
                    ? render(tabs)
                    : <div style={{"--layer-color": unref(skyrmion.color)}}>
                        {render(unref(tabs.tabs[skyrmion.name].tab))}
                    </div>
                }
            </>
        )),
        tree,
        tabs
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
