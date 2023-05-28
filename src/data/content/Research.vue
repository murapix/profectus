<template>
    <button @click="startResearch"
            :class="{ researching: unref(isResearching) }"
            :style="{ background: `linear-gradient(to right, var(--accent1) ${unref(progressPercentage)*100}%, var(--locked) ${unref(progressPercentage)*100}%)` }"
            >
        <span><component :is="coerceComponent(unref(display).title, 'h3')" /></span>
        <span><component :is="coerceComponent(unref(display).description)" /></span>            
        <div class="resource-list">
            <template v-for="[resource, symbol, amountLeft, requirement] of costs">
                <div class="resource-cost" :style="{
                    color: ((amounts[resource] ?? 0) >= amountLeft) ? 'var(--feature-foreground)' : undefined
                }">
                    <component :is="symbol" style="user-select: none"/>
                    <span>{{ formatWhole(requirement - amountLeft) }}/{{ formatWhole(requirement) }}</span>
                </div>
            </template>
        </div>
        <Node :id="id" />
    </button>
</template>

<script setup lang="ts">
import { CoercableComponent, Visibility } from 'features/feature';
import { coerceComponent } from 'util/vue';
import { DefineComponent, computed, unref } from 'vue';
import { Resources, resources } from './resources';
import { root } from 'data/projEntry';
import { amounts } from './resources';
import { formatWhole } from 'util/break_eternity';
import { ProcessedComputable } from 'util/computed';
import Node from 'components/Node.vue';

const props = defineProps<{
        visibility: ProcessedComputable<Visibility | boolean>;
        display: ProcessedComputable<{ title: CoercableComponent, description: CoercableComponent }>;
        id: string;
        resources: Partial<Record<Resources, number>>;
        progress: ProcessedComputable<Partial<Record<Resources, number>>>;
        progressPercentage: ProcessedComputable<number>;
        isResearching: ProcessedComputable<boolean>;
        researched: ProcessedComputable<boolean>;
}>();

const costs = computed(() => {
    let costs = [] as [Resources, DefineComponent, number, number][];
    for (const resource in resources) {
        if (resource in props.resources && props.resources[resource as Resources]! > 0) {
            costs.push([
                resource as Resources,
                coerceComponent(resources[resource as Resources].symbol),
                unref(props.progress)[resource as Resources]!,
                props.resources[resource as Resources]!
            ])
        }
    }
    return costs;
});

function startResearch() {
    if (unref(props.researched)) return;
    if (unref(props.isResearching)) return;
    console.log("Setting active research value to", props.id);
    root.activeResearch.value = props.id;
}
</script>

<style scoped>
button {
    display: flex;
    flex-flow: column nowrap;
    border: solid var(--outline) var(--border-thickness);
    background: var(--locked);
    color: var(--foreground);
    min-height: 75px;
    margin: var(--border-thickness);
    width: calc(100% - 2 * var(--border-thickness));
}

button:not(.researching) {
    cursor: pointer;
}

button > * {
    margin-left: 0;
    text-align: left;
}

.resource-list {
    display: flex;
    flex-flow: row wrap;
}

.resource-cost {
    margin-right: 15px;
}

.resource-cost > * {
    margin-right: var(--border-thickness);
}

h3 {
    color: var(--feature-foreground);
}
</style>