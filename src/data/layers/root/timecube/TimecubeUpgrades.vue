<template>
    <div class="timecube row" v-for="row in joined">
        <template v-for="upgrade in row">
            <component :is="render(unref(upgrade).upgrade)" :classes="unref(upgrade).classes"/>
        </template>
    </div>
</template>

<script setup lang="ts">
import { Visibility, isVisible } from 'features/feature';
import { GenericUpgrade } from 'features/upgrades/upgrade';
import { render } from 'util/vue';
import { computed, unref } from 'vue';

const props = defineProps<{
    upgrades: GenericUpgrade[]
}>();

const rows: GenericUpgrade[][] = [];
for (let i = 0; i < unref(props.upgrades).length; i += 5) {
    rows.push([]);
}
let row = 0;
for (const upgrade of unref(props.upgrades)) {
    rows[row].push(upgrade);
    if (rows[row].length >= 5) row++;
}

const left = rows.map(row => row.map((_, index) => {
    if (index === 0) return false;
    return computed(() => isVisible(row[index-1].visibility));
}));
const right = rows.map(row => row.map((_, index) => {
    if (index >= row.length-1) return false;
    return computed(() => isVisible(row[index+1].visibility));
}));

const visibleCounts = rows.map(row => computed(() => row.filter(upgrade => isVisible(upgrade.visibility)).length));
const top = rows.map((row, index) => {
    return row.map(() => computed(() => index === 0 ? false : unref(visibleCounts[index]) <= unref(visibleCounts[index-1])));
});
const bottom = rows.map((row, index) => {
    return row.map(() => computed(() => index >= rows.length-1 ? false : unref(visibleCounts[index]) <= unref(visibleCounts[index+1])));
});

const joined = rows.map((row, rowIndex) => row.map((upgrade, upgradeIndex) => computed(() => ({
    upgrade,
    classes: {
        left: unref(left[rowIndex][upgradeIndex]),
        right: unref(right[rowIndex][upgradeIndex]),
        top: unref(top[rowIndex][upgradeIndex]),
        bottom: unref(bottom[rowIndex][upgradeIndex])
    }
}))));

</script>

<style scoped>
.timecube.row > button {
    margin: 0;
    min-height: 150px;
    width: 150px;
}

.timecube.row > button.left {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

.timecube.row > button.right {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.timecube.row > button.top {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.timecube.row > button.bottom {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}
</style>