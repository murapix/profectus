<template>
    <button
        @click="onClick"
        :class="{
            feature: true,
            timeline: true,
            active: unref(active),
            next: unref(next)
        }"
    >
        <h2>{{ sideNames[0] }} {{ sideNames[1] }}</h2>
        <div>Score: {{ format(unref(score)) }}</div>
        <div>{{ sideNames[0] }}: +{{ format(unref(sideEffects[sides[0]]).times(100)) }}%</div>
        <div>{{ sideNames[1] }}: +{{ format(unref(sideEffects[sides[1]]).times(100)) }}%</div>
    </button>
</template>

<script setup lang="tsx">
import Decimal, { format } from 'util/break_eternity';
import { computed, unref } from 'vue';
import { GenericTimeline } from './timeline';
import timelines from './timelines';

const props = defineProps<{
    id: GenericTimeline["id"];
    sides: GenericTimeline["sides"];
    active: GenericTimeline["active"];
    next: GenericTimeline["next"];
    score: GenericTimeline["score"];
    onClick: GenericTimeline["onClick"];
}>();

const sideNames = props.sides.map(side => side[0].toUpperCase() + side.slice(1));
const effect = computed(() => Decimal.add(unref(props.score), 1).log10().dividedBy(10));
const sideEffects = {
    [props.sides[0]]: computed(() => unref(effect).times(timelines.scoreMultipliers[props.sides[0]])),
    [props.sides[1]]: computed(() => unref(effect).times(timelines.scoreMultipliers[props.sides[1]]))
};
</script>

<style scoped>
.timeline {
    width: 120px;
    height: 120px;

    font-size: 10px;

    background-color: var(--locked);
    border-color: #424B5D;
    border-width: 4px;
}

.timeline:hover {
    transform: scale(1.1, 1.1);
}

.timeline > * {
    pointer-events: none;
}

.active {
    background-color: var(--feature-background);
}

.next {
    border-color: var(--feature-background);
}
</style>