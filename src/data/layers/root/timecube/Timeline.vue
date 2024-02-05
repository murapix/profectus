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
        <div>Amount: {{ format(unref(score)) }}</div>
        <div>{{ sideNames[0] }}: +{{ format(effect.times(100)) }}%</div>
        <div>{{ sideNames[1] }}: +{{ format(effect.times(100)) }}%</div>
    </button>
</template>

<script setup lang="tsx">
import Decimal, { format } from 'util/break_eternity';
import { GenericTimeline } from './timeline';
import { unref } from 'vue';

const props = defineProps<{
    id: GenericTimeline["id"];
    sides: GenericTimeline["sides"];
    active: GenericTimeline["active"];
    next: GenericTimeline["next"];
    score: GenericTimeline["score"];
    onClick: GenericTimeline["onClick"];
}>();

const sideNames = props.sides.map(side => side[0].toUpperCase() + side.slice(1));
const effect = Decimal.add(unref(props.score), 1).log10().dividedBy(10);
</script>

<style scoped>
.timeline {
    width: 120px;
    height: 120px;

    font-size: 10px;

    background-color: var(--locked);
    border-color: rgba(0,0,0,0.125);
    border-width: 4px;
    border-radius: 0;
}

.timeline:hover {
    transform: scale(1.1, 1.1);
}

.timeline > * {
    pointer-events: none;
}

.active {
    background-color: var(--layer-color);
}

.next {
    border-color: var(--layer-color);
}
</style>