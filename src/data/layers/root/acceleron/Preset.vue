<template>
    <Row class="preset" :style="{'--num-rows': dimensions.maxHeight}">
        <Column>
            <Row v-if="renaming">
                <Text class="title" v-model="newName" @submit="rename" style="display: contents;"/>
                <button @click="rename" class="button">
                    <Tooltip display="Save" :direction="Direction.Up" class="info">
                        <span class="material-icons">check</span>
                    </Tooltip>
                </button>
                <button @click="renaming = !renaming" class="button">
                    <Tooltip display="Cancel" :direction="Direction.Up" class="info">
                        <span class="material-icons">close</span>
                    </Tooltip>
                </button>
            </Row>
            <div v-else class="title">{{ preset.name }}</div>
            <Row>
                <FeedbackButton
                    @click="emit('export')"
                    class="button"
                    left
                    v-if="!deleting"
                >
                    <Tooltip display="Export" :direction="Direction.Up" class="info">
                        <span class="material-icons">content_paste</span>
                    </Tooltip>
                </FeedbackButton>
                <button
                    @click="emit('load')"
                    class="button"
                    v-if="!deleting"
                >
                    <Tooltip display="Load" :direction="Direction.Up" class="info">
                        <span class="material-icons">content_copy</span>
                    </Tooltip>
                </button>
                <button
                    v-if="!deleting"
                    class="button"
                    @click="renaming = !renaming"
                >
                    <Tooltip display="Rename" :direction="Direction.Up" class="info">
                        <span class="material-icons">edit</span>
                    </Tooltip>
                </button>
                <DangerButton
                    @click="emit('delete')"
                    @confirmingChanged="(value: boolean) => deleting = value"
                >
                    <Tooltip display="Delete" :direction="Direction.Up" class="info">
                        <span class="material-icons">delete</span>
                    </Tooltip>
                </DangerButton>
            </Row>
        </Column>
        <div class="grid">
            <div v-for="row in dimensions.maxHeight+1" class="row">
                <div v-for="column in dimensions.maxWidth+1"
                    class="template"
                    :class="{bought: buyMap[row][column-1]}"
                />
            </div>
        </div>
    </Row>
</template>

<script setup lang="tsx">
import { GenericUpgrade } from 'features/upgrades/upgrade';
import { Direction } from 'util/common';
import Row from 'components/layout/Row.vue';
import Column from 'components/layout/Column.vue';
import DangerButton from 'components/fields/DangerButton.vue';
import { ref, unref, watch } from 'vue';
import FeedbackButton from 'components/fields/FeedbackButton.vue';
import Text from 'components/fields/Text.vue';
import Tooltip from 'features/tooltips/Tooltip.vue';

type PresetType = {
    name: string;
    purchased: string[];
};

const props = defineProps<{
    rows: Record<number, GenericUpgrade[]>;
    preset: PresetType;
}>();

const emit = defineEmits<{
    (emit: "export"): void;
    (emit: "load"): void;
    (emit: "delete"): void;
    (emit: "rename", name: string): void;
}>();

const buyMap = Object.fromEntries(
    Object.entries(props.rows).map(
        ([row, upgrades]) => [row, upgrades.map(
            upgrade => props.preset.purchased.includes(upgrade.id)
        )]
    )
);

const dimensions = Object.values(buyMap).map(row => row.reduce(
    (width, bought, column) => bought && column > width
        ? column
        : width,
    0
)).reduce(
    ({ maxWidth, maxHeight }, width, row) => ({
        maxWidth: width > maxWidth ? width : maxWidth,
        maxHeight: width > 0 ? row : maxHeight
    }),
    { maxWidth: 0, maxHeight: 0 }
);

const renaming = ref(false);
const deleting = ref(false);
const newName = ref("");

watch(renaming, () => newName.value = props.preset.name ?? "");

function rename() {
    if (unref(newName).length > 0) {
        emit("rename", unref(newName));
    }
    renaming.value = false;
}
</script>

<style scoped>
.preset {
    min-width: 365px;
    height: 100px;
    background: linear-gradient(to right, var(--transparent), var(--raised-background) 25%);
    align-items: flex-end;
}

.preset :deep(.danger.button) {
    display: flex;
    align-items: center;
    padding: 4px;
}

.grid {
    display: flex;
    flex-flow: column nowrap;
    width: fit-content;
    height: fit-content;
    padding: 10px 0px;
}

.row {
    margin: 0;
}

.template {
    width: calc((80px - (var(--num-rows) * 2px)) / (var(--num-rows) + 1));
    height: calc((80px - (var(--num-rows) * 2px)) / (var(--num-rows) + 1));
    background: var(--locked);
    margin: 2px;
}

.template.bought {
    background: var(--bought);
}

.title {
    margin: 5px;
    height: 2em;
}

.material-icons {
    font-size: 20px;
}

:deep(.field) {
    margin: 0;
    width: 170px;
}
</style>