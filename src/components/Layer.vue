<template>
    <ErrorVue v-if="errors.length > 0" :errors="errors" />
    <div class="layer-container" :style="theme as StyleValue" v-bind="$attrs" v-else>
        <div class="layer-tab">
            <Context @update-nodes="updateNodes">
                <Component />
            </Context>
        </div>
    </div>
</template>

<script setup lang="ts">
import { type FeatureNode } from "game/layers";
import { safeStringify } from "util/common";
import { MaybeGetter } from "util/computed";
import { render, Renderable } from "util/vue";
import { MaybeRef, onErrorCaptured, Ref, ref, StyleValue } from "vue";
import Context from "./Context.vue";
import ErrorVue from "./Error.vue";
import { LayerTheme } from "data/themes";

const props = defineProps<{
    display: MaybeGetter<Renderable>;
    name?: MaybeRef<string>;
    theme: LayerTheme;
    nodes: Ref<Record<string, FeatureNode | undefined>>;
    index: number;
}>();

const Component = () => render(props.display);

function updateNodes(nodes: Record<string, FeatureNode | undefined>) {
    props.nodes.value = nodes;
}

const errors = ref<Error[]>([]);
onErrorCaptured((err, instance, info) => {
    console.warn(`Error caught in "${props.name}" layer`, err, instance, info);
    errors.value.push(
        err instanceof Error ? (err as Error) : new Error(safeStringify(err))
    );
    return false;
});
</script>

<style scoped>
.layer-container {
    min-width: 100%;
    min-height: 100%;
    margin: 0;
    flex-grow: 1;
    display: flex;
    isolation: isolate;
}

.layer-tab {
    padding-top: 20px;
    padding-bottom: 20px;
    min-height: 100%;
    flex-grow: 1;
    text-align: center;
    position: relative;
}

.inner-tab > .layer-container > .layer-tab {
    margin: -50px -10px;
    padding: 50px 10px 25px 10px;
}

.modal-body .layer-tab {
    padding-bottom: 0;
}

.modal-body .layer-tab:not(.hasSubtabs) {
    padding-top: 0;
}

.goBack {
    position: sticky;
    top: 10px;
    left: 10px;
    line-height: 30px;
    margin-top: -50px;
    margin-left: -35px;
    border: none;
    background: var(--background);
    box-shadow: var(--background) 0 2px 3px 5px;
    border-radius: 50%;
    color: var(--foreground);
    font-size: 30px;
    cursor: pointer;
    z-index: 7;
}

.goBack:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--foreground);
}
</style>
