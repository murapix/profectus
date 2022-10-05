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

<script lang="ts">
import { CoercableComponent } from 'features/feature';
import Decimal, { DecimalSource } from 'lib/break_eternity';
import { format } from 'util/break_eternity';
import { coerceComponent, processedPropType, unwrapRef } from 'util/vue';
import { defineComponent, unref, toRefs, computed } from 'vue';
import inflaton from './inflaton'

export default defineComponent({
    props: {
        id: processedPropType<string>(String),
        location: processedPropType<string>(String),
        name: processedPropType<CoercableComponent>(String, Object, Function),
        progress: processedPropType<DecimalSource>(Number, String, Object),
        index: {
            type: processedPropType<number>(Number),
            required: true
        }
    },
    setup(props) {
        const { id, location, progress } = toRefs(props);

        const isResearch = computed(() => unwrapRef(id) && unwrapRef(location));
        const fillPercent = computed(() => Decimal.times(unwrapRef(progress) ?? 0, 1.1).minus(0.05).times(100));

        return {
            unref,
            format,
            coerceComponent,
            removeFromQueue: () => inflaton.removeFromQueue(
                unwrapRef(location) ?? '',
                unwrapRef(id) ?? ''
            ),

            isResearch,
            fillPercent
        }
    }
})
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
    border-color: var(--layer-color);
    background-image: linear-gradient(to right, var(--layer-color) calc(var(--fill-percent) - 5%), var(--background) calc(var(--fill-percent) + 5%));
    pointer-events: all;
}

.queue > * {
    pointer-events: none;
}
</style>