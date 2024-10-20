<template>
    <div class="preset-tab">
        Enhancement Presets
        <Row class="new-preset-area">
            <Text
                :autofocus="false"
                :model-value="newName"
                @update:modelValue="(value: string) => { newName = value; tryImport = tryImportPreset(value) }"
                placeholder="New Preset Name"
            />
            <button
                @click="createPreset"
                class="button"
                :class="{ locked: newName.length === 0 }"
            >Save</button>
            <button
                @click="importPreset"
                class="button"
                :class="{ locked: tryImport === false }"
            >Import</button>
        </Row>
        <Spacer />
        <div class="preset-area">
            <div class="presets">
                <template v-for="preset of presets">
                    <Preset
                        :rows="enhancements"
                        :preset="preset"
                        @export="exportPreset(preset)"
                        @load="loadPreset(preset)"
                        @delete="deletePreset(preset)"
                        @rename="(name: string) => renamePreset(preset, name)"
                        @reassign="reassignPreset(preset)"
                    />
                </template>
            </div>
            <div class="fade" />
        </div>
    </div>
</template>

<script setup lang="tsx">
import Text from 'components/fields/Text.vue';
import Row from 'components/layout/Row.vue';
import Spacer from 'components/layout/Spacer.vue';
import { GenericUpgrade } from 'features/upgrades/upgrade';
import { ComputedRef, ref, unref } from 'vue';
import Preset from '../acceleron/Preset.vue';
import entropy from './entropy';

type PresetType = {
    id: number;
    name: string;
    purchased: string[];
}

const props = defineProps<{
    enhancements: Record<number, GenericUpgrade[]>;
    presets: PresetType[],
    nextID: ComputedRef<number>
}>();

const newName = ref("");
const tryImport = ref<false | Omit<PresetType, 'id'>>(false);

function createPreset() {
    props.presets.push({
        id: unref(props.nextID),
        name: newName.value,
        purchased: Object.values(props.enhancements)
                         .flatMap(row => row)
                         .filter(upgrade => unref(upgrade.bought))
                         .map(upgrade => upgrade.id)
    });
    newName.value = "";
    tryImport.value = false;
}

function reassignPreset(toReassign: PresetType) {
    toReassign.purchased = Object.values(props.enhancements)
                                 .flatMap(row => row)
                                 .filter(upgrade => unref(upgrade.bought))
                                 .map(upgrade => upgrade.id)
}

function exportPreset(toExport: PresetType) {
    const json = JSON.stringify({ name: toExport.name, purchased: toExport.purchased })
    const base64 = btoa(unescape(encodeURIComponent(json)));

    const element = document.createElement("textarea");
    element.value = base64;
    document.body.appendChild(element);
    element.select();
    element.setSelectionRange(0, 99999);
    document.execCommand("copy");
    document.body.removeChild(element);
}

function tryImportPreset(base64: string) {
    try {
        const json = decodeURIComponent(escape(atob(base64)));
        const preset = JSON.parse(json);

        if (typeof preset !== "object") return false;
        if (!('name' in preset)) return false;
        if (typeof preset.name !== "string") return false;
        if (!('purchased' in preset)) return false;
        if (typeof preset.purchased !== "object") return false;
        for (const [key, value] of Object.entries(preset.purchased)) {
            if (isNaN(key as unknown as number)) return false;
            if (!isFinite(key as unknown as number)) return false;
            if (key as unknown as number < 0) return false;
            if (typeof value !== "string") return false;
        }

        return {
            name: preset.name,
            purchased: preset.purchased
        };
    }
    catch (e) {
        return false;
    }
}

function importPreset() {
    const tryPreset = unref(tryImport);
    if (tryPreset === false) return;
    props.presets.push({
        id: unref(props.nextID),
        ...tryPreset
    });
    newName.value = "";
    tryImport.value = false;
}

function loadPreset(toLoad: PresetType) {
    const enhancements = Object.values(props.enhancements).flatMap(row => row);
    for (const enhancement of enhancements) { enhancement.bought.value = false; }
    entropy.entropy.value = unref(entropy.maxEntropy);
    for (const id of toLoad.purchased) {
        enhancements.find(enhancement => enhancement.id === id)?.purchase();
    }
}

function deletePreset(toDelete: PresetType) {
    const index = props.presets.map(preset => preset.id).indexOf(toDelete.id);
    if (index >= 0) props.presets.splice(index, 1);
}

function renamePreset(toRename: PresetType, newName: string) {
    toRename.name = newName;
}
</script>

<style scoped>
.preset-tab {
    display: block;
    --scrollbar-width: 10px;
}

.preset-area {
    position: relative;
    z-index: 0;
}

.presets {
    overflow-x: clip;
    overflow-y: auto;
    max-height: 350px;
    width: 365px;
    position: relative;
    margin: 0;
    padding: 30px 0;
}

.fade::after {
    content: "";
    z-index: 1;
    pointer-events: none;
    background-image: linear-gradient(to bottom, var(--background), var(--transparent) 30px, var(--transparent) calc(100% - 30px), var(--background));
    width: calc(100% - var(--scrollbar-width));
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
}

.preset-area::-webkit-scrollbar {
    width: var(--scrollbar-width);
    z-index: 2;
}

.preset-area::-webkit-scrollbar-track {
    border: solid var(--bought) 2px;
    background: var(--background);
}

.preset-area::-webkit-scrollbar-thumb {
    background: var(--bought);
    z-index: 2;
}

:deep(.tooltip) {
    min-width: max-content;
}

button.locked {
    pointer-events: none;
    color: var(--locked);
}

.new-preset-area > :deep(.row) {
    align-items: center;
}

.new-preset-area :deep(form) {
    display: contents;
}
</style>