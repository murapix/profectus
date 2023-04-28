import { jsx } from "features/feature";
import { createTab } from "features/tabs/tab";
import { GenericTabFamily, createTabFamily } from "features/tabs/tabFamily";
import type { GenericLayer } from "game/layers";
import { createLayer } from "game/layers";
import type { Player } from "game/player";
import player from "game/player";
import { format } from "util/bignum";
import { render } from "util/vue";

import { computed, Ref, unref } from "vue";

import skyrmion from "./layers/root/skyrmion/skyrmion";
import fome from "./layers/root/fome/fome";
import acceleron from "./layers/root/acceleron-old/acceleron";
import entropy from "./layers/root/acceleron-old/entropy";
import timecube from "./layers/root/timecube-old/timecube";
import inflaton from "./layers/root/inflaton-old/inflaton";
import entangled from "./layers/root/entangled-old/entangled";

/**
 * @hidden
 */
const id = "root";
type layer = GenericLayer & { unlocked?: Ref<boolean>, boughtColor?: string }
const rootLayers: Record<number, layer> = Object.fromEntries([skyrmion, fome, acceleron, timecube, inflaton, entangled].map((layer, index) => [index, layer]));
const rootSubLayers: Record<number, layer> = Object.fromEntries([entropy].map((layer, index) => [index, layer]));
    
export const root = createLayer(id, () => {
    const tabs: GenericTabFamily = createTabFamily(Object.fromEntries(Object.values(rootLayers).map(layer => 
        [layer.name, () => ({
            display: layer.name,
            tab: createTab(() => ({
                style() {
                    return {
                        "--layer-color": unref(layer.color),
                        ...(unref(layer.style) as Record<string, unknown>)
                    }
                },
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
            visibility: 'unlocked' in layer ? () => unref(layer.unlocked ?? true) : true
        })]
    )));

    return {
        name: "Root",
        minWidth: 300,
        minimizable: false,
        display: jsx(() => unref(fome.unlocked)
            ? <>{render(tabs)}</>
            : <div style={{"--layer-color": unref(skyrmion.color)}}>{render(unref(tabs.tabs[skyrmion.name].tab))}</div>
        ),
        tabs
    };
});

/**
 * Given a player save data object being loaded, return a list of layers that should currently be enabled.
 * If your project does not use dynamic layers, this should just return all layers.
 */
export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<Player>
): Array<GenericLayer> => [...Object.values(rootLayers), ...Object.values(rootSubLayers), root];

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
