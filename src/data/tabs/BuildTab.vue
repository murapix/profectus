<template>
    <div class="build-tab">
        <h3>Buildings</h3>
        <Spacer />
        <div class="scroll">
            <div class="build-column">
                <BuildTabElement
                    :type="BoardNodeType.Extractor"
                    :building="buildings.extractor"
                    :component="Extractor"
                    :selected="selected"
                    @select-building="select"
                />
                <BuildTabElement
                    :type="BoardNodeType.Router"
                    :building="buildings.router"
                    :component="Router"
                    :selected="selected"
                    @select-building="select"
                />
                <BuildTabElement
                    :type="BoardNodeType.Foundry"
                    :building="buildings.foundry"
                    :component="Foundry"
                    :selected="selected"
                    @select-building="select"
                />
                <BuildTabElement
                    :type="BoardNodeType.Analyzer"
                    :building="buildings.analyzer"
                    :component="Analyzer"
                    :selected="selected"
                    @select-building="select"
                />
                <BuildTabElement
                    :type="BoardNodeType.Researcher"
                    :building="buildings.researcher"
                    :component="Researcher"
                    :selected="selected"
                    @select-building="select"
                />
                <BuildTabElement
                    v-if="root.research.bore.researched.value"
                    :type="BoardNodeType.Bore"
                    :building="buildings.bore"
                    :component="Bore"
                    :selected="selected"
                    @select-building="select"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { BoardNodeType } from 'data/content/types';
import Spacer from 'components/layout/Spacer.vue';
import Router from 'data/nodes/friendly/Router.vue';
import Extractor from 'data/nodes/friendly/Extractor.vue';
import Foundry from 'data/nodes/friendly/Foundry.vue';
import Analyzer from 'data/nodes/friendly/Analyzer.vue';
import Researcher from 'data/nodes/friendly/Researcher.vue';
import Bore from 'data/nodes/friendly/Bore.vue';
import { computed } from 'vue';
import { root } from 'data/projEntry';
import { createNode } from 'data/content/nodes';
import { buildings } from 'data/content/building';
import BuildTabElement from './BuildTabElement.vue';

const selected = computed(() => root.board.draggingNode.value?.type);

function select(nodeType: BoardNodeType) {
    const selected = root.board.draggingNode;
    const selectedNode = selected.value
    if (selectedNode === null || selectedNode.type !== nodeType) {
        selected.value = createNode({
            position: { x: 0, y: 0 },
            type: nodeType
        });
    }
    else {
        selected.value = null;
    }
}
</script>

<style scoped>
.build-tab {
    height: calc(100vh - 50px);
    width: calc(100% - var(--border-thickness));
    border-right: solid var(--border-thickness);
    background: var(--locked);
}

.scroll {
    overflow-y: auto;
    max-height: calc(100% - 75px);
    margin-left: var(--border-thickness);
    margin-right: var(--border-thickness);
}

.scroll::-webkit-scrollbar {
    width: var(--border-thickness);
}

.scroll::-webkit-scrollbar-track {
    background: var(--foreground);
}

.scroll::-webkit-scrollbar-thumb {
    background: var(--accent1);
}

.scroll::-webkit-scrollbar-thumb:hover {
    background: var(--feature-foreground);
}

.build-column {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: stretch;
    max-height: calc(100% - 38px);
}

h3 {
    position: relative;
    top: 2;
}
</style>