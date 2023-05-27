<template>
    <g
        class="boardnode"
        :class="{ [node.type]: true, isSelected, isDraggable, ...classes }"
        :transform="`translate(${position.x},${position.y})${isSelected ? ' scale(1.2)' : ''}`"
    >
        <BoardNodeAction
            :actions="actions ?? []"
            :is-selected="isSelected"
            :node="node"
            :node-type="nodeType"
            :selected-action="selectedAction"
            @click-action="(actionId: string) => emit('clickAction', actionId)"
        />

        <g
            class="node-container"
            @mousedown="mouseDown"
            @touchstart.passive="mouseDown"
            @mouseup="mouseUp"
            @touchend.passive="mouseUp"
        >
            <CircleNode v-if="shape === Shape.Circle"
                :receivingNode="receivingNode"
                :canAccept="canAccept"
                :size="size"
                :progress="progress"
                :progressDisplay="progressDisplay"
                :progressColor="progressColor"
                :backgroundColor="backgroundColor"
                :fillColor="fillColor"
                :outlineColor="outlineColor"
            />
            <DiamondNode v-else-if="shape === Shape.Diamond"
                :receivingNode="receivingNode"
                :canAccept="canAccept"
                :size="size"
                :progress="progress"
                :progressDisplay="progressDisplay"
                :progressColor="progressColor"
                :backgroundColor="backgroundColor"
                :fillColor="fillColor"
                :outlineColor="outlineColor"
            />
            
            <Core v-else-if="shape === Shape.Core"
                :node="node"
                :size="size"
                :placing="root.board.draggingNode.value === node"
            />
            <Router v-else-if="shape === Shape.Router"
                :node="node"
                :size="size"
                :placing="root.board.draggingNode.value === node"
                @place-building="placeBuilding"
            />
            <Extractor v-else-if="shape === Shape.Extractor"
                :node="node"
                :size="size"
                :placing="root.board.draggingNode.value === node"
                @place-building="placeBuilding"
            />
            <Foundry v-else-if="shape === Shape.Foundry"
                :node="node"
                :size="size"
                :placing="root.board.draggingNode.value === node"
                @place-building="placeBuilding"
            />
            <Analyzer v-else-if="shape === Shape.Analyzer"
                :node="node"
                :size="size"
                :placing="root.board.draggingNode.value === node"
                @place-building="placeBuilding"
            />
            <Researcher v-else-if="shape === Shape.Researcher"
                :node="node"
                :size="size"
                :placing="root.board.draggingNode.value === node"
                @place-building="placeBuilding"
            />
            <Bore v-else-if="shape === Shape.Bore"
                :node="node"
                :size="size"
                :placing="root.board.draggingNode.value === node"
                @place-building="placeBuilding"
            />

            <Scrap v-else-if="shape === Shape.Scrap"
                :size="size"
                :canAccept="canAccept"
            />
            
            <ContainmentRing v-else-if="shape === Shape.ContainmentRing"
                :node="node"
                :size="size"
            />


            <text :fill="titleColor" class="node-title">{{ title }}</text>
        </g>

        <transition name="fade" appear>
            <g v-if="label">
                <text
                    :fill="label.color ?? titleColor"
                    class="node-title"
                    :class="{ pulsing: label.pulsing }"
                    :y="-size - 20"
                    >{{ label.text }}
                </text>
            </g>
        </transition>

        <transition name="fade" appear>
            <text
                v-if="isSelected && selectedAction"
                :fill="confirmationLabel.color ?? titleColor"
                class="node-title"
                :class="{ pulsing: confirmationLabel.pulsing }"
                :y="size + 75"
                >{{ confirmationLabel.text }}</text
            >
        </transition>
    </g>
</template>

<script setup lang="ts">
import themes from "data/themes";
import type { BoardNode, GenericBoardNodeAction, GenericNodeType } from "features/boards/board";
import { getNodeProperty, Shape } from "features/boards/board";
import { isVisible } from "features/feature";
import settings from "game/settings";
import { CSSProperties, computed, toRefs, unref, watch } from "vue";
import BoardNodeAction from "./BoardNodeAction.vue";
import CircleNode from "./CircleNode.vue";
import DiamondNode from "./DiamondNode.vue";
import Core from "data/nodes/friendly/Core.vue";
import Router from "data/nodes/friendly/Router.vue";
import Extractor from "data/nodes/friendly/Extractor.vue";
import Foundry from "data/nodes/friendly/Foundry.vue";
import Analyzer from "data/nodes/friendly/Analyzer.vue";
import Researcher from "data/nodes/friendly/Researcher.vue";
import Bore from "data/nodes/friendly/Bore.vue";
import Scrap from "data/nodes/neutral/Scrap.vue";
import ContainmentRing from "data/nodes/hostile/ContainmentRing.vue";
import { root } from "data/projEntry";
import { canPlaceAtPosition, placeNode } from "data/content/nodes";
import { types } from "data/content/types";

const _props = defineProps<{
    node: BoardNode;
    nodeType: GenericNodeType;
    dragging: BoardNode | null;
    dragged?: {
        x: number;
        y: number;
    };
    hasDragged?: boolean;
    receivingNode?: boolean;
    isSelected: boolean;
    selectedAction: GenericBoardNodeAction | null;
}>();
const props = toRefs(_props);
const emit = defineEmits<{
    (e: "mouseDown", event: MouseEvent | TouchEvent, node: BoardNode, isDraggable: boolean): void;
    (e: "endDragging", node: BoardNode): void;
    (e: "clickAction", actionId: string): void;
    (e: "place-building"): void;
}>();

const isDraggable = computed(() =>
    getNodeProperty(props.nodeType.value.draggable, unref(props.node))
);

watch(isDraggable, value => {
    const node = unref(props.node);
    if (unref(props.dragging) === node && !value) {
        emit("endDragging", node);
    }
});

const actions = computed(() => {
    const node = unref(props.node);
    return getNodeProperty(props.nodeType.value.actions, node)?.filter(action =>
        isVisible(getNodeProperty(action.visibility, node))
    );
});

const position = computed(() => {
    const node = unref(props.node);

    if (
        getNodeProperty(props.nodeType.value.draggable, node) &&
        unref(props.dragging)?.id === node.id &&
        unref(props.dragged) != null
    ) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { x, y } = unref(props.dragged)!;
        return {
            x: node.position.x + Math.round(x / 25) * 25,
            y: node.position.y + Math.round(y / 25) * 25
        };
    }
    return node.position;
});

const shape = computed(() => getNodeProperty(props.nodeType.value.shape, unref(props.node)));
const title = computed(() => getNodeProperty(props.nodeType.value.title, unref(props.node)));
const label = computed(
    () =>
        (props.isSelected.value
            ? unref(props.selectedAction) &&
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              getNodeProperty(unref(props.selectedAction)!.tooltip, unref(props.node))
            : null) ?? getNodeProperty(props.nodeType.value.label, unref(props.node))
);
const confirmationLabel = computed(() =>
    getNodeProperty(
        unref(props.selectedAction)?.confirmationLabel ?? {
            text: "Tap again to confirm"
        },
        unref(props.node)
    )
);
const size = computed(() => getNodeProperty(props.nodeType.value.size, unref(props.node)));
const progress = computed(
    () => getNodeProperty(props.nodeType.value.progress, unref(props.node)) ?? 0
);
const backgroundColor = computed(() => themes[settings.theme].variables["--background"]);
const outlineColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.outlineColor, unref(props.node)) ??
        themes[settings.theme].variables["--outline"]
);
const fillColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.fillColor, unref(props.node)) ??
        themes[settings.theme].variables["--raised-background"]
);
const progressColor = computed(() =>
    getNodeProperty(props.nodeType.value.progressColor, unref(props.node))
);
const titleColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.titleColor, unref(props.node)) ??
        themes[settings.theme].variables["--foreground"]
);
const progressDisplay = computed(() =>
    getNodeProperty(props.nodeType.value.progressDisplay, unref(props.node))
);
const canAccept = computed(
    () =>
        props.dragging.value != null &&
        unref(props.hasDragged) &&
        getNodeProperty(props.nodeType.value.canAccept, unref(props.node), props.dragging.value)
);
const style = computed(() => getNodeProperty(props.nodeType.value.style, unref(props.node)));
const classes = computed(() => getNodeProperty(props.nodeType.value.classes, unref(props.node)));

function mouseDown(e: MouseEvent | TouchEvent) {
    emit("mouseDown", e, props.node.value, isDraggable.value);
}

function mouseUp(e: MouseEvent | TouchEvent) {
    if (!props.hasDragged?.value) {
        emit("endDragging", props.node.value);
        props.nodeType.value.onClick?.(props.node.value);
        e.stopPropagation();
    }
}

function placeBuilding(node: BoardNode) {
    const building = getNodeProperty(types[node.type].building, node);
    if (building !== undefined) {
        if (building.buildableOn !== undefined) {
            return;   
        }
    }
    if (!canPlaceAtPosition(node)) return;
    placeNode(node);
    
    root.board.draggingNode.value = null;
    emit("place-building");
}
</script>

<style scoped>
.boardnode {
    cursor: pointer;
    transition-duration: 0s;
}

.node-title {
    text-anchor: middle;
    font-family: monospace;
    font-size: 100%;
    pointer-events: none;
    filter: drop-shadow(3px 3px 2px var(--tooltip-background));
}

.pulsing {
    animation: pulsing 2s ease-in infinite;
}

@keyframes pulsing {
    0% {
        opacity: 0.25;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.25;
    }
}
</style>

<style>
.grow-enter-from .node-container,
.grow-leave-to .node-container {
    transform: scale(0);
}
</style>
