<template>
    <div class="timesquare">
        <component :is="render(square)" />
        <div class="timesquare-buy-buttons">
            <component :is="render(buy)" />
            <component :is="render(buyNext)" />
            <component :is="render(buyMax)" />
        </div>
    </div>
</template>

<script setup lang="tsx">
import { Timesquare } from './timesquare';
import { render } from 'util/vue';

defineProps<{
    square: Timesquare["square"];
    buy: Timesquare["buy"];
    buyNext: Timesquare["buyNext"];
    buyMax: Timesquare["buyMax"];
}>();
</script>

<style scoped>
.timesquare {
    display: flex;
    flex-flow: row nowrap;
    margin: var(--feature-margin);
}

.timesquare > button {
    width: 187px;
    min-height: 225px;
    margin: 0px;
    border-radius: 25px 0px 0px 25px;
}

.timesquare-buy-buttons {
    display: flex;
    flex-flow: column nowrap;
}

.timesquare-buy-buttons > button {
    width: 125px;
    min-height: 75px;
    margin: 0px;
    border-radius: 0px;
    transform-origin: center left;
}
.timesquare-buy-buttons:first-child {
    border-top-right-radius: 25px;
    transform-origin: bottom left;
}
.timesquare-buy-buttons:last-child {
    border-bottom-right-radius: 25px;
    transform-origin: top left;
}
</style>