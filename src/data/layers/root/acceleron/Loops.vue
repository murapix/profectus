<template>
    <div class="loop-container" :style="{width: `${size}px`, height: `${size}px`}">
        <svg :height="size" :width="size">
            <g v-for="loop in processedLoops.filter(loop => isVisible(loop.visibility)).reverse()"
                v-bind:key="loop.id"
                fill="none"
                :transform="unref(loop.translation)"
            >
                <Loop v-if="isVisible(loop.visibility) && !isHidden(loop.visibility)"
                    :color="unref(loop.color)"
                    :width="unref(loop.width)"
                    :radius="unref(loop.radius)"
                    :offset="unref(loop.offset)"
                    :angle="unref(loop.angle)"
                />
            </g>
        </svg>
        <component v-if="buildButton" :is="render(unref(buildButton))"/>
    </div>
</template>

<script setup lang="ts" generic="T">
import { GenericClickable } from "features/clickables/clickable";
import { isHidden, isVisible } from "features/feature";
import Decimal from "lib/break_eternity";
import { render } from "util/vue";
import { ComputedRef, computed, unref } from "vue";
import Loop from "./Loop.vue";
import acceleron from "./acceleron";
import { GenericLoop } from "./loop";

const props = defineProps<{
    radius: number;
    // @ts-ignore
    loops: GenericLoop<T>[];
    buildButton: GenericClickable;
}>();

const size = props.radius * 2;

const radii: ComputedRef<number>[] = props.loops.map((loop, index, loops) => {
    if (index === loops.length-1) {
        return computed(() => isVisible(loop.visibility)
            ? props.radius - unref(loop.display).width/2
            : props.radius)
    }
    else {
        return computed(() => isVisible(loop.visibility)
            ? unref(radii[index+1]) - unref(loops[index+1].display).width/2 - unref(loop.display).width/2
            : unref(radii[index+1]))
    }
});

const translations: ComputedRef<number>[] = props.loops.map((_, index, loops) => {
    if (index === loops.length-1) return computed(() => 0);
    else return computed(() => {
        const currentLoop = loops[index];
        const previousLoop = loops[index+1];
        const previousTranslation = unref(translations[index+1]);
        const previousWidth = isVisible(previousLoop.visibility) ? unref(previousLoop.display).width/2 : 0;
        const currentWidth = isVisible(currentLoop.visibility) ? unref(currentLoop.display).width/2 : 0;
        return previousTranslation + previousWidth + currentWidth;
    });
});

const progressAmounts: ComputedRef<Decimal>[] = props.loops.map(loop => 
    computed(() => {
        if (unref(loop.built)) return Decimal.div(unref(loop.triggerProgress), unref(loop.triggerRequirement));
        else return Decimal.div(unref(loop.buildProgress), unref(loop.buildRequirement));
    })
);

const startAngles: ComputedRef<number>[] = props.loops.map(loop => computed(() => Decimal.times(unref(acceleron.time), unref(acceleron.timeMult)).div(unref(loop.triggerRequirement)).toNumber() % 360));
const endAngles: ComputedRef<number>[] = props.loops.map((_, index) => computed(() => unref(progressAmounts[index]).times(360).toNumber() % 360));

const processedLoops = props.loops.map((loop, index) => ({
    id: loop.id,
    visibility: loop.visibility,
    color: computed(() => unref(unref(loop.display).color)),
    width: computed(() => unref(loop.display).width),
    radius: radii[index],
    offset: startAngles[index],
    angle: endAngles[index],
    translation: computed(() => {
        const translation = unref(translations[index]);
        return `translate(${translation},${translation})`;
    })
}));
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
.loop-cointainer > button.can:hover {
    transform: none;
    box-shadow: inset 0 0 20px var(--feature-background);
}
</style>