<template>
    <button
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined,
                '--fill-percent': `${format(unref(fillPercent))}%`
            }
        ]"
        @click="research()"
        :class="{
            research: true,
            hidden: unref(visibility) === Visibility.None,
            locked: !unref(canResearch), // unavailable to click
            can: unref(canResearch) && !unref(isResearching) && !unref(researched), // available to click, not in the queue or done
            queued: unref(isResearching), // in queue
            done: unref(researched) // finished researching
        }"
        :disabled="!unref(canResearch)"
    >
        <div v-if="unref(visibility) === Visibility.None">???</div>
        <component v-else-if="unref(component)" :is="unref(component)" />
        <Node :id="id" />
    </button>
</template>

<script lang="tsx">
import { isHidden, jsx, Visibility } from 'features/feature';
import Decimal, { DecimalSource } from 'lib/break_eternity';
import { format, formatWhole } from 'util/break_eternity';
import { coerceComponent, isCoercableComponent, processedPropType, unwrapRef } from 'util/vue';
import { PropType, Component, UnwrapRef, computed } from 'vue';
import { defineComponent, unref, toRefs, shallowRef, watchEffect } from 'vue';
import { GenericResearch } from './research'
import Node from 'components/Node.vue';

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility | boolean>(Number, Boolean),
            required: true
        },
        display: {
            type: processedPropType<UnwrapRef<GenericResearch["display"]>>(String, Object, Function),
            required: true
        },
        id: {
            type: String,
            required: true
        },
        cost: processedPropType<DecimalSource>(String, Object, Number),
        canResearch: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        isResearching: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        progress: {
            type: processedPropType<DecimalSource>(String, Object, Number),
            required: true
        },
        progressPercentage: {
            type: processedPropType<DecimalSource>(String, Object, Number),
            required: true
        },
        researched: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        research: {
            type: Function as PropType<VoidFunction>,
            required: true
        }
    },
    setup(props) {
        const { display, cost, progressPercentage } = toRefs(props);
        const component = shallowRef<Component | string>("");
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
            const Cost = unwrapRef(cost);
            const Title = coerceComponent(currentDisplay.title ?? "", "h3");
            const Description = coerceComponent(currentDisplay.description);
            const EffectDisplay = coerceComponent(currentDisplay.effect ?? "");
            component.value = coerceComponent(jsx(() => (<>
                        {currentDisplay.title ? <span><Title /></span> : null}
                        <span><Description /></span>
                        {currentDisplay.effect ? <span>Currently: <EffectDisplay /></span> : null}
                        <span>{formatWhole(Cost ?? 0)} Research Points</span>
                </>)));
        });

        const fillPercent = computed(() => Decimal.times(unwrapRef(progressPercentage), 1.1).minus(0.05).times(100));

        return {
            component,
            unref,
            format,
            Visibility,
            Decimal,
            isHidden,

            fillPercent
        };
    },
    components: { Node }
})
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

.research.hidden {
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