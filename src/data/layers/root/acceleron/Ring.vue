<template>
    <div :style="{
        position: 'relative',
        marginBottom:`${unref(width)-unref(maxSize)}px`,
        width:`${unref(maxSize)}px`,
        height:`${unref(maxSize)}px`,
        '--radius':`-${unref(radius) + unref(width)/2}px`,
        '--width':`${unref(width)}px`
    }">
        <template v-for="(button, index) in unref(components)" :key="button.id">
            <div class="ring-container" :style="getRotation(index)">
                <component :is="render(button)" :style="getStyle(index)" :class="`loop-${index}`" class="ring-component" />
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { render, processedPropType, unwrapRef } from "util/vue";
import { defineComponent, toRefs, computed, ComputedRef, unref, StyleValue } from "vue";
import { GenericUpgrade } from "features/upgrades/upgrade";
import { GenericClickable } from "features/clickables/clickable";

export default defineComponent({
    props: {
        radius: {
            type: processedPropType<number>(Number),
            required: true
        },
        width: {
            type: processedPropType<number>(Number),
            required: true
        },
        components: {
            type: processedPropType<(GenericClickable | GenericUpgrade)[]>(Array),
            required: true
        }
    },
    setup(props) {
        const { radius, width, components } = toRefs(props);

        const maxSize = computed(() => 2*(unwrapRef(radius) + unwrapRef(width)));

        const numSections = computed(() => unwrapRef(components).length);
        const fullAngle = computed(() => 2*Math.PI / unref(numSections));
        const margin = 50; // not sure why this needs to be 10x the actual px margin

        type loopData = {[key: string]: ComputedRef<any>}
        const inner: loopData = {
            radius: computed(() => unwrapRef(radius))
        };
        const outer: loopData = {
            radius: computed(() => unwrapRef(radius) + unwrapRef(width))
        };
        [inner, outer].forEach((loop) => {
            loop.circumference = computed(() => unref(loop.radius) * 2*Math.PI);
            loop.margin = computed(() => margin / unref(loop.circumference));
            loop.angle = computed(() => unref(fullAngle) - unref(loop.margin));
        });

        const style = computed(() => {
            let offset = -(unref(fullAngle) + Math.PI)/2;
            let angles = [
                [offset + unref(outer.margin)/2, outer],
                [offset + unref(outer.margin)/2 + unref(outer.angle), outer],
                [offset + unref(inner.margin)/2 + unref(inner.angle), inner],
                [offset + unref(inner.margin)/2, inner]
            ];
            let points = angles.map(([angle, loop]) => [Math.cos(angle)*unref(loop.radius) + unref(maxSize)/2, Math.sin(angle)*unref(loop.radius) + unref(maxSize)/2]);
            let paths = [
                `M ${points[0][0]} ${points[0][1]}`,
                `A ${unref(outer.radius)} ${unref(outer.radius)} 0 0 1 ${points[1][0]} ${points[1][1]}`,
                `L ${points[2][0]} ${points[2][1]}`,
                `A ${unref(inner.radius)} ${unref(inner.radius)} 0 0 0 ${points[3][0]} ${points[3][1]}`
            ]
            return {
                clipPath: `path('${paths.join(' ')}')`,
                width: `${unref(maxSize)}px`,
                minHeight: `${unref(maxSize)}px`
            }
        })

        const getRotation = (index: number): StyleValue => ({transform: `rotate(${index * 360 / unref(numSections)}deg)`});

        const getStyle = (index: number): StyleValue => ({
            ...unref(style),
            '--unrotate': `rotate(-${index * 360 / unref(numSections)}deg)`
        });
        
        return {
            render,
            unref,
            getRotation,
            getStyle,
            maxSize
        }
    }
})
</script>

<style>
.ring-container {
    position: absolute;
    top: 0;
    left :0;
    pointer-events: none;
    margin: 0;
    border: 0;
    padding: 0;
}

.ring-container > * {
    pointer-events: auto;
    transform-origin: center calc(top + var(--radius))
}

.ring-component.ring-component {
    margin: 0;
    border-radius: 0;
    border: 0;
    padding: 0;
}

.ring-component > span {
    position: relative;
    top: var(--radius);
    transform: var(--unrotate);
    display: block;
}
</style>