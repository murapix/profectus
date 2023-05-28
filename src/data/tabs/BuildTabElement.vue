<template>
    <div class="build-element-row">
        <svg width="100px" height="100px" viewBox="-30 -30 60 60" :class="{selected: selected === type}">
            <component :is="component" @select-building="select" />
        </svg>
        <div class="build-element-column">
            <component :is="name" />
            <component :is="description" />
            <div class="build-element-cost">
                <template v-for="[resource, symbol, amount] of costs">
                    <div class="cost-element" :style="{
                        color: amounts[resource]! >= amount ? 'var(--feature-foreground)' : undefined
                    }">
                        <component :is="symbol" />
                        <span>{{ formatWhole(amount) }}</span>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Building } from 'data/content/building';
import { Resources, resources, amounts } from 'data/content/resources';
import { BoardNodeType } from 'data/content/types';
import { GenericComponent } from 'features/feature';
import { formatWhole } from 'util/break_eternity';
import { coerceComponent } from 'util/vue';
import { DefineComponent, computed } from 'vue';

const props = defineProps<{
    component: GenericComponent,
    type: BoardNodeType,
    building: Building,
    selected?: BoardNodeType
}>();

const name = computed(() => coerceComponent(props.building.display?.name ?? "", "h3"));
const description = computed(() => coerceComponent(props.building.display?.description ?? "", "div"));
const costs = computed(() => {
    let costs = [] as [Resources, DefineComponent, number][];
    for (const resource in resources) {
        if (resource in props.building.cost && props.building.cost[resource as Resources]! > 0) {
            costs.push([
                resource as Resources,
                coerceComponent(resources[resource as Resources].symbol),
                props.building.cost[resource as Resources]!
            ]);
        }
    }
    return costs;
});

const emit = defineEmits<{
    (type: "select-building", nodeType: BoardNodeType): void;
}>();

function select() {
    emit("select-building", props.type);
}
</script>

<style scoped>
.build-element-row {
    display: flex;
    flex-flow: row nowrap;
    margin-top: 15px;
    margin-bottom: 15px;
    margin-right: var(--border-thickness);
}

svg {
    flex-shrink: 0;
}

.build-element-column {
    display: flex;
    flex-flow: column nowrap;
}

.build-element-column > * {
    margin-left: 0;
    text-align: left;
}

.build-element-cost {
    display: flex;
    flex-flow: row wrap;
}

.cost-element {
    display: grid;
    grid-template-columns: 20px auto;
    margin-right: 15px;
}

.cost-element > :first-child {
    user-select: none;
}

h3 {
    color: var(--feature-foreground);
}

.selected {
    transform: scale(1.2);
}
</style>