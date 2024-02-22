<template>
    <div class="totals">
        <div>Active Penalties</div>
        <div class="break" />
        <table>
            <template v-for="side in Sides">
                <tr>
                    <td>{{ names[side] }}</td>
                    <td>/{{ formatWhole(unref(activeNerfs[side])) }}</td>
                    <td>→</td>
                    <td>/{{ formatWhole(unref(nextNerfs[side])) }}</td>
                    <td>{{ descriptions[side] }}</td>
                </tr>
            </template>
        </table>
    </div>
</template>

<script setup lang="tsx">
import { unref, ComputedRef } from 'vue';
import { Sides } from './timesquares';
import { DecimalSource } from 'util/bignum';
import { formatWhole } from 'util/break_eternity';

defineProps<{
    activeNerfs: Record<Sides, ComputedRef<DecimalSource>>;
    nextNerfs: Record<Sides, ComputedRef<DecimalSource>>;
}>();

const names = Object.fromEntries(
    Object.values(Sides).map(
        side => [side, side[0].toUpperCase() + side.slice(1)]
    )
) as Record<Sides, string>;

const descriptions: Record<Sides, string> = {
    [Sides.FRONT]: 'Time Cube Gain',
    [Sides.RIGHT]: 'Foam Gain',
    [Sides.TOP]: 'Universe Size',
    [Sides.BACK]: 'Time Speed',
    [Sides.LEFT]: 'Entropic Loop Effects',
    [Sides.BOTTOM]: 'Pion and Spinor Gain'
}
</script>

<style scoped>
.totals {
    display: block;
    margin: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

td {
    font-size: 14px;
    text-align: left;
    padding: 2px 4px;
}

td:nth-child(1), td:nth-child(2) {
    text-align: right;
}

td:first-child {
    border-right: solid var(--raised-background) 3px;
}

td:last-child {
    border-left: solid var(--raised-background) 3px;
}

.break {
    margin: 8px 0;
    height: 5px;
    background: linear-gradient(to right, var(--transparent), var(--raised-background), var(--transparent));
}
</style>