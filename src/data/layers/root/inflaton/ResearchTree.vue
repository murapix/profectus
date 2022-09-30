<template>
    <div class="container">
        <div class="row research-tree">
            <Spacer width="30px" />
                <div class="col">
                    <Spacer height="30px" />
                    <Row v-for="row in nodes">
                        <template v-for="research in row">
                            <component v-if="research" :is="render(research)" />
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

<script lang="ts">
import { computed, ComputedRef, defineComponent, toRefs, unref } from 'vue';
import Row from 'components/layout/Row.vue';
import { processedPropType, render, unwrapRef } from 'util/vue';
import { GenericResearch } from './research';
import Links from 'features/links/Links.vue';
import { Link } from 'features/links/links';
import Spacer from 'components/layout/Spacer.vue';
import Column from 'components/layout/Column.vue';
import { Visibility } from 'features/feature';

export default defineComponent({
    props: {
        research: {
            type: processedPropType<{[key in string]: GenericResearch}>(Object),
            required: true
        }
    },
    setup(props) {
        const { research } = toRefs(props);

        const nodes: GenericResearch[][] = [];
        Object.values(unwrapRef(research)).forEach(research => {
            let [row, col] = research.position ?? [-1,-1];
            (nodes[row] ??= [])[col] = research;
        });

        const links: ComputedRef<Link[]> = computed(() => Object.values(unwrapRef(research))
            .flatMap(research => research.requirements
                ?.map(requirement => ({
                    startNode: { id: research.id },
                    endNode: { id: requirement.id },
                    stroke: unref(research.visibility) === Visibility.None
                                ? 'var(--locked)'
                                : unref(requirement.researched)
                                    ? 'var(--layer-color)'
                                    : 'white',
                    'stroke-width': '5px'
                }))
                ?? []))

        return {
            nodes,
            links,

            render,
            unref
        }
    },
    components: { Row, Links, Spacer, Column }
})
</script>

<style scoped>
.container {
    position: relative;
    margin: 0 auto;
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
    background-image: linear-gradient(to bottom, var(--background), #0000 30px, #0000 calc(100% - 30px), var(--background));
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