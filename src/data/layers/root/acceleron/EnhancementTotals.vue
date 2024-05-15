<template>
    <div class="totals">
        <div>Current Bonuses</div>
        <div class="break" />
        <table>
            <tr v-if="Decimal.neq(effects.counts[1].value, defaults.counts[1])">
                <td>1st Row Enhancements:</td>
                <td>+{{ formatWhole(effects.counts[1].value) }}</td>
            </tr>
            <tr v-if="Decimal.neq(effects.counts[2].value, defaults.counts[2])">
                <td>2nd Row Enhancements:</td>
                <td>+{{ formatWhole(effects.counts[2].value) }}</td>
            </tr>
            <tr v-if="Decimal.neq(effects.counts[3].value, defaults.counts[3])">
                <td>3rd Row Enhancements:</td>
                <td>+{{ formatWhole(effects.counts[3].value) }}</td>
            </tr>
            <tr v-if="Decimal.neq(effects.counts[4].value, defaults.counts[4])">
                <td>4th Row Enhancements:</td>
                <td>+{{ formatWhole(effects.counts[4].value) }}</td>
            </tr>
            <tr class="break" v-if="breaks.counts.value"><td /><td /></tr>
            <tr v-if="Decimal.neq(effects.time.value, defaults.time)">
                <td>Time Speed</td>
                <td>×{{ format(effects.time.value) }}</td>
            </tr>
            <tr class="break" v-if="breaks.time.value"><td /><td /></tr>
            <tr v-if="Decimal.neq(effects.loops.buildSpeed.value, defaults.loops.buildSpeed)">
                <td>Loop Build Speed</td>
                <td>×{{ format(effects.loops.buildSpeed.value) }}</td>
            </tr>
            <tr v-if="Decimal.neq(effects.loops.buildCost.value, defaults.loops.buildCost)">
                <td>Loop Build Cost</td>
                <td>×{{ formatSmall(effects.loops.buildCost.value) }}</td>
            </tr>
            <tr class="break" v-if="breaks.loops.value"><td /><td /></tr>
            <tr v-if="Decimal.neq(effects.skyrmion.value, defaults.skyrmion)">
                <td>Skyrmion Cost</td>
                <td>/{{ formatWhole(effects.skyrmion.value) }}</td>
            </tr>
            <tr class="break" v-if="breaks.skyrmion.value"><td /><td /></tr>
            <tr v-if="Decimal.neq(effects.loops[2].value, defaults.loops[2])">
                <td>2nd Loop's Effect</td>
                <td>+{{ format(effects.loops[2].value) }} minutes</td>
            </tr>
            <tr v-if="Decimal.neq(effects.fome.all.value, defaults.fome.all)">
                <td>All Foam Gain</td>
                <td>×{{ format(effects.fome.all.value) }}</td>
            </tr>
            <tr v-if="Decimal.neq(effects.fome[FomeTypes.infinitesimal].value, defaults.fome[FomeTypes.infinitesimal])">
                <td>Infinitesimal Foam Gain</td>
                <td>×{{ format(effects.fome[FomeTypes.infinitesimal].value) }}</td>
            </tr>
            <tr v-if="Decimal.neq(effects.fome[FomeTypes.subspatial].value, defaults.fome[FomeTypes.subspatial])">
                <td>Subspatial Foam Gain</td>
                <td>×{{ format(effects.fome[FomeTypes.subspatial].value) }}</td>
            </tr>
            <tr v-if="Decimal.neq(effects.fome[FomeTypes.subplanck].value, defaults.fome[FomeTypes.subplanck])">
                <td>Subplanck Foam Gain</td>
                <td>×{{ format(effects.fome[FomeTypes.subplanck].value) }}</td>
            </tr>
            <tr v-if="Decimal.neq(effects.fome.boosts.value, defaults.fome.boosts)">
                <td>Free Foam Boosts</td>
                <td>+{{ format(effects.fome.boosts.value, 1) }}</td>
            </tr>
            <tr class="break" v-if="breaks.fome.value"><td /><td /></tr>
            <tr v-if="Decimal.neq(effects.loops[1].value, defaults.loops[1])">
                <td>1st Loop's Effect</td>
                <td>+{{ format(Decimal.times(effects.loops[1].value, 100), 1) }}%</td>
            </tr>
            <tr v-if="Decimal.neq(effects.acceleron.value, defaults.acceleron)">
                <td>Acceleron Cost</td>
                <td>/{{ format(effects.acceleron.value) }}</td>
            </tr>
            <tr class="break" v-if="breaks.acceleron.value"><td /><td /></tr>
            <tr v-if="Decimal.neq(effects.timecube.value, defaults.timecube)">
                <td>Timecube Gain</td>
                <td>×{{ format(effects.timecube.value) }}</td>
            </tr>
        </table>
    </div>
</template>

<script setup lang="tsx">
import { getUpgradeEffect } from 'features/upgrades/upgrade';
import { DecimalSource } from 'util/bignum';
import Decimal, { format, formatSmall, formatWhole } from 'util/break_eternity';
import { ComputedRef, computed, unref } from 'vue';
import { FomeTypes } from '../fome/fome';
import entropy from './entropy';

const enhancements = entropy.enhancements;

