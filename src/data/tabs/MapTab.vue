<template>
    <div class="map-tab">
        <div class="research-tab"><h3>Research Tab</h3></div>
        <div class="map-column">
            <slot />
            <BuildTab />
        </div>
        <ResourceTab />
    </div>
</template>

<script setup lang="ts">
import BuildTab from './BuildTab.vue';
import ResourceTab from './ResourceTab.vue';
</script>

<style scoped>
.map-tab {
    --border-thickness: 4px;
    --text-padding: 2px;
    display: grid;
    grid-template-columns: 300px 1fr 300px;
    height: 100%;
}

.map-column {
    display: grid;
    grid-template-rows: 1fr 225px;
    width: 100%;
    height: 100%;
}

.research-tab {
    background: var(--locked);
    border-right: solid var(--border-thickness);
    width: calc(100% - var(--border-thickness));
    height: 100%;
}

h3 {
    position: relative;
    top: var(--text-padding);
}
</style>