<template>
    <ErrorVue v-if="errors.length > 0" :errors="errors" />
    <div class="layer-container" :style="{ '--layer-color': unref(color) }" v-bind="$attrs" v-else>
        <button v-if="showGoBack" class="goBack" @click="goBack">❌</button>

        <div class="layer-tab" :class="{ showGoBack }" v-else>
            <Context @update-nodes="updateNodes">
                <component :is="component" />
            </Context>
        </div>
    </div>
</template>

<script lang="ts">
import projInfo from "data/projInfo.json";
import type { CoercableComponent } from "features/feature";
import type { FeatureNode } from "game/layers";
import player from "game/player";
import { computeComponent, computeOptionalComponent, processedPropType, unwrapRef } from "util/vue";
import { PropType, Ref, computed, defineComponent, onErrorCaptured, ref, toRefs, unref } from "vue";
import Context from "./Context.vue";
import ErrorVue from "./Error.vue";

export default defineComponent({
    components: { Context, ErrorVue },
    props: {
        index: {
            type: Number,
            required: true
        },
        display: {
            type: processedPropType<CoercableComponent>(Object, String, Function),
            required: true
        },
        name: {
            type: processedPropType<string>(String),
            required: true
        },
        color: processedPropType<string>(String),
        nodes: {
            type: Object as PropType<Ref<Record<string, FeatureNode | undefined>>>,
            required: true
        }
    },
    emits: ["setMinimized"],
    setup(props) {
        const { display, index } = toRefs(props);

        const component = computeComponent(display);
        const showGoBack = computed(
            () => projInfo.allowGoBack && index.value > 0
        );

        function goBack() {
            player.tabs.splice(unref(props.index), Infinity);
        }

        function updateNodes(nodes: Record<string, FeatureNode | undefined>) {
            props.nodes.value = nodes;
        }

        const errors = ref<Error[]>([]);
        onErrorCaptured((err, instance, info) => {
            console.warn(`Error caught in "${props.name}" layer`, err, instance, info);
            errors.value.push(
                err instanceof Error ? (err as Error) : new Error(JSON.stringify(err))
            );
            return false;
        });

        return {
            component,
            showGoBack,
            updateNodes,
            unref,
            goBack,
            errors
        };
    }
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
    padding-top: 50px;
}

.inner-tab > .layer-container > .layer-tab {
    margin: -50px -10px;
    padding: 50px 10px;
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
