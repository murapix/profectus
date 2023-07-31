<template>
    <div class="enhancementRow" v-for="row in processedRows">
        <div v-if="row.row.some(upgrade => unref(upgrade.visibility) !== Visibility.None)"
        >Remaining Enhancements: {{unref(row.count)}}</div>
        <Row>
            <template v-for="upgrade in row.row">
                <template v-if="unref(upgrade.visibility) !== Visibility.None">
                    <component :is="render(upgrade)" />
                </template>
            </template>
        </Row>
    </div>    
</template>

<script setup lang="ts">
import { GenericUpgrade } from 'features/upgrades/upgrade';
import { render, unwrapRef } from 'util/vue';
import { computed, unref } from 'vue';
import entropy, { EnhancementRow } from './entropy';
import Row from 'components/layout/Row.vue';
import { Visibility } from 'features/feature';

const props = defineProps<{
    rows: Record<EnhancementRow, GenericUpgrade[]>;
}>();

const processedRows = ([1, 2, 3, 4] as EnhancementRow[]).map(row => ({
    count: computed(() => unref(entropy.enhancementLimits[row as EnhancementRow]) - unref(entropy.enhancementCounts[row as 1 | 2 | 3 | 4])),
    row: unref(props.rows)[row]
}));
</script>

<style scoped>
.enhancementRow {
    width: fit-content;
    margin: var(--feature-margin) auto;
}

.enhancementRow > :not(.table) {
    background-color: var(--layer-color);
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: 0;
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
}

.enhancementRow :deep(.row), .enhancementRow :deep(button) {
    margin: 0;
    border-radius: 0;
}

.enhancementRow :deep(.tooltip-container:first-child button) {
    border-bottom-left-radius: var(--border-radius);
}

.enhancementRow :deep(.tooltip-container:last-child button) {
    border-bottom-right-radius: var(--border-radius);
}
</style>