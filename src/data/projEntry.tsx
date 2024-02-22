import { isVisible, jsx, StyleValue } from "features/feature";
import { createTab, GenericTab } from "features/tabs/tab";
import { GenericTabFamily, createTabFamily } from "features/tabs/tabFamily";
import { GenericLayer, layers } from "game/layers";
import { createLayer } from "game/layers";
import type { Player } from "game/player";
import player from "game/player";
import { format } from "util/bignum";
import { render } from "util/vue";

import { computed, Ref, unref } from "vue";

import skyrmion from "./layers/root/skyrmion/skyrmion";
import fome from "./layers/root/fome/fome";
import acceleron from "./layers/root/acceleron/acceleron";
import timecube from "./layers/root/timecube/timecube";
import inflaton from "./layers/root/inflaton/inflaton";
import entangled from "./layers/root/entangled/entangled";
import { createHotkey } from "features/hotkey";
import abyss from "./layers/root/skyrmion/abyss";

/**
 * @hidden
 */
const id = "root";
type layer = GenericLayer & { unlocked?: Ref<boolean> }
const rootLayers = [skyrmion, fome, acceleron, timecube, inflaton, entangled] as layer[];
    
export const root = createLayer(id, () => {
    const tabs: GenericTabFamily = createTabFamily(Object.fromEntries(rootLayers.map(layer => 
        [layer.name, () => ({
            display: layer.name,
            tab: createTab(() => ({
                style: computed(() => ((unref(abyss.challenge.active) ? abyss.theme : layer.theme) ?? {}) as StyleValue),
                display: jsx(() => (<><div>{render(unref(layer.display))}</div></>))
            })),
            visibility: 'unlocked' in layer ? () => unref(layer.unlocked ?? true) : true
        })]
    )));

    const hotkeys = {
        left: createHotkey(() => ({
            key: "ArrowLeft",
            description: "Previous Tab",
            onPress() {
                const currentTab = tabs.selected.value;
                if (currentTab === undefined) return;

                const availableTabs = Object.entries(tabs.tabs).filter(([_, tab]) => isVisible(tab.visibility)).map(([id, _]) => id);
                if (availableTabs.length <= 0) return;

                const index = availableTabs.indexOf(currentTab);
                switch (index) {
                    case -1: break;
                    case 0: tabs.selected.value = availableTabs.at(-1)!; break;
                    default: tabs.selected.value = availableTabs[index-1]; break;
                }
            }
        })),
        right: createHotkey(() => ({
            key: "ArrowRight",
            description: "Next Tab",
            onPress() {
                const currentTab = tabs.selected.value;
                if (currentTab === undefined) return;

                const availableTabs = Object.entries(tabs.tabs).filter(([_, tab]) => isVisible(tab.visibility)).map(([id, _]) => id);
                if (availableTabs.length <= 0) return;

                const index = availableTabs.indexOf(currentTab);
                switch (index) {
                    case -1: break;
                    case availableTabs.length-1: tabs.selected.value = availableTabs[0]; break;
                    default: tabs.selected.value = availableTabs[index+1]; break;
                }
            }
        })),
        shiftLeft: createHotkey(() => ({
            key: "shift+ArrowLeft",
            description: "Previous Subtab",
            onPress() {
                const currentTab = tabs.selected.value;
                if (currentTab === undefined) return;
                
                const currentLayer = rootLayers.find(layer => layer.name === currentTab);
                if (currentLayer === undefined) return;
                if (!('tabs' in currentLayer)) return;
                
                const subtabs = currentLayer.tabs as GenericTabFamily;
                const currentSubtab = subtabs.selected.value;
                if (currentSubtab === undefined) return;

                const availableSubtabs = Object.entries(subtabs.tabs).filter(([_, tab]) => isVisible(tab.visibility)).map(([id, _]) => id);
                if (availableSubtabs.length <= 0) return;

                const index = availableSubtabs.indexOf(currentSubtab);
                switch (index) {
                    case -1: break;
                    case 0: subtabs.selected.value = availableSubtabs.at(-1)!; break;
                    default: subtabs.selected.value = availableSubtabs[index-1]; break;
                }
            }
        })),
        shiftRight: createHotkey(() => ({
            key: "shift+ArrowRight",
            description: "Next Subtab",
            onPress() {
                const currentTab = tabs.selected.value;
                if (currentTab === undefined) return;
                
                const currentLayer = rootLayers.find(layer => layer.name === currentTab);
                if (currentLayer === undefined) return;
                if (!('tabs' in currentLayer)) return;
                
                const subtabs = currentLayer.tabs as GenericTabFamily;
                const currentSubtab = subtabs.selected.value;
                if (currentSubtab === undefined) return;

                const availableSubtabs = Object.entries(subtabs.tabs).filter(([_, tab]) => isVisible(tab.visibility)).map(([id, _]) => id);
                if (availableSubtabs.length <= 0) return;

                const index = availableSubtabs.indexOf(currentSubtab);
                switch (index) {
                    case -1: break;
                    case availableSubtabs.length-1: subtabs.selected.value = availableSubtabs[0]; break;
                    default: subtabs.selected.value = availableSubtabs[index+1]; break;
                }
            }
        })),
        pause: createHotkey(() => ({
            key: "p",
            description: "Pause",
            onPress() {
                if (player.devSpeed === 0) player.devSpeed = null;
                else player.devSpeed = 0;
            }
        }))
    }

    return {
        name: "Root",
        minWidth: 300,
        display: jsx(() => unref(fome.unlocked)
            ? <>{render(tabs)}</>
            : <div style={skyrmion.theme as StyleValue}>{render(unref(tabs.tabs[skyrmion.name].tab))}</div>
        ),
        hotkeys,
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
): Array<GenericLayer> => [...Object.values(rootLayers), root];

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
