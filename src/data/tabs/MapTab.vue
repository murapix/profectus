<template>
    <div class="map-tab">
        <BuildTab />
        <div class="map-column">
            <slot />
            <ResearchTab />
        </div>
        <ResourceTab />
    </div>
</template>

<script setup lang="ts">
import BuildTab from './BuildTab.vue';
import ResourceTab from './ResourceTab.vue';
import ResearchTab from './ResearchTab.vue';
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
    border-top: solid var(--border-thickness);
    width: 100%;
    height: calc(100% - var(--border-thickness));
}

h3 {
    position: relative;
    top: var(--text-padding);
}
</style>