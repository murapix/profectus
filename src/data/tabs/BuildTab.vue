<template>
    <div class="build-tab">
        <h3>Buildings</h3>
        <Spacer />
        <div class="scroll">
            <div class="build-row">
                <div class="build-column">
                    <span>{{ BoardNodeType.Extractor }}</span>
                    <svg width="150px" height="150px" viewBox="-40 -40 80 80">
                        <Extractor />
                    </svg>
                </div>
                <div class="build-column">
                    <span>{{ BoardNodeType.Router }}</span>
                    <svg width="150px" height="150px" viewBox="-40 -40 80 80">
                        <Router />
                    </svg>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { BoardNodeType } from 'data/content/types';
import Spacer from 'components/layout/Spacer.vue';
import Router from 'data/nodes/Router.vue';
import Extractor from 'data/nodes/Extractor.vue';
</script>

<style scoped>
.build-tab {
    height: calc(100% - var(--border-thickness));
    width: 100%;
    border-top: solid var(--border-thickness);
    background: var(--locked);
}

.scroll {
    overflow-y: auto;
    height: calc(100% - 38px);
    margin-left: var(--border-thickness);
    margin-right: var(--border-thickness);
}

.scroll::-webkit-scrollbar {
    width: var(--border-thickness);
}

.scroll::-webkit-scrollbar-track {
    background: var(--foreground);
}

.scroll::-webkit-scrollbar-thumb {
    background: var(--accent1);
}

.scroll::-webkit-scrollbar-thumb:hover {
    background: var(--feature-foreground);
}

.build-row {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    align-items: stretch;
    max-width: 100%;
}

.build-column {
    position: relative;
    margin-left: 15px;
    margin-right: 15px;
}

.build-column > span {
    position: absolute;
    left: 0;
    right: 0;
}

span {
    color: var(--feature-foreground);
}

</style>