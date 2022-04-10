<template>
    <template v-for="(boosts, key) in fomeBoosts" :key="key">
        <Spacer />
        <template v-for="(boost, index) in boosts" :key="key + '-' + index">
            <div>{{ boost }}</div>
        </template>
    </template>
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
        ) as Record<FomeTypes, Record<1 | 2 | 3 | 4 | 5, string>>;
        return {
            fomeBoosts
        };
    },
    components: { Spacer }
});
</script>

<style scoped></style>
