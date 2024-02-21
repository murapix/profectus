<template>
    <div class="enhancementRow" v-for="(row, index) in processedRows">
        <Row v-if="row.row.some(upgrade => isVisible(upgrade.visibility))">
            <div :class="{ bought: unref(row.count) >= unref(row.limit) }">
                <span>Row {{ index+1 }}: {{ unref(row.count) }}/{{ unref(row.limit) }}</span>
            </div>
            <template v-for="upgrade in row.row">
                <template v-if="isVisible(upgrade.visibility)">
                    <component :is="render(upgrade)" />
                </template>
            </template>
        </Row>
    </div>    
</template>

<script setup lang="ts">
import { GenericUpgrade } from 'features/upgrades/upgrade';
import { render } from 'util/vue';
import { unref } from 'vue';
import entropy, { EnhancementRow } from './entropy';
import Row from 'components/layout/Row.vue';
import { isVisible } from 'features/feature';

const props = defineProps<{
    rows: Record<EnhancementRow, GenericUpgrade[]>;
}>();

const processedRows = ([1, 2, 3, 4] as EnhancementRow[]).map(row => ({
    limit: entropy.enhancementLimits[row as EnhancementRow],
    count: entropy.enhancementCounts[row as EnhancementRow],
    row: unref(props.rows)[row]
}));
</script>

<style scoped>
.enhancementRow {
    width: fit-content;
    margin: var(--feature-margin) auto;
}

.enhancementRow .row {
    margin: 0;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
}

.enhancementRow :deep(button), .row > div:first-child {
    width: 120px;
    margin: 0 -1px;

    border-radius: 0;
    border: solid var(--layer-color) 2px;

    background: #0000002F;
    color: var(--layer-color);
    z-index: 2;
}

.enhancementRow :deep(button.locked) {
    border-color: var(--locked);
    color: var(--locked);
    z-index: -1;
}

.enhancementRow :deep(button.bought), .enhancementRow .row > div.bought {
    border-color: var(--bought);
    color: var(--bought);
    z-index: 1;
}

.enhancementRow :deep(button:hover:not(.locked):not(.bought)) {
    transform: none;
    box-shadow: inset 0 0 20px var(--layer-color);
}

.enhancementRow .row > div:first-child {
    background: linear-gradient(to left, #0000002F, #0000);
    border-left: 0;
}
.enhancementRow :deep(.tooltip-container:last-child button) {
    background: linear-gradient(to right, #0000002F, #0000);
    border-right: 0;
}
</style>