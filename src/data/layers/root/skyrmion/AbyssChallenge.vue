<template>
    <div
        v-if="isVisible(challenge.visibility)"
        :style="[
            {
                visibility: isHidden(challenge.visibility) ? 'hidden' : undefined
            },
            notifyStyle,
            unref(challenge.style) ?? {}
        ]"
        class="feature challenge"
        :class="{
            done: unref(challenge.completed),
            canStart: unref(challenge.canStart) && !unref(challenge.maxed),
            maxed: unref(challenge.maxed),
            ...unref(challenge.classes)
        }"
    >
        <span>A dark mirror to reality, spawned deep within the endless void</span>
        <button
            class="toggleChallenge"
            @click="challenge.toggle"
            :disabled="!unref(challenge.canStart)"
        >{{ `${unref(challenge.active) ? 'Exit' : 'Enter'} the Abyss` }}</button>
        <button
            class="button"
            @click="() => showInfo = true"
        >What is the Abyss?</button>
        <Modal
            :model-value="showInfo"
            @update:model-value="(value: boolean) => showInfo = value"
        >
            <template #header>
                <h2>Knowledge of the Abyss</h2>
            </template>
            <template #body>
                <span style="fontWeight: normal">
                        The Abyss is a twisted version of reality, featuring several unique differences. Entering this alternate reality will pause your progress outside, yet what you do here will remain - and some features may even be brought out, with some effort.
                <br/><br/>Abyssal Pion and Spinor upgrades, unlike the versions you are used to, share a singular cost nerf, and are not affected by the automation provided by the Skyrmion upgrades.
                <br/><br/>There do seem to be a few more Skyrmion, Pion, and Spinor upgrades available though, maybe those will be of use?
                </span>
            </template>
        </Modal>

        <component :is="unref(requirementsDisplay)" class="goal" />
        <Node :id="challenge.id" />
    </div>
</template>

<script setup lang="tsx">
import Modal from 'components/Modal.vue';
import Node from 'components/Node.vue';
import { GenericChallenge } from 'features/challenges/challenge';
import { isHidden, isVisible, jsx } from 'features/feature';
import NamedResource from 'features/resources/NamedResource.vue';
import { getHighNotifyStyle, getNotifyStyle } from 'game/notifications';
import type { CostRequirement } from 'game/requirements';
import { DecimalSource } from 'util/bignum';
import { ProcessedComputable } from 'util/computed';
import { coerceComponent, unwrapRef } from 'util/vue';
import type { Component } from 'vue';
import { computed, ref, shallowRef, unref, watchEffect } from 'vue';

const props = defineProps<{
    challenge: GenericChallenge;
}>();

const showInfo = ref(false);

const notifyStyle = computed(() => {
    const currActive = unwrapRef(props.challenge.active);
    const currCanComplete = unwrapRef(props.challenge.canComplete);
    if (currActive) {
        if (currCanComplete) {
            return getHighNotifyStyle();
        }
        return getNotifyStyle();
    }
    return {};
});

const requirementsDisplay = shallowRef<Component | string>("");
watchEffect(() => {
    requirementsDisplay.value = coerceComponent(
        jsx(() => {
            const requirement = props.challenge.requirements as CostRequirement;
            return <div>
                Current Goal: <NamedResource resource={requirement.resource} override={unref(requirement.cost as ProcessedComputable<DecimalSource>)} />
            </div>
        })
    );
});
</script>

<style scoped>
.challenge {
    width: 250px;
    height: 250px;
    
    padding: 0;
    border: 0;
    border-radius: 0;
    clip-path: polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%);

    background: var(--locked);
    color: var(--feature-foreground);
    
    font-size: 15px;

    display: grid;
    grid-template-rows: 100px 50px auto auto;
    align-items: center;
    justify-items: center;
}

.challenge.maxed {
    background: var(--bought);
}

.challenge > .toggleChallenge {
    width: fit-content;
    height: 100%;

    padding: 0 15px;
    border-radius: var(--border-radius);
    background: var(--feature-background);

    color: var(--feature-foreground);
    cursor: pointer;
}

.challenge > .button {
    display: block;

    margin: 0;
    border: none;
    padding: 1px 6px;
    background: none;
    
    cursor: pointer;
    color: var(--link);
    text-decoration: none;
}

.challenge span {
    font-size: 14px;
    width: 150px;
}

.goal {
    font-size: 14px;
    width: 150px;
}
</style>