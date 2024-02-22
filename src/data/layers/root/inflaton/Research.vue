<template>
    <button
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined,
                '--fill-percent': `${format(unref(fillPercent))}%`
            }
        ]"
        @click="research(false)"
        :class="{
            research: true,
            hidden: isHidden(visibility),
            locked: !unref(canResearch), // unavailable to click
            can: unref(canResearch) && !unref(isResearching) && !unref(researched), // available to click, not in the queue or done
            queued: unref(isResearching), // in queue
            done: unref(researched) // finished researching
        }"
        :disabled="!unref(canResearch)"
    >
        <div v-if="!isVisible(visibility)">???</div>
        <component v-else-if="unref(component)" :is="unref(component)" />
        <Node :id="id" />
    </button>
</template>

<script setup lang="tsx">
import { isHidden, isVisible, jsx } from 'features/feature';
import Decimal from 'lib/break_eternity';
import { format } from 'util/break_eternity';
import { coerceComponent, isCoercableComponent } from 'util/vue';
import { DefineComponent, computed } from 'vue';
import { unref, shallowRef, watchEffect } from 'vue';
import { GenericResearch } from './research'
import Node from 'components/Node.vue';
import { displayRequirements } from 'game/requirements';

const props = defineProps<{
    visibility: GenericResearch["visibility"];
    display: GenericResearch["display"];
    id: GenericResearch["id"];
    requirements: GenericResearch["requirements"];
    canResearch: GenericResearch["canResearch"];
    isResearching: GenericResearch["isResearching"];
    progress: GenericResearch["progress"];
    progressPercentage: GenericResearch["progressPercentage"];
    researched: GenericResearch["researched"];
    research: GenericResearch["research"];
}>();

const component = shallowRef<DefineComponent | string>("");
watchEffect(() => {
    const currentDisplay = unref(props.display);
    if (currentDisplay == null) {
        component.value = "";
        return;
    }
    if (isCoercableComponent(currentDisplay)) {
        component.value = coerceComponent(currentDisplay);
        return;
    }
    const Requirements = unref(props.requirements);
    const Title = coerceComponent(currentDisplay.title ?? "", "h3");
    const Description = coerceComponent(currentDisplay.description);
    const EffectDisplay = coerceComponent(currentDisplay.effect ?? "");
    component.value = coerceComponent(jsx(() => (<>
                {currentDisplay.title ? <span><Title /></span> : null}
                <span><Description /></span>
                {currentDisplay.effect ? <span>Currently: <EffectDisplay /></span> : null}
                {displayRequirements(Requirements)}
        </>)));
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