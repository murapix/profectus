<template>
    <button
        v-if="isVisible(visibility ?? true)"
        :style="[
            {
                visibility: isHidden(visibility ?? true) ? 'hidden' : undefined,
                '--fill-percent': `${format(unref(fillPercent))}%`
            }
        ]"
        @click="research(false)"
        :class="{
            research: true,
            repeatable: true,
            locked: !unref(canResearch), // unavailable to click
            maxed: unref(maxed),
            can: unref(canResearch) && !unref(isResearching), // available to click, not in the queue
            queued: unref(isResearching), // in queue
        }"
        :disabled="!unref(canResearch)"
    >
        <div v-if="!isVisible(visibility ?? true)">???</div>
        <component v-else-if="unref(component)" :is="unref(component)" />
        <Node :id="id" />
    </button>
</template>

<script setup lang="tsx" generic="T">
import Node from 'components/Node.vue';
import { isHidden, isVisible } from 'features/feature';
import Decimal from 'lib/break_eternity';
import { format } from 'util/break_eternity';
import { DefineComponent, computed, shallowRef, unref, watchEffect } from 'vue';
import { RepeatableResearch } from './repeatableDecorator';
import { render } from 'util/vue';

const props = defineProps<{
    visibility: RepeatableResearch["visibility"];
    display: RepeatableResearch["display"];
    id: RepeatableResearch["id"];
    requirements: RepeatableResearch["requirements"];
    canResearch: RepeatableResearch["canResearch"];
    isResearching: RepeatableResearch["isResearching"];
    progress: RepeatableResearch["progress"];
    progressPercentage: RepeatableResearch["progressPercentage"];
    researched: RepeatableResearch["researched"];
    amount: RepeatableResearch["amount"];
    limit?: RepeatableResearch["limit"];
    maxed: RepeatableResearch["maxed"];
    research: RepeatableResearch["research"];
}>();

const component = shallowRef<DefineComponent | string>("");
watchEffect(() => {
    const currentDisplay = unref(props.display);
    if (currentDisplay == null) {
        component.value = "";
        return;
    }
    component.value = render(currentDisplay);
});

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

.research.locked {
    border-color: var(--outline);
    color: var(--locked);
}

.research.can {
    pointer-events: all;
}

.research.queued, .research.can {
    background-image: linear-gradient(to right, var(--feature-background) calc(var(--fill-percent) - 5%), var(--background) calc(var(--fill-percent) + 5%));
}

.research.done, .research.maxed {
    border-color: var(--bought);
    background-color: var(--bought);
    color: white;
}

.research > :deep(*) {
    pointer-events: none;
}
</style>