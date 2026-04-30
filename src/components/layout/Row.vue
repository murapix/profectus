<template>
    <div class="table">
        <div class="row" :class="{ mergeAdjacent }">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import "components/common/table.css";
import { computed } from "vue";

const props = defineProps<{
    dontMerge?: boolean
}>();

const mergeAdjacent = computed(() => props.dontMerge !== true);
</script>
