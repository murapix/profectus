<template>
    <div class="build-tab">
        <h3>Buildings</h3>
        <Spacer />
        <div class="build-row">
            <div class="build-column">
                <span>{{ FactoryNodeType.Extractor }}</span>
                <svg width="150px" height="150px" viewBox="-100 -100 200 200">
                    <BoardNode 
                        :node="{
                            id: -1,
                            position: { x: 0, y: 0 },
                            type: FactoryNodeType.Extractor
                        }"
                        :nodeType="factory.board.types[FactoryNodeType.Extractor]"
                        :dragging="null"
                        :isSelected="false"
                        :selectedAction="null"
                    />
                </svg>
            </div>
            <div class="build-column">
                <span>{{ FactoryNodeType.Router }}</span>
                <svg width="150px" height="150px" viewBox="-100 -100 200 200">
                    <Router />
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import BoardNode from 'features/boards/BoardNode.vue';
import { FactoryNodeType } from 'data/content/types';
import factory from "./factory";
import Spacer from 'components/layout/Spacer.vue';
import Router from 'data/nodes/Router.vue';
</script>

<style scoped>
.build-tab {
    height: calc(100% - var(--border-thickness));
    width: 100%;
    border-top: solid var(--border-thickness);
    background: var(--locked);
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