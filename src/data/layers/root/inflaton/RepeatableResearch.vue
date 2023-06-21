<template>
    <button
        v-if="isVisible(visibility)"
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined,
                '--fill-percent': `${format(unref(fillPercent))}%`
            }
        ]"
        @click="research(false)"
        :class="{
            research: true,
            repeatable: true,
            locked: !unref(canResearch), // unavailable to click
            can: unref(canResearch) && !unref(isResearching), // available to click, not in the queue
            queued: unref(isResearching), // in queue
        }"
        :disabled="!unref(canResearch)"
    >
        <div v-if="unref(visibility) === Visibility.None">???</div>
        <component v-else-if="unref(component)" :is="unref(component)" />
        <Node :id="id" />
    </button>
</template>

<script setup lang="tsx" generic="T">
import { isHidden, isVisible, jsx, Visibility } from 'features/feature';
import Decimal from 'lib/break_eternity';
import { format } from 'util/break_eternity';
import { coerceComponent, isCoercableComponent, unwrapRef } from 'util/vue';
import { computed, DefineComponent } from 'vue';
import { unref, toRefs, shallowRef, watchEffect } from 'vue';
import Node from 'components/Node.vue';
import { GenericRepeatableResearch } from './repeatableDecorator';
import { displayRequirements } from 'game/requirements';

const props = defineProps<{
    visibility: GenericRepeatableResearch["visibility"];
    display: GenericRepeatableResearch["display"];
    id: GenericRepeatableResearch["id"];
    requirements: GenericRepeatableResearch["requirements"];
    canResearch: GenericRepeatableResearch["canResearch"];
    isResearching: GenericRepeatableResearch["isResearching"];
    progress: GenericRepeatableResearch["progress"];
    progressPercentage: GenericRepeatableResearch["progressPercentage"];
    researched: GenericRepeatableResearch["researched"];
    amount: GenericRepeatableResearch["amount"];
    limit?: GenericRepeatableResearch["limit"];
    research: GenericRepeatableResearch["research"];
}>();

const { display, requirements, progressPercentage } = toRefs(props);
const component = shallowRef<DefineComponent | string>("");
watchEffect(() => {
    const currentDisplay = unwrapRef(display);
    if (currentDisplay == null) {
        component.value = "";
        return;
    }
    if (isCoercableComponent(currentDisplay)) {
        component.value = coerceComponent(currentDisplay);
        return;
    }
    const Requirements = unwrapRef(requirements);
    const Title = coerceComponent(currentDisplay.title ?? "", "h3");
    const Description = coerceComponent(currentDisplay.description);
    const EffectDisplay = coerceComponent(currentDisplay.effect ?? "");
    component.value = coerceComponent(jsx(() => (<>
                {currentDisplay.title ? <Title /> : null}
                <span><Description /></span>
                {currentDisplay.effect ? <span>Currently: <EffectDisplay /></span> : null}
                {displayRequirements(Requirements)}
        </>)));
});

const fillPercent = computed(() => Decimal.times(unwrapRef(progressPercentage), 1.1).minus(0.05).times(100));
</script>

<style scoped>
.research {
    min-height: 120px;
    width: 240px;
    font-size: 10px;

    position: relative;
    color: white;
    border: solid var(--layer-color) 2px;
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
    background-image: linear-gradient(to right, var(--layer-color) calc(var(--fill-percent) - 5%), var(--background) calc(var(--fill-percent) + 5%));
}

.research.done {
    border-color: var(--bought);
    background-color: var(--bought);
}

.research > :deep(*) {
    pointer-events: none;
}
</style>