<template>
    <div style="display: grid; gridTemplateColumns: repeat(7, auto); width: fit-content; margin: auto">
        <template v-for="(fomeBoosts, key) in boosts" :key="key">
            <Spacer :num-labels="7" v-for="n in 7" :key="n" />
            <template v-for="(boost, index) in fomeBoosts" :key="key + '-' + index">
                <template v-if="Decimal.gt(unref(fome[key].boosts[index].total), 0)">
                    <div>{{ fome[key].amount.displayName.split(" ")[0] }} Boost {{ index }}</div>
                    <div>[</div>
                    <div>{{ formatWhole(unref(fome[key].boosts[index].amount)) }}</div>
                    <template v-if="Decimal.gt(unref(fome[key].boosts[index].bonus ?? 0), 0)">
                        <div>+</div>
                        <div>{{ format(unref(fome[key].boosts[index].bonus ?? 0)) }}</div>
                    </template>
                    <template v-else>
                        <div />
                        <div />
                    </template>
                    <div>]:</div>
                    <div>{{ boost }}</div>
                </template>
                <template v-else>
                    <div :num-labels="7" v-for="n in 7" :key="n" />
                </template>
            </template>
        </template>
    </div>
</template>

<script lang="ts">
import Spacer from "components/layout/Spacer.vue";
import { defineComponent, unref } from "vue";
import fome, { FomeTypes } from "./fome";
import { CoercableComponent } from "features/feature";
import Decimal, { format, formatWhole } from "util/break_eternity";

export default defineComponent({
    setup() {
        const boosts = Object.fromEntries(Object.values(FomeTypes).map(fomeType => 
            [fomeType, Object.fromEntries(
                Object.values([1,2,3,4,5]).map(id => 
                    [id, unref(fome[fomeType].boosts[id as 1|2|3|4|5].display)]
                )
            )]
        )) as Record<FomeTypes, Record<1|2|3|4|5, CoercableComponent>>;

        return {
            fome,
            boosts,

            unref,
            format,
            formatWhole,
            Decimal
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
