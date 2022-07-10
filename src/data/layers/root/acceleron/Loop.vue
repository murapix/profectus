<template>
    <circle stroke="#242526" 
            :stroke-width="unref(width)/2"
            :cx="unref(center)"
            :cy="unref(center)"
            :r="unref(radius)" />
    <circle v-if="unref(angle) > 0"
            :stroke="unref(color)"
            :stroke-width="unref(width)"
            :stroke-dasharray="unref(arc)"
            :cx="unref(center)"
            :cy="unref(center)"
            :r="unref(radius)"
            :transform="unref(rotate)"
            :transform-origin="`${unref(center)} ${unref(center)}`"
            stroke-linecap="round"
            style="transition-duration: 0s"
            />
</template>

<script lang="ts">
import { processedPropType, unwrapRef } from "util/vue";
import { computed, defineComponent, toRefs, unref } from "vue";

export default defineComponent({
    props: {
        color: {
            type: processedPropType<string>(String),
            required: true
        },
        width: {
            type: processedPropType<number>(Number),
            required: true
        },
        radius: {
            type: processedPropType<number>(Number),
            required: true
        },
        offset: {
            type: processedPropType<number>(Number),
            required: true
        },
        angle: {
            type: processedPropType<number>(Number),
            required: true
        }
    },
    setup(props) {
        const { offset, angle, radius, width } = toRefs(props)

        const circumference = computed(() => unwrapRef(radius) * Math.PI * 2);
        const arc = computed(() => unref(circumference) * unwrapRef(angle) / 360);
        const center = computed(() => unwrapRef(radius) + unwrapRef(width)/2);

        const arcString = computed(() => `${unref(arc)}, ${unref(circumference)}`)
        const rotationString = computed(() => `rotate(${unwrapRef(offset)})`)

        return {
            arc: arcString,
            rotate: rotationString,
            center,
            unref
        }
    }
})
</script>