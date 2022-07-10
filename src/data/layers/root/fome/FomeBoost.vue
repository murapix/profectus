<template>
    <div style="display: grid; gridTemplateColumns: repeat(7, auto); width: fit-content; margin: auto">
        <template v-for="(boosts, key) in fomeBoosts" :key="key">
            <Spacer :num-labels="7" v-for="n in 7" :key="n" />
            <template v-for="(boost, index) in boosts" :key="key + '-' + index">
                <div v-for="val in boost" :key="val">{{ val }}</div>
            </template>
        </template>
    </div>
</template>

<script lang="ts">
import Spacer from "components/layout/Spacer.vue";
import { defineComponent, unref } from "vue";
import fome, { FomeTypes } from "./fome";

export default defineComponent({
    setup() {
        let fomeBoosts = Object.fromEntries(
            Object.entries(fome.boosts).map(([type, boosts]) => [
                type,
                {
                    // this is nasty, not sure how to get around it
                    [1]: unref(boosts[1].display),
                    [2]: unref(boosts[2].display),
                    [3]: unref(boosts[3].display),
                    [4]: unref(boosts[4].display),
                    [5]: unref(boosts[5].display)
                }
            ])
        ) as Record<FomeTypes, Record<1 | 2 | 3 | 4 | 5, string[]>>;
        return {
            fomeBoosts
        };
    },
    components: { Spacer }
});
</script>

<style scoped>
div>div:nth-child(7n+1) {
    text-align: right;
    width: 100%;
}
div>div:nth-child(7n+2) {
    margin-left: 8px;
}
div>div:nth-child(7n+3) {
    text-align: right;
    width: 100%;
}
div>div:nth-child(7n+4) {
    margin: 0px;
}
div>div:nth-child(7n+5) {
    text-align: left;
    width: 100%;
}
div>div:nth-child(7n+6) {
    margin-right: 8px;
}
div>div:nth-child(7n+7) {
    text-align: left;
    width: 100%;
}
</style>