const defaults = {
    counts: {
        1: 0,
        2: 0,
        3: 0,
        4: 0
    },
    time: 1,
    loops: {
        1: 0,
        2: 0,
        buildSpeed: 1,
        buildCost: 1
    },
    skyrmion: 1,
    fome: {
        all: 1,
        [FomeTypes.infinitesimal]: 1,
        [FomeTypes.subspatial]: 1,
        [FomeTypes.subplanck]: 1,
        boosts: 0
    },
    acceleron: 1,
    timecube: 1
}

const effects = {
    counts: {
        1: computed(() => 0),
        2: computed(() => unref(enhancements.entrenchment.bought) ? 1 : 0),
        3: computed(() => 0),
        4: computed(() => 0)
    },
    time: computed(() => getUpgradeEffect(enhancements.dilation)),
    loops: {
        1: computed(() => getUpgradeEffect<DecimalSource>(enhancements.acceleration, 0)),
        2: computed(() => getUpgradeEffect<DecimalSource>(enhancements.expansion, 0)),
        buildSpeed: computed(() => getUpgradeEffect(enhancements.construction)),
        buildCost: computed(() => getUpgradeEffect(enhancements.development))
    },
    skyrmion: computed(() => Decimal.reciprocate(getUpgradeEffect(enhancements.amplification))),
    fome: {
        all: computed(() => getUpgradeEffect(enhancements.formation)),
        [FomeTypes.infinitesimal]: computed(() => getUpgradeEffect(enhancements.extension)),
        [FomeTypes.subspatial]: computed(() => getUpgradeEffect(enhancements.configuration)),
        [FomeTypes.subplanck]: computed(() => getUpgradeEffect(enhancements.invention)),
        boosts: computed(() => getUpgradeEffect<DecimalSource>(enhancements.entitlement, 0))
    },
    acceleron: computed(() => new Decimal(getUpgradeEffect(enhancements.contraction))
                                    .times(getUpgradeEffect(enhancements.inversion))
                                    .times(getUpgradeEffect(enhancements.rotation))),
    timecube: computed(() => getUpgradeEffect(enhancements.tesselation))
}

const sections = {
    counts: computed(() => ([[effects.counts[1], defaults.counts[1]],
                             [effects.counts[2], defaults.counts[2]],
                             [effects.counts[3], defaults.counts[3]],
                             [effects.counts[4], defaults.counts[4]]] as [ComputedRef<DecimalSource>, number][])
                            .map(([effect, value]) => Decimal.neq(effect.value, value)).some(equals => equals)),
    time: computed(() => Decimal.neq(effects.time.value, defaults.time)),
    loops: computed(() => ([[effects.loops.buildSpeed, defaults.loops.buildSpeed],
                            [effects.loops.buildCost, defaults.loops.buildCost]] as [ComputedRef<DecimalSource>, number][])
                            .map(([effect, value]) => Decimal.neq(effect.value, value)).some(equals => equals)),
    skyrmion: computed(() => Decimal.neq(effects.skyrmion.value, defaults.skyrmion)),
    fome: computed(() => ([[effects.loops[2], defaults.loops[2]],
                           [effects.fome.all, defaults.fome.all],
                           [effects.fome[FomeTypes.infinitesimal], defaults.fome[FomeTypes.infinitesimal]],
                           [effects.fome[FomeTypes.subspatial], defaults.fome[FomeTypes.subspatial]],
                           [effects.fome[FomeTypes.subplanck], defaults.fome[FomeTypes.subplanck]],
                           [effects.fome.boosts, defaults.fome.boosts]] as [ComputedRef<DecimalSource>, number][])
                            .map(([effect, value]) => Decimal.neq(effect.value, value)).some(equals => equals)),
    acceleron: computed(() => ([[effects.loops[1], defaults.loops[1]],
                                [effects.acceleron, defaults.acceleron]] as [ComputedRef<DecimalSource>, number][])
                                .map(([effect, value]) => Decimal.neq(effect.value, value)).some(equals => equals)),
    timecube: computed(() => Decimal.neq(effects.timecube.value, defaults.timecube))
}

const breaks = {
    counts: computed(() => sections.counts.value && ['time', 'loops', 'skyrmion', 'fome', 'acceleron', 'timecube'].some(key => sections[key as keyof typeof sections].value)),
    time: computed(() => sections.time.value && ['loops', 'skyrmion', 'fome', 'acceleron', 'timecube'].some(key => sections[key as keyof typeof sections].value)),
    loops: computed(() => sections.loops.value && ['skyrmion', 'fome', 'acceleron', 'timecube'].some(key => sections[key as keyof typeof sections].value)),
    skyrmion: computed(() => sections.skyrmion.value && ['fome', 'acceleron', 'timecube'].some(key => sections[key as keyof typeof sections].value)),
    fome: computed(() => sections.fome.value && ['acceleron', 'timecube'].some(key => sections[key as keyof typeof sections].value)),
    acceleron: computed(() => sections.acceleron.value && ['timecube'].some(key => sections[key as keyof typeof sections].value))
}
</script>

<style scoped>
.totals {
    display: block;
    width: 365px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

td {
    font-size: 14px;
}

td:first-child {
    text-align: left;
}

td:last-child {
    text-align: right;
}

.break {
    margin: 8px 0;
    height: 5px;
    width: 365px;
    background: linear-gradient(to right, var(--transparent), var(--raised-background), var(--transparent))
}
</style>