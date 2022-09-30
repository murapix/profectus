<template>
    <div class="enhancementRow" v-for="row in rows">
        <div>Remaining Enhancements: {{unref(row.count)}}</div>
        <Row>
            <template v-for="upgrade in row.row">
                <component :is="render(upgrade)" />
            </template>
        </Row>
    </div>    
</template>

<script lang="ts">
import { GenericUpgrade } from 'features/upgrades/upgrade';
import { processedPropType, render, unwrapRef } from 'util/vue';
import { computed, defineComponent, unref, toRefs } from 'vue';
import entropy from './entropy';
import Row from 'components/layout/Row.vue';

export default defineComponent({
    props: {
        rows: {
            type: processedPropType<GenericUpgrade[][]>(Array),
            required: true
        }
    },
    setup(props) {
        const { rows } = toRefs(props);
        const processedRows = [1, 2, 3, 4].map(row => ({
            count: computed(() => unref(entropy.enhancementLimits[row as 1 | 2 | 3 | 4]) - unref(entropy.enhancementCounts[row as 1 | 2 | 3 | 4])),
            row: unwrapRef(rows)[row - 1]
        }));
        return {
            rows: processedRows,
            unref,
            render
        };
    },
    components: { Row }
})
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