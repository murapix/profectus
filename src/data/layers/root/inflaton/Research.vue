<template>
    <button
        :style="[
            {
                visibility: isHidden(visibility ?? true) ? 'hidden' : undefined,
                '--fill-percent': `${format(unref(fillPercent))}%`
            }
        ]"
        @click="research(false)"
        :class="{
            research: true,
            hidden: isHidden(visibility ?? true),
            locked: !unref(canResearch), // unavailable to click
            can: unref(canResearch) && !unref(isResearching) && !unref(researched), // available to click, not in the queue or done
            queued: unref(isResearching), // in queue
            done: unref(researched) // finished researching
        }"
        :disabled="!unref(canResearch)"
    >
        <div v-if="!isVisible(visibility ?? true)">???</div>
        <component v-else-if="unref(component)" :is="unref(component)" />
        <Node :id="id" />
    </button>
</template>

<script setup lang="tsx">
import Node from 'components/Node.vue';
import { isHidden, isVisible } from 'features/feature';
import Decimal from 'lib/break_eternity';
import { format } from 'util/break_eternity';
import { DefineComponent, computed, shallowRef, unref } from 'vue';
import { Research } from './research';

const props = defineProps<{
    visibility: Research["visibility"];
    display: Research["display"];
    id: Research["id"];
    requirements: Research["requirements"];
    canResearch: Research["canResearch"];
    isResearching: Research["isResearching"];
    progress: Research["progress"];
    progressPercentage: Research["progressPercentage"];
    researched: Research["researched"];
    research: Research["research"];
}>();

const component = shallowRef<DefineComponent | string>("");

const fillPercent = computed(() => Decimal.times(unref(props.progressPercentage), 1.1).minus(0.05).times(100));
</script>

<style scoped>
.research {
    min-height: 120px;
    width: 240px;
    font-size: 10px;

    position: relative;
    color: white;
    border: solid var(--feature-background) 2px;
    border-radius: var(--border-radius);
    background-color: var(--background);

    pointer-events: none;
    display: flex;
    flex-flow: column;
}

.research.hidden, .research.locked {
    border-color: var(--outline);
    color: var(--locked);
}

.research.can {
    pointer-events: all;
}

.research.queued, .research.can {
    background-image: linear-gradient(to right, var(--feature-background) calc(var(--fill-percent) - 5%), var(--background) calc(var(--fill-percent) + 5%));
}

.research.done {
    border-color: var(--bought);
    background-color: var(--bought);
}

.research > :deep(*) {
    pointer-events: none;
}
</style>