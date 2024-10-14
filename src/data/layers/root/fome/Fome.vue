<template>
    <div class="fome-grid">
        <template v-for="fomeType in Object.values(FomeTypes).slice().reverse()" :key="fomeType">
            <div v-if="unref(acceleron.unlocked) || unref(inflaton.unlocked) || unref(entangled.unlocked) || Decimal.gt(unref(fome[fomeType].upgrades.reform.amount), 0)">
                <div v-html="getFomeDisplay(fomeType)" style="white-space: nowrap" />
                <div>+{{ format(unref(fome[fomeType].production)) }}/s<component :is="render(fome[fomeType].modifierModal)" /></div>
            </div>
            <template v-for="upgradeType in Object.keys(fome[fomeType].upgrades)">
                <component :is="render(fome[fomeType].upgrades[upgradeType as FomeDims | 'condense' | 'reform'])" />
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
import Decimal, { format, formatWhole } from "util/break_eternity";
import { render } from "util/vue";
import { unref } from "vue";
import acceleron from "../acceleron/acceleron";
import entangled from "../entangled/entangled";
import inflaton from "../inflaton/inflaton";
import fome, { FomeDims, FomeTypes } from "./fome";

function getFomeDisplay(fomeType: FomeTypes) {
    return `You have ${format(unref(fome[fomeType].amount))} ${
        unref(fome[fomeType].amount.displayName)
    }${
        Decimal.gt(unref(fome[fomeType].upgrades.reform.amount), 1) ? `<sup>${formatWhole(unref(fome[fomeType].upgrades.reform.amount))}</sup>` : ""
    }`;
}
</script>

<style scoped>
.fome-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-gap: 0px;
    width: 90%;
    max-width: 1200px;
}

.fome-grid > div {
    padding: 5px;
}

.fome-grid > :deep(.clickable), .fome-grid > :deep(.upgrade) {
    width: 100%;
    min-height: 100px;
}

.fome-grid > :deep(.clickable.auto), .fome-grid > :deep(.upgrade.auto) {
    background-color: var(--bought);
}
</style>
