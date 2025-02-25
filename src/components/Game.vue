<template>
    <div class="tabs-container" :class="{ useHeader }">
        <div
            v-for="(tab, index) in tabs"
            :key="index"
            class="tab"
            :style="unref(layers[tab]?.style)"
            :class="unref(layers[tab]?.classes)"
        >
            <Nav v-if="index === 0 && !useHeader" />
            <div class="inner-tab">
                <LayerVue
                    v-if="layerKeys.includes(tab)"
                    v-bind="gatherLayerProps(layers[tab])"
                    :index="index"
                    @set-minimized="(value: boolean) => (layers[tab]!.minimized.value = value)"
                />
                <component :is="tab" :index="index" v-else />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import projInfo from "data/projInfo.json";
import { type Layer, layers } from "game/layers";
import player from "game/player";
import { computed, toRef, unref } from "vue";
import LayerVue from "./Layer.vue";
import Nav from "./Nav.vue";

const tabs = toRef(player, "tabs");
const layerKeys = computed(() => Object.keys(layers));
const useHeader = projInfo.useHeader;

function gatherLayerProps(layer: Layer) {
    const {
        display,
        name,
        color,
        minimizable,
        minimizedDisplay,
        minimized,
        nodes,
        forceHideGoBack 
     } = layer;
    return {
        display,
        name,
        color,
        minimizable,
        minimizedDisplay,
        minimized,
        nodes,
        forceHideGoBack
    };
}
</script>

<style scoped>
.tabs-container {
    width: 100vw;
    flex-grow: 1;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
}

.tabs-container:not(.useHeader) {
    width: calc(100vw - 50px);
    margin-left: 50px;
}

.tab {
    position: relative;
    height: 100%;
    flex-grow: 1;
    transition-duration: 0s;
    overflow-y: auto;
    overflow-x: hidden;
}

.inner-tab {
    padding: 50px 10px;
    min-height: calc(100% - 100px);
    display: flex;
    flex-direction: column;
    margin: 0;
    flex-grow: 1;
}

.tab + .tab > .inner-tab {
    border-left: solid 4px var(--outline);
}
</style>

<style>
.tab hr {
    height: 4px;
    border: none;
    background: var(--outline);
    margin: var(--feature-margin) 0;
}

.tab .modal-body hr {
    margin: 7px 0;
}
</style>
