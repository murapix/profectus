<template>
    <g @mouseup="mouseUp"
       @touchend.passive="mouseUp"
       :style="{opacity: placing ? 0.5 : 1}"
    >
        <circle
            class="body"
            :r="size ?? 10"
            fill="var(--locked)"
            :stroke="stroke"
            stroke-width=2
        />
    </g>
</template>

<script setup lang="ts">
import { BoardNode } from 'features/boards/board';
import { computed } from 'vue';

const props = defineProps<{
    node?: BoardNode;
    size?: number;
    placing?: boolean;
}>();

const stroke = computed(() => {
    if (props.node === undefined) {
        return 'var(--outline)';
    }

    const node = props.node;
    if (Object.values(node.buildMaterials).some(amount => amount > 0)) {
        return 'var(--locked)' // TODO: set to --danger when no resources available
    }
    if (node.distance === -1) {
        return 'var(--danger)'
    }
    return 'var(--outline)';
});

const emit = defineEmits<{
    (type: "select", event: MouseEvent | TouchEvent): void;
    (type: "click", event: MouseEvent | TouchEvent, node: BoardNode): void;
}>();

function mouseUp(event: MouseEvent | TouchEvent) {
    if (props.node) {
        emit("click", event, props.node);
    }
    else {
        emit("select", event);
    }
}
</script>

<style scoped>
.body {
    cursor: pointer;
}
</style>