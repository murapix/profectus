<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <div class="header">
                <h2>Settings</h2>
                <div class="option-tabs">
                    <button :class="{selected: isTab('behaviour')}" @click="setTab('behaviour')">Behaviour</button>
                    <button :class="{selected: isTab('appearance')}" @click="setTab('appearance')">Appearance</button>
                </div>
            </div>
        </template>
        <template v-slot:body>
            <div v-if="isTab('behaviour')">
                <Toggle :title="unthrottledTitle" v-model="unthrottled" />
                <Toggle v-if="projInfo.enablePausing" :title="isPausedTitle" v-model="isPaused" />
                <Toggle :title="showHealthWarningTitle" v-model="showHealthWarning" v-if="!projInfo.disableHealthWarning" />
                <Toggle :title="autosaveTitle" v-model="autosave" />
                <FeedbackButton v-if="!autosave" class="button save-button" @click="save()">Manually save</FeedbackButton>
            </div>
            <div v-if="isTab('appearance')">
                <Select :title="notationTitle" :options="notations" v-model="numberFormat" />
                <Select v-if="numberFormat === Notations.standard" :title="backupNotationTitle" :options="backupNotations" v-model="backupNumberFormat" />
                <SettingFields />
                <Toggle :title="showNextValuesTitle" v-model="showNextValues" />
                <Toggle :title="showTPSTitle" v-model="showTPS" />
                <Toggle :title="alignModifierUnitsTitle" v-model="alignUnits" />
            </div>
        </template>
    </Modal>
</template>

<script setup lang="tsx">
import projInfo from "data/projInfo.json";
import rawThemes from "data/themes";
import player from "game/player";
import settings, { settingFields } from "game/settings";
import { camelToTitle, Direction } from "util/common";
import { save } from "util/save";
import { render } from "util/vue";
import { computed, ref, toRefs } from "vue";
import Tooltip from "wrappers/tooltips/Tooltip.vue";
import FeedbackButton from "../fields/FeedbackButton.vue";
import Select from "../fields/Select.vue";
import Toggle from "../fields/Toggle.vue";
import Modal from "./Modal.vue";
import { Notations } from "util/notation";

const isOpen = ref(false);
const currentTab = ref("behaviour");

function isTab(tab: string): boolean {
    return tab == currentTab.value;
}

function setTab(tab: string) {
    currentTab.value = tab;
}

defineExpose({
    isTab,
    setTab,
    save,
    open() {
        isOpen.value = true;
    }
});

const notations = [
    { label: "Standard", value: Notations.standard },
    { label: "Thousands", value: Notations.thousands },
    { label: "Engineering", value: Notations.engineering },
    { label: "Scientific", value: Notations.scientific }
];
const backupNotations = notations.filter(notation => notation.value !== Notations.standard);

const SettingFields = () => settingFields.map(f => render(f));

const { showTPS, unthrottled, alignUnits, numberFormat, backupNumberFormat, showNextValues, showHealthWarning } = toRefs(settings);
const { autosave } = toRefs(player);
const isPaused = computed({
    get() {
        return settings.devSpeed === 0;
    },
    set(value: boolean) {
        settings.devSpeed = value ? 0 : null;
    }
});

const unthrottledTitle = <span class="option-title">
    Unthrottled
    <desc>Allow the game to run as fast as possible. Not battery friendly.</desc>
</span>;
const showHealthWarningTitle = <span class="option-title">
    Show videogame addiction warning
    <desc>Show a helpful warning after playing for a long time about video game addiction and encouraging you to take a break.</desc>
</span>;
const autosaveTitle = <span class="option-title">
    Autosave<Tooltip display="Save-specific" direction={Direction.Right}>*</Tooltip>
    <desc>Automatically save the game every second or when the game is closed.</desc>
</span>;
const isPausedTitle = <span class="option-title">
    Pause game<Tooltip display="Save-specific" direction={Direction.Right}>*</Tooltip>
    <desc>Stop everything from moving.</desc>
</span>;
const showTPSTitle = <span class="option-title">
    Show TPS
    <desc>Show TPS meter at the bottom-left corner of the page.</desc>
</span>;
const alignModifierUnitsTitle = <span class="option-title">
    Align modifier units
    <desc>Align numbers to the beginning of the unit in modifier view.</desc>
</span>;
const notationTitle = <span class="option-title">
    Number Notation
    <desc>Change how numbers are formatted for display.</desc>
</span>;
const backupNotationTitle = <span class="option-title">
    Backup Number Notation
    <desc>Change how numbers are formatted beyond the limit of Standard Notation</desc>
</span>;
const showNextValuesTitle = <span class="option-title">
    Show Next Values
    <desc>Display both the current and next values of the hovered feature, where possible.</desc>
</span>;

</script>

<style>
.option-tabs {
    border-bottom: 2px solid var(--outline);
    margin-top: 10px;
    margin-bottom: -10px;
}

.option-tabs button {
    background-color: transparent;
    color: var(--foreground);
    margin-bottom: -2px;
    font-size: 14px;
    cursor: pointer;
    padding: 5px 20px;
    border: none;
    border-bottom: 2px solid var(--foreground);
}

.option-tabs button:not(.selected) {
    border-bottom-color: transparent;
}

.option-title .tooltip-container {
    display: inline;
    margin-left: 5px;
}
.option-title desc {
    display: block;
    opacity: 0.6;
    font-size: small;
    width: 300px;
    margin-left: 0;
}

.save-button {
    text-align: right;
}
</style>
