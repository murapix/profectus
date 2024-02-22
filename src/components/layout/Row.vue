<template>
    <div class="table">
        <div class="row" :class="{ mergeAdjacent }">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import "components/common/table.css";

defineProps<{
    mergeAdjacent?: boolean;
}>();
</script>
