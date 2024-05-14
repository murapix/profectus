<template>
    <Tooltip v-if="unref(loopDescriptions).length > 0" :display="joined" :direction="Direction.Up">
        <div>Hover for Current Effects</div>
    </Tooltip>
</template>

<script setup lang="tsx" generic="T">
import { jsx } from "features/feature";
import Tooltip from "features/tooltips/Tooltip.vue";
import { Direction } from "util/common";
import { joinJSX, renderJSX } from "util/vue";
import { computed, unref } from "vue";
import { GenericLoop } from "./loop";
import acceleron from "./acceleron";
import Decimal from "lib/break_eternity";
import { formatSmall } from "util/break_eternity";
import abyss from "../skyrmion/abyss";

const props = defineProps<{
    // @ts-ignore
    loops: GenericLoop<T>[]
}>();

const loopDescriptions = computed(() => props.loops.filter(loop => unref(loop.built)).map(loop => renderJSX(unref(loop.display).description)));

const joined = jsx(() => {
    const abyssDescription = <>Friction and interference between the Entropic Loops is slowing time to <span style={{color: abyss.theme["--feature-background"]}}>
            {formatSmall(Decimal.sqr(unref(acceleron.upgrades.fluctuation.effect)).reciprocate().times(100))}%</span></>;
    if (unref(abyss.challenge.active)) {
        return joinJSX([abyssDescription, ...unref(loopDescriptions)], <br/>);
    }
    return joinJSX(unref(loopDescriptions), <br/>)
});
</script>

<style scoped>
div {
    color: var(--link);
}

:deep(.tooltip) {
    background-color: rgb(from var(--tooltip-background) r g b / 0.9);
    border-radius: 5px;
    font-size: 12px;
    color: var(--link);
}
</style>