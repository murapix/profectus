<template>
    <button
        :disabled="!isResearch"
        :class="{
            queue: true,
            can: isResearch
        }"
        :style="[ { '--fill-percent': `${format(unref(fillPercent))}%` } ]"
        @click="removeFromQueue"
    >
        <span v-if="isResearch"><component :is="coerceComponent(unref(name) ?? '')" /></span>
        <span v-else>Research Slot {{unref(index) + 1}}</span>
    </button>
</template>

<script setup lang="ts">
import { CoercableComponent } from 'features/feature';
import Decimal from 'lib/break_eternity';
import { format } from 'util/break_eternity';
import { coerceComponent } from 'util/vue';
import { unref, computed } from 'vue';
import { removeResearchFromQueue } from './coreResearch';
import { GenericResearch } from './research';

const props = defineProps<{
    node?: GenericResearch;
    name?: CoercableComponent;
    index: number;
}>();

const isResearch = computed(() => props.node !== undefined);
const fillPercent = computed(() => Decimal.times(unref(props.node?.progressPercentage) ?? 0, 1.1).minus(0.05).times(100));
const removeFromQueue = () => unref(isResearch) ? removeResearchFromQueue(props.node!) : {};
</script>

<style scoped>
.queue {
    min-height: 30px;
    width: 240px;
    font-size: 10px;

    position: relative;
    color: var(--locked);
    border: solid var(--outline) 2px;
    border-radius: var(--border-radius);
    background-color: var(--background);

    pointer-events: none;
    display: flex;
    flex-flow: column;
    /* align-items: center; */
}

.can {
    color: white;
    border-color: var(--feature-background);
    background-image: linear-gradient(to right, var(--feature-background) calc(var(--fill-percent) - 5%), var(--background) calc(var(--fill-percent) + 5%));
    pointer-events: all;
}

.queue > * {
    pointer-events: none;
}
</style>