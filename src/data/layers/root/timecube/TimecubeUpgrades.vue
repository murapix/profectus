<template>
    <div class="timecube row" v-for="row in joined">
        <template v-for="upgrade in row">
            <component :is="render(unref(upgrade).upgrade)" :classes="unref(upgrade).classes"/>
        </template>
    </div>
</template>

<script lang="ts">
import { Visibility } from 'features/feature';
import { GenericUpgrade } from 'features/upgrades/upgrade';
import { processedPropType, render, unwrapRef } from 'util/vue';
import { computed, defineComponent, toRefs, unref } from 'vue';

export default defineComponent({
    props: {
        upgrades: {
            type: processedPropType<GenericUpgrade[]>(Array),
            required: true
        }
    },
    setup(props) {
        const { upgrades } = toRefs(props);

        const rows: GenericUpgrade[][] = [];
        unwrapRef(upgrades).forEach((upgrade, index) => {
            const rowIndex = ~~(index/5);
            const row = rows[rowIndex] ?? [];
            row.push(upgrade);
            rows[rowIndex] = row;
        })

        const left = rows.map(row => row.map((_, index) => {
            if (index === 0) return false;
            return computed(() => unref(row[index-1].visibility) === Visibility.Visible);
        }))
        const right = rows.map(row => row.map((_, index) => {
            if (index >= row.length-1) return false;
            return computed(() => unref(row[index+1].visibility) === Visibility.Visible);
        }));

        const visibleCounts = rows.map(row => computed(() => row.filter(upgrade => unref(upgrade.visibility) === Visibility.Visible).length));
        const top = rows.map((row, index) => {
            const result = index === 0 ? false : unref(visibleCounts[index]) <= unref(visibleCounts[index-1]);
            return row.map(() => result);
        });
        const bottom = rows.map((row, index) => {
            const result = index >= rows.length-1 ? false : unref(visibleCounts[index]) <= unref(visibleCounts[index+1]);
            return row.map(() => result);
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

        return {
            joined,

            render,
            unref
        }
    }
})
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