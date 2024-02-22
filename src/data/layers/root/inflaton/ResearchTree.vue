<template>
    <div class="container">
        <div class="row research-tree">
            <Spacer width="30px" />
                <div class="col">
                    <Spacer height="30px" />
                    <Row v-for="row in research">
                        <template v-for="node in row">
                            <component v-if="isVisible(node.visibility)" :is="render(node)" />
                        </template>
                    </Row>
                    <Spacer height="30px" />
                    <Links :links="unref(links)" />
                </div>
            <Spacer width="30px" />
        </div>
        <div class="fade" />
    </div>
</template>

<script setup lang="ts">
import Row from 'components/layout/Row.vue';
import Spacer from 'components/layout/Spacer.vue';
import { isVisible } from 'features/feature';
import { Link } from 'features/links/links';
import Links from 'features/links/Links.vue';
import { render } from 'util/vue';
import { computed, ComputedRef, unref } from 'vue';
import { GenericResearch } from './research';

const props = defineProps<{
    research: GenericResearch[][];
}>();

const links: ComputedRef<Link[]> = computed(() => 
        props.research.flatMap(row => row)
                      .flatMap(node => node.prerequisites
                        ?.map(prerequisite => ({
                            startNode: { id: node.id },
                            endNode: { id: prerequisite.id },
                            stroke: !isVisible(node.visibility)
                                    ? 'var(--locked)'
                                    : unref(prerequisite.researched)
                                        ? 'var(--feature-background)'
                                        : 'white',
                                    'stroke-width': '5px'
                            }))
                      ?? [])
);
</script>

<style scoped>
.container {
    position: relative;
    margin: 0;
    width: fit-content;
    align-items: center;
    --scrollbar-width: 10px;
}

.research-tree {
    overflow-x: clip;
    overflow-y: auto;
    max-height: 65vh;
    width: fit-content;
    position: relative;
    margin: 0;
}

.col {
    position: relative;
}

.fade::after {
    content: "";
    z-index: 1;
    pointer-events: none;
    background-image: linear-gradient(to bottom, var(--background), var(--transparent) 30px, var(--transparent) calc(100% - 30px), var(--background));
    width: calc(100% - var(--scrollbar-width));
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
}

.research-tree::-webkit-scrollbar {
    width: var(--scrollbar-width);
    z-index: 2;
}

.research-tree::-webkit-scrollbar-track {
    border: solid white 2px;
    border-radius: 10px;
    background: var(--background);
}

.research-tree::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: white;
    z-index: 2;
}
.research-tree :deep(.table + .table) {
    margin: 0;
}
.research-tree :deep(button) {
    margin: 20px;
}


</style>