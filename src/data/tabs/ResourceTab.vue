<template>
    <div id="research-tab">
        <h3>Materials</h3>
        <template v-for="data, resource of resources" :key="resource">
            <div v-if="isVisible((data as ResourceDisplay).visibility ?? true)" :style="{color: (data as ResourceDisplay).color ?? 'var(--feature-foreground)'}">
                <div><component :is="coerceComponent(data.symbol)"/></div>
                <div><component :is="coerceComponent(data.name)"/>:</div>
                <div>{{ formatWhole(amounts[resource]!) }}</div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { isVisible } from 'features/feature';
import { ResourceDisplay, amounts, resources } from '../content/resources';
import { formatWhole } from 'util/break_eternity';
import { coerceComponent } from 'util/vue';
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
    display: grid;
    grid-template-columns: 20px 1fr auto;
    width: 100%;
}

#research-tab > :first-child {
    position: relative;
    top: var(--text-padding);
}

#research-tab > div > :first-child {
    user-select: none;
}

#research-tab > div > :not(:first-child, :last-child) {
    margin-left: var(--text-padding);
}

#research-tab > div > :last-child {
    margin-right: var(--text-padding);
}

#research-tab > div > * > * {
    margin: 0;
}
</style>