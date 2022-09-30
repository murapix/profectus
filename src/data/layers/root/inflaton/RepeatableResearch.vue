<template>
    <button
        v-if="unref(visibility) !== Visibility.None"
        :style="[
            {
                visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined,
                '--fill-percent': `${format(unref(fillPercent))}%`
            }
        ]"
        @click="research"
        :class="{
            research: true,
            repeatable: true,
            locked: !unref(canResearch), // unavailable to click
            can: unref(canResearch) && Decimal.eq(unref(progress), 0), // available to click, not in the queue
            queued: Decimal.gt(unref(progress), 0), // in queue (todo: change these to queue state, not progress)
        }"
        :disabled="!unref(canResearch)"
    >
        <div v-if="unref(visibility) === Visibility.None">???</div>
        <component v-else-if="unref(component)" :is="unref(component)" />
        <Node :id="id" />
    </button>
</template>

<script lang="tsx">
import { jsx, Visibility } from 'features/feature';
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
            type: processedPropType<Visibility>(Number),
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
        amount: processedPropType<DecimalSource>(String, Object, Number),
        research: {
            type: Function as PropType<VoidFunction>,
            required: true
        }
    },
    setup(props) {
        const { display, cost, progressPercentage, amount } = toRefs(props);
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
            const Title = coerceComponent(currentDisplay.title ?? "");
            const Description = coerceComponent(currentDisplay.description);
            const EffectDisplay = coerceComponent(currentDisplay.effectDisplay ?? "");
            component.value = coerceComponent(jsx(() => (<>
                        {currentDisplay.title ? <h3>Repeatable: <Title /> {formatRoman(Decimal.add(unref(unref(amount) ?? 0), 1))}</h3> : null}
                        <span><Description /></span>
                        {currentDisplay.effectDisplay ? <span>Currently: <EffectDisplay /></span> : null}
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

            fillPercent
        };

        function formatRoman(value: DecimalSource) {
            const romanNumerals: [number, string][] = [
                [1, 'I'], [4, 'IV'], [5, 'V'], [9, 'IX'], [10, 'X'], [40, 'XL'], [50, 'L'], [90, 'XC'], [100, 'C'], [400, 'CD'], [500, 'D'], [900, 'CM'], [1000, 'M']
            ]

            let num = new Decimal(value).trunc().toNumber();
            if (num >= 4000) return format(value);
            if (num < 1) return "Nulla";

            const out = [];
            for (let index = romanNumerals.length-1; num > 0; index--) {
                for (let i = Math.floor(num / romanNumerals[index][0]); i > 0; i--) {
                    out.push(romanNumerals[index][1]);
                }
                num %= romanNumerals[index][0];
            }

            return out.join('');
        }
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
    flex-flow: column;
}

.research.locked {
    border-color: var(--outline);
    color: var(--locked);
}

.research.can {
    pointer-events: all;
}

.research.queued {
    background-image: linear-gradient(to right, var(--layer-color) calc(var(--fill-percent) - 5%), var(--background) calc(var(--fill-percent) + 5%));
}

.research.done {
    border-color: var(--bought);
    background-color: var(--bought);
}

.research > * {
    pointer-events: none;
}
</style>