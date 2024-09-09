<template>
    <div class="totals">
        <div>Passive Bonuses</div>
        <div class="break" />
        <table>
            <template v-for="side in Sides">
                <tr>
                    <td>{{ descriptions[side] }}</td>
                    <td>×{{ format(unref(buffs[side])) }}</td>
                    <td>(</td>
                    <td>{{ format(unref(scores[side])) }}</td>
                    <td>)</td>
                    <td>{{ names[side] }}</td>
                </tr>
            </template>
        </table>
    </div>
</template>

<script setup lang="tsx">
import Decimal, { format } from 'util/break_eternity';
import { ComputedRef, unref } from 'vue';
import { Sides } from './timesquares';

defineProps<{
    scores: Record<Sides, ComputedRef<Decimal>>;
    buffs: Record<Sides, ComputedRef<Decimal>>;
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

td:nth-child(4) {
    padding: 0;
    text-align: center;
}

.break {
    margin: 8px 0;
    height: 5px;
    background: linear-gradient(to right, var(--transparent), var(--raised-background), var(--transparent));
}
</style>