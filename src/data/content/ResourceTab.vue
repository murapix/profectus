<template>
    <div id="research-tab">
        <h3>Materials</h3>
        <template v-for="data, resource of resources" :key="resource">
            <div v-if="isVisible((data as ResourceDisplay).visibility ?? true)" :style="{color: (data as ResourceDisplay).color ?? 'var(--feature-foreground)'}">
                <div>{{ data.name }}:</div>
                <div>{{ formatWhole(amounts[resource]!) }}</div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { isVisible } from 'features/feature';
import { ResourceDisplay, amounts, resources } from './resources';
import { formatWhole } from 'util/break_eternity';
</script>

<style scoped>
#research-tab {
    width: calc(100% - var(--border-radius));
    height: 100%;
    border: 0;
    border-left: solid var(--border-radius);
    background: var(--locked);
}

#research-tab > div {
    display: flex;
    flex-flow: row nowrap;
    width: 100%;
}

#research-tab > :first-child {
    margin-top: var(--text-padding);
}

#research-tab > div > :first-child {
    margin-left: var(--text-padding);
}

#research-tab > div > :last-child {
    margin-right: var(--text-padding);
}
</style>