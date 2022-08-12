import { jsx, showIf, Visibility } from "features/feature";
import { createTab } from "features/tabs/tab";
import { GenericTabFamily, createTabFamily } from "features/tabs/tabFamily";
import type { GenericLayer } from "game/layers";
import { createLayer } from "game/layers";
import type { PlayerData } from "game/player";
import player from "game/player";
import { format } from "util/bignum";
import { render } from "util/vue";
import { computed, Ref, unref } from "vue";
import acceleron from "./layers/root/acceleron/acceleron";
import entropy from "./layers/root/acceleron/entropy";
import entangled from "./layers/root/entangled/entangled";
import fome from "./layers/root/fome/fome";
import skyrmion from "./layers/root/skyrmion/skyrmion";
import timecube from "./layers/root/timecube/timecube";

/**
 * @hidden
 */
const id = "root";
export const root = createLayer(id, () => {
    type layer = GenericLayer & { unlocked?: Ref<boolean>, boughtColor?: string }
    const layers: {[key: number]: layer} = Object.fromEntries([skyrmion, fome, acceleron, timecube, /*inflaton,*/ entangled].map((layer, index) => [index, layer]));
    const subLayers: {[key: number]: layer} = Object.fromEntries([entropy].map((layer, index) => [index, layer]));
    const tabs: GenericTabFamily = createTabFamily(Object.fromEntries(Object.values(layers).map(layer => 
        [layer.name, () => ({
            display: layer.name,
            tab: createTab(() => ({
                style: computed(() => ({
                    "--layer-color": unref(layer.color),
                    ...(unref(layer.style) as Record<string, unknown>)
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
        name: "Root",
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
        tabs,
        layers,
        subLayers
    };
});

/**
 * Given a player save data object being loaded, return a list of layers that should currently be enabled.
 * If your project does not use dynamic layers, this should just return all layers.
 */
export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<PlayerData>
): Array<GenericLayer> => [root, ...Object.values(root.layers), ...Object.values(root.subLayers)];

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
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
