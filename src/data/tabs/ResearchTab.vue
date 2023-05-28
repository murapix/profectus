<template>
    <div class="research-tab">
        <h3>Research</h3>
        <Spacer />
        <div class="research-row">
            <div class="current-project">
                Current Project
                <component v-if="activeResearch !== undefined" :is="render(activeResearch)" class="current" />
                <div v-else class="current"><h3>Select a Research Project</h3></div>
            </div>
            <VerticalRule />
            <div class="scroll">
                <div class="research-block">
                    <template v-for="inactive of inactiveResearch">
                        <component :is="render(inactive)" />
                    </template>
                    <template v-for="completed of completedResearch">
                        <component :is="render(completed)" />
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Spacer from 'components/layout/Spacer.vue';
import VerticalRule from 'components/layout/VerticalRule.vue';
import { root } from 'data/projEntry';
import { isVisible } from 'features/feature';
import { render } from 'util/vue';
import { computed, unref } from 'vue';

const availableResearch = computed(() => Object.values(root.research).filter(available => isVisible(available.visibility)));
const activeResearch = computed(() => availableResearch.value.find(research => research.id === root.activeResearch.value));
const inactiveResearch = computed(() => availableResearch.value.filter(research => !unref(research.researched)).filter(research => research.id !== root.activeResearch.value));
const completedResearch = computed(() => availableResearch.value.filter(research => unref(research.researched)));
</script>

<style scoped>
.research-tab {
    width: 100%;
    height: calc(100% - var(--border-thickness));
    border-top: solid var(--border-thickness);
}

.research-row {
    display: grid;
    grid-template-columns: 1fr 8px 2fr;
    margin: 0 15px;
}

.research-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
}

.current-project {
    display: flex;
    flex-flow: column nowrap;
    
    width: 100%;
    height: 100%;
}

.current {
    border: solid var(--border-thickness) var(--outline);
    min-height: 65px;
    width: calc(100% - 12px - 2 * var(--border-thickness));
    padding: 1px 6px;
    margin-top: 0;
}

div.current {
    color: var(--feature-foreground);
}

.scroll {
    overflow-y: auto;
    height: 168px;
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
</style>