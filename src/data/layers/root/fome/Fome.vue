<template>
    <div class="fome-grid">
        <template v-for="fomeType in Object.values(FomeTypes).slice().reverse()" :key="fomeType">
            <div v-if="Decimal.gt(unref(fome[fomeType].upgrades.reform.amount), 0)">
                <div v-html="getFomeDisplay(fomeType)" style="white-space: nowrap" />
                <div>{{ format(unref(fome[fomeType].production)) }}</div>
            </div>
            <template v-for="upgradeType in Object.keys(fome[fomeType].upgrades)">
                <component :is="render(fome[fomeType].upgrades[upgradeType as FomeDims | 'condense' | 'reform'])" />
            </template>
        </template>
    </div>
</template>

<script lang="ts">
import Decimal, { format, formatWhole } from "util/break_eternity";
import { defineComponent, unref } from "vue";
import fome, { FomeDims, FomeTypes } from "./fome";
import { render } from "util/vue";

export default defineComponent({
    setup() {
        function getFomeDisplay(fomeType: FomeTypes) {
            return `You have ${format(unref(fome[fomeType].amount))} ${
                fome[fomeType].amount.displayName
            }${
                Decimal.gt(unref(fome[fomeType].upgrades.reform.amount), 1) ? `<sup>${formatWhole(unref(fome[fomeType].upgrades.reform.amount))}</sup>` : ""
            }`;
        }
        return {
            FomeTypes,

            fome,

            getFomeDisplay,
            unref,
            format,
            render,
            Decimal
        };
    }
});
</script>

<style scoped>
.fome-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-gap: 0px;
    width: 90%;
    max-width: 1200px;
}

.fome-grid > :deep(.clickable) {
    width: 100%;
    min-height: 100px;
}

.fome-grid > :deep(.clickable.auto) {
    background-color: var(--bought);
}
</style>
