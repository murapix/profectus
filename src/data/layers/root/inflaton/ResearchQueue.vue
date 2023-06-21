<template>
    <Column>
        <template v-for="node, index in nodes" :key="slot ? `${slot[0]}-${slot[1]}` : `empty-${index}`">
            <h3 v-if="index === unref(parallel)">Next Up:</h3>
            <ResearchQueueSlot v-if="!node"
                :index="index" 
            />
            <ResearchQueueSlot v-else
                :node="node"
                :name="name(index)"
                :index="index"
            />
        </template>
    </Column>
</template>

<script setup lang="ts">
import { computed, isRef, unref } from 'vue';
import ResearchQueueSlot from './ResearchQueueSlot.vue';
import Column from 'components/layout/Column.vue';
import core from './coreResearch';
import { ProcessedComputable } from 'util/computed';
import { isCoercableComponent } from 'util/vue';
import { isFunction } from 'util/common';

const props = withDefaults(defineProps<{
    queue: ProcessedComputable<string[]>;
    parallel?: ProcessedComputable<number>;
}>(),
{
    parallel: 1
});

const allResearch = [core.research, core.repeatables].flatMap(location => Object.values(location));
const nodes = computed(() => unref(props.queue).map(id => allResearch.find(node => node.id === id)));

function name(index: number) {
    const node = unref(nodes)[index];
    if (node === undefined) return;
    if (isCoercableComponent(node.display)) return node.id;
    if (isRef(node.display)) return node.id;
    if (isFunction(node.display)) return node.id;
    return node.display.title;
}
</script>

<style scoped>
h3 {
    font-size: 12px;
}

.col > * {
    margin: var(--feature-margin) 0px;
}
</style>