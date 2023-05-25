<template>
    <panZoom
        v-if="isVisible(visibility)"
        :style="[
            {
                width,
                height
            },
            style
        ]"
        :class="classes"
        selector=".g1"
        :options="{ initialZoom: 1, minZoom: 0.5, maxZoom: 5, zoomDoubleClickSpeed: 1 }"
        ref="stage"
        @init="onInit"
        @mousemove="drag"
        @touchmove.passive="drag"
        @mousedown="(e: MouseEvent) => mouseDown(e)"
        @touchstart.passive="(e: TouchEvent) => mouseDown(e)"
        @mouseup="() => endDragging(unref(draggingNode))"
        @touchend.passive="() => endDragging(unref(draggingNode))"
    >
        <svg class="stage" width="100%" height="100%">
            <g class="g1">
                <g style="opacity: 0.4">
                    <transition-group name="transfer" :duration="500" appear>
                        <g v-for="node in sortedNodes" :key="node.id" style="transition-duration: 0s">
                            <template v-if="types[node.type].building !== undefined">
                                <g v-if="getNodeProperty(types[node.type].building, node).transferDistance !== undefined
                                        && node.distance !== -1
                                        && Object.values(node.buildMaterials).every(amount => amount === 0)"
                                    :transform="`translate(${node.position.x} ${node.position.y})`"
                                >
                                    <path
                                        :d="`M ${getNodeProperty(types[node.type].building, node).transferDistance} 0
                                            L 0 ${getNodeProperty(types[node.type].building, node).transferDistance}
                                            L -${getNodeProperty(types[node.type].building, node).transferDistance} 0
                                            L 0 -${getNodeProperty(types[node.type].building, node).transferDistance}
                                            Z
                                        `"
                                        fill="var(--accent1)"
                                    />
                                </g>
                            </template>
                        </g>
                    </transition-group>
                </g>
                <transition-group name="link" appear>
                    <g
                        v-for="link in unref(links) || []"
                        :key="`${link.startNode.id}-${link.endNode.id}`"
                    >
                        <BoardLinkVue
                            v-if="link.startNode.distance >= 0 && link.endNode.distance >= 0"
                            :link="link"
                            :dragging="unref(draggingNode)"
                            :dragged="
                                link.startNode === unref(draggingNode) ||
                                link.endNode === unref(draggingNode)
                                    ? dragged
                                    : undefined
                            "
                        />
                    </g>
                </transition-group>
                <transition-group name="grow" :duration="500" appear>
                    <g v-for="node in sortedNodes" :key="node.id" style="transition-duration: 0s">
                        <BoardNodeVue
                            :node="node"
                            :nodeType="types[node.type]"
                            :dragging="unref(draggingNode)"
                            :dragged="unref(draggingNode) === node ? dragged : undefined"
                            :hasDragged="unref(draggingNode) == null ? false : hasDragged"
                            :receivingNode="unref(receivingNode) === node"
                            :isSelected="unref(selectedNode) === node"
                            :selectedAction="
                                unref(selectedNode) === node ? unref(selectedAction) : null
                            "
                            @mouseDown="mouseDown"
                            @endDragging="endDragging"
                            @clickAction="(actionId: string) => clickAction(node, actionId)"
                            @place-building="placeBuilding"
                        />
                    </g>
                </transition-group>
            </g>
        </svg>
    </panZoom>
</template>

<script setup lang="ts">
import type {
    BoardData,
    BoardNode,
    BoardNodeLink,
    GenericBoardNodeAction,
    GenericNodeType
} from "features/boards/board";
import { getNodeProperty } from "features/boards/board";
import type { StyleValue } from "features/feature";
import { Visibility, isVisible } from "features/feature";
import type { ProcessedComputable } from "util/computed";
import { Ref, computed, ref, toRefs, unref, watchEffect } from "vue";
import BoardLinkVue from "./BoardLink.vue";
import BoardNodeVue from "./BoardNode.vue";

const _props = defineProps<{
    nodes: Ref<BoardNode[]>;
    types: Record<string, GenericNodeType>;
    state: Ref<BoardData>;
    visibility: ProcessedComputable<Visibility | boolean>;
    width?: ProcessedComputable<string>;
    height?: ProcessedComputable<string>;
    style?: ProcessedComputable<StyleValue>;
    classes?: ProcessedComputable<Record<string, boolean>>;
    links: Ref<BoardNodeLink[] | null>;
    selectedAction: Ref<GenericBoardNodeAction | null>;
    selectedNode: Ref<BoardNode | null>;
    draggingNode: Ref<BoardNode | null>;
    receivingNode: Ref<BoardNode | null>;
    mousePosition: Ref<{ x: number; y: number } | null>;
    setReceivingNode: (node: BoardNode | null) => void;
    setDraggingNode: (node: BoardNode | null) => void;
}>();
const props = toRefs(_props);

const lastMousePosition = ref({ x: 0, y: 0 });
const dragged = ref({ x: 0, y: 0 });
const hasDragged = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stage = ref<any>(null);

const sortedNodes = computed(() => {
    const nodes = props.nodes.value.slice();
    if (props.selectedNode.value) {
        const node = nodes.splice(nodes.indexOf(props.selectedNode.value), 1)[0];
        nodes.push(node);
    }
    if (props.draggingNode.value) {
        nodes.push(props.draggingNode.value);
    }
    return nodes;
});

const snapDistance = 10;

watchEffect(() => {
    const node = props.draggingNode.value;
    if (node == null) {
        return null;
    }

    const position = {
        x: node.position.x,// + dragged.value.x,
        y: node.position.y// + dragged.value.y
    };
    let smallestDistance = Number.MAX_VALUE;

    props.setReceivingNode.value(
        props.nodes.value.reduce((smallest: BoardNode | null, curr: BoardNode) => {
            if (curr.id === node.id) {
                return smallest;
            }
            const nodeType = props.types.value[curr.type];
            const canAccept = getNodeProperty(nodeType.canAccept, curr, node);
            if (!canAccept) {
                return smallest;
            }

            const distanceSquared =
                Math.pow(position.x - curr.position.x, 2) +
                Math.pow(position.y - curr.position.y, 2);
            let size = getNodeProperty(nodeType.size, curr);
            if (distanceSquared > smallestDistance || distanceSquared > size * size) {
                return smallest;
            }

            smallestDistance = distanceSquared;
            return curr;
        }, null)
    );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onInit(panzoomInstance: any) {
    panzoomInstance.setTransformOrigin(null);
    panzoomInstance.moveTo(stage.value.$el.clientWidth / 2, stage.value.$el.clientHeight / 2);
    panzoomInstance.on('panstart', (instance: any) => {
        if (justPlaced) {
            instance.pause();
            instance.resume();
            setTimeout(() => justPlaced = false, 200);
        }
    });
    panzoomInstance.on('pan', (instance: any) => {
        if (justPlaced) {
            instance.pause();
            instance.resume();
        }
    });
}
let justPlaced = false;
function placeBuilding() {
    justPlaced = true;
}

function mouseDown(e: MouseEvent | TouchEvent, node: BoardNode | null = null) {
    if (props.draggingNode.value == null) {
        e.preventDefault();
        e.stopPropagation();

        let clientX, clientY;
        if ("touches" in e) {
            if (e.touches.length === 1) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                return;
            }
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        lastMousePosition.value = {
            x: clientX,
            y: clientY
        };
        dragged.value = { x: 0, y: 0 };
        hasDragged.value = false;
    }
    if (node != null) {
        props.state.value.selectedNode = null;
        props.state.value.selectedAction = null;
    }
}

function drag(e: MouseEvent | TouchEvent) {
    const { x, y, scale } = stage.value.panZoomInstance.getTransform();

    let clientX, clientY;
    if ("touches" in e) {
        if (e.touches.length === 1) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            endDragging(props.draggingNode.value);
            props.mousePosition.value = null;
            return;
        }
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    props.mousePosition.value = {
        x: (clientX - x) / scale,
        y: (clientY - y) / scale
    };

    dragged.value = {
        x: dragged.value.x + (clientX - lastMousePosition.value.x) / scale,
        y: dragged.value.y + (clientY - lastMousePosition.value.y) / scale
    };
    lastMousePosition.value = {
        x: clientX,
        y: clientY
    };

    if (Math.abs(dragged.value.x) > 10 || Math.abs(dragged.value.y) > 10) {
        hasDragged.value = true;
    }

    if (props.draggingNode.value != null) {
        e.preventDefault();
        e.stopPropagation();

        props.draggingNode.value.position = {
            x: Math.round((props.mousePosition.value.x - 300 / scale) / snapDistance) * snapDistance,
            y: Math.round((props.mousePosition.value.y - 50 / scale) / snapDistance) * snapDistance
        }
    }
}

function endDragging(node: BoardNode | null) {
    if (props.draggingNode.value != null && props.draggingNode.value === node) {
        if (props.receivingNode.value == null) {
            props.draggingNode.value.position.x += Math.round(dragged.value.x / snapDistance) * snapDistance;
            props.draggingNode.value.position.y += Math.round(dragged.value.y / snapDistance) * snapDistance;
        }

        const nodes = props.nodes.value;
        nodes.push(nodes.splice(nodes.indexOf(props.draggingNode.value), 1)[0]);

        if (props.receivingNode.value) {
            props.types.value[props.receivingNode.value.type].onDrop?.(
                props.receivingNode.value,
                props.draggingNode.value
            );
        }

        props.setDraggingNode.value(null);
    } else if (!hasDragged.value) {
        props.state.value.selectedNode = null;
        props.state.value.selectedAction = null;
    }
}

function clickAction(node: BoardNode, actionId: string) {
    if (props.state.value.selectedAction === actionId) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        unref(props.selectedAction)!.onClick(unref(props.selectedNode)!);
    } else {
        props.state.value = { ...props.state.value, selectedAction: actionId };
    }
}
</script>

<style>
.vue-pan-zoom-scene {
    width: 100%;
    height: 100%;
    cursor: grab;
}

.vue-pan-zoom-scene:active {
    cursor: grabbing;
}

.g1 {
    transition-duration: 0s;
}

.link-enter-from,
.link-leave-to {
    opacity: 0;
}
</style>
