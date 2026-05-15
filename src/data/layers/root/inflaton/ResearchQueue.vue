<template>
    <Column>
        <template v-for="node, index in nodes" :key="node ? node.id : `empty-${index}`">
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
import Column from 'components/layout/Column.vue';
import { computed, isRef, MaybeRef, unref } from 'vue';
import ResearchQueueSlot from './ResearchQueueSlot.vue';
import core from './coreResearch';

const props = withDefaults(defineProps<{
    queue: MaybeRef<string[]>;
    parallel?: MaybeRef<number>;
}>(),
{
    parallel: 1
});

const allResearch = [core.research, core.repeatables].flatMap(location => Object.values(location));
const nodes = computed(() => unref(props.queue).map(id => allResearch.find(node => node.id === id)));

function name(index: number) {
    const node = unref(nodes)[index];
    if (node === undefined) return;
    return node.id;
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