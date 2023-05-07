<template>
    <div class="loop-container" :style="{width: `${size}px`, height: `${size}px`}">
        <svg :height="size" :width="size">
            <g v-for="bar in processedBars.filter(bar => isVisible(bar.visibility)).reverse()"
            v-bind:key="bar.id"
            fill="none"
            :transform="unref(bar.translation)"
            :class="`angle${unref(bar.angle)}`"
            >
                <Loop v-if="isVisible(bar.visibility) && !isHidden(bar.visibility)"
                    :color="bar.color"
                    :width="bar.width"
                    :radius="bar.radius"
                    :offset="bar.offset"
                    :angle="bar.angle"
                />
            </g>
        </svg>
        <component v-if="buildButton" :is="render(unref(buildButton))"/>
    </div>
</template>

<script lang="ts">
import { GenericClickable } from "features/clickables/clickable";
import { isVisible, isHidden } from "features/feature";
import Decimal from "lib/break_eternity";
import { processedPropType, render, unwrapRef } from "util/vue";
import { computed, ComputedRef, defineComponent, toRefs, unref } from "vue";
import acceleron from "./acceleron";
import { GenericLoop } from "./loop";
import Loop from "./Loop.vue";

export default defineComponent({
    props: {
        radius: {
            type: processedPropType<number>(Number),
            required: true
        },
        bars: {
            type: processedPropType<GenericLoop[]>(Array),
            required: true
        },
        buildButton: processedPropType<GenericClickable>(Object)
    },
    setup(props) {
        const { radius, bars } = toRefs(props);

        const size = unwrapRef(radius) * 2;

        const radii: ComputedRef<number>[] = unwrapRef(bars).map((bar, index, bars) => {
            if (index === bars.length-1) {
                return computed(() => isVisible(bar.visibility)
                    ? unwrapRef(radius) - unref(bar.display).width/2
                    : unwrapRef(radius))
            }
            else {
                return computed(() => isVisible(bar.visibility)
                    ? unref(radii[index+1]) - unref(bars[index+1].display).width/2 - unref(bar.display).width/2
                    : unref(radii[index+1]))
            }
        });

        const translations: ComputedRef<number>[] = unwrapRef(bars).map((_, index, bars) => {
            if (index === bars.length-1) return computed(() => 0);
            else return computed(() => unref(translations[index+1]) + unref(bars[index+1].display).width);
        });

        const progressAmounts: ComputedRef<Decimal>[] = unwrapRef(bars).map(bar => 
            computed(() => {
                if (unref(bar.built)) return Decimal.div(unref(bar.triggerProgress), unref(bar.triggerRequirement));
                else return Decimal.div(unref(bar.buildProgress), unref(bar.buildRequirement));
            })
        );

        const startAngles: ComputedRef<number>[] = unwrapRef(bars).map(bar => computed(() => Decimal.times(unref(acceleron.time), unref(acceleron.timeMult)).div(unref(bar.triggerRequirement)).toNumber() % 360));
        const endAngles: ComputedRef<number>[] = unwrapRef(bars).map((_, index) => computed(() => unref(progressAmounts[index]).times(360).toNumber() % 360));

        const processedBars = unwrapRef(bars).map((bar, index) => ({
            id: bar.id,
            visibility: bar.visibility,
            color: computed(() => unref(unref(bar.display).color)),
            width: computed(() => unref(bar.display).width),
            radius: radii[index],
            offset: startAngles[index],
            angle: endAngles[index],
            translation: computed(() => {
                const translation = unref(translations[index]);
                return `translate(${translation},${translation})`;
            })
        }))

        return {
            processedBars,
            size,
            isVisible,
            isHidden,
            unref,
            render
        };
    },
    components: { Loop }
})
</script>

<style>
.loop-container {
    position: relative;
}

.loop-container > button {
    position: absolute;
    top: calc(50% - 60px);
    left: calc(50% - 60px);
    margin: 0;
}

.loop-container > button.can:hover {
    transform: none;
    box-shadow: inset 0 0 20px var(--layer-color);
}
</style>