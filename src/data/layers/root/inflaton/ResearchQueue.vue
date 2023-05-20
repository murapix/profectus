<template>
    <Column>
        <template v-for="slot, index in unref(queue)" :key="slot ? `${slot[0]}-${slot[1]}` : index">
            <h3 v-if="index === unref(parallel)">Next Up:</h3>
            <ResearchQueueSlot v-if="!slot"
                :index="index" 
            />
            <ResearchQueueSlot v-else
                :location="slot[0]"
                :id="slot[1]"
                :name="name(index)"
                :progress="unref(locations)[slot[0]][slot[1]].progressPercentage"
                :index="index"
            />
        </template>
    </Column>
</template>

<script lang="ts">
import { processedPropType, unwrapRef, isCoercableComponent } from 'util/vue';
import { defineComponent, unref, toRefs, isRef } from 'vue';
import { isFunction } from 'util/common';
import { GenericResearch } from './research';
import Row from 'components/layout/Row.vue';
import ResearchQueueSlot from './ResearchQueueSlot.vue';
import { CoercableComponent } from 'features/feature';
import Column from 'components/layout/Column.vue';

export default defineComponent({
    props: {
        queue: {
            type: processedPropType<( [string,string] | undefined | null )[]>(Array),
            required: true
        },
        parallel: {
            type: processedPropType<number>(Number),
            default: 1
        },
        locations: {
            type: processedPropType<{ [key in string]: { [key in string]: GenericResearch; }; }>(Object),
            required: true
        }
    },
    setup(props) {
        const { queue, locations } = toRefs(props);

        function name(index: number): CoercableComponent | undefined {
            const slot = unwrapRef(queue)[index];
            if (slot) {
                const research = unwrapRef(locations)[slot[0]][slot[1]];
                if (isCoercableComponent(research.display)) return slot[1];
                if (isRef(research.display)) return slot[1];
                if (isFunction(research.display)) return slot[1];

                return research.display.title;
            }
        };

        return {
            unref,

            name
        };
    },
    components: { Row, ResearchQueueSlot, Column }
})
</script>

<style scoped>
h3 {
    font-size: 12px;
}

.col > * {
    margin: var(--feature-margin) 0px;
}
</style>