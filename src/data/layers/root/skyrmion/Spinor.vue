<template>
    <div class="spinor-container">
        <ul class="spinor-grid">
            <template v-for="(upgrade, index) in upgrades" :key="index">
                <li
                    class="spinor-upgrade"
                    v-bind="$attrs"
                    :style="getPos(index)"
                    v-if="unref(upgrade.visibility) !== Visibility.None"
                >
                    <component :is="render(upgrade)" />
                </li>
            </template>
        </ul>
    </div>
</template>

<script lang="ts">
import { render } from "util/vue";
import { defineComponent, unref } from "vue";
import skyrmion from "./skyrmion";
import { StyleValue, Visibility } from "features/feature";

export default defineComponent({
    setup() {
        const upgrades = Object.fromEntries(
            Object.entries(skyrmion.spinorUpgrades).filter(([key]) => key !== "amount")
        ) as Record<
            keyof Omit<typeof skyrmion.spinorUpgrades, "amount">,
            typeof skyrmion.spinorUpgrades[keyof Omit<typeof skyrmion.spinorUpgrades, "amount">]
        >;
        const positions: Record<keyof typeof upgrades, { row: number; col: number }> = {
            alpha: { row: 1, col: 1 },
            beta: { row: 2, col: 3 },
            gamma: { row: 3, col: 1 },
            delta: { row: 4, col: 3 },
            epsilon: { row: 5, col: 1 },
            zeta: { row: 3, col: 5 },
            eta: { row: 5, col: 5 },
            theta: { row: 6, col: 3 },
            iota: { row: 7, col: 1 },
            kappa: { row: 4, col: 7 },
            lambda: { row: 6, col: 7 },
            mu: { row: 7, col: 5 }
        };
        function getPos(index: keyof typeof upgrades) {
            return { "--row": positions[index].row, "--col": positions[index].col } as StyleValue;
        }
        return {
            render,
            getPos,
            unref,
            Visibility,
            upgrades
        };
    }
});
</script>

<style scoped>
.spinor-container {
    --upgrade-width: 35px;
    --width: 3;
    --row: 1;
    --col: 1;
    --gap: 5px;
    width: calc(
        var(--width) * var(--upgrade-width) + (var(--width) - 1) * var(--upgrade-width) / 2 +
            (var(--width) - 1) * var(--gap)
    );
}

.spinor-grid {
    display: grid;
    grid-template-columns: repeat(calc(var(--width) * 2 - 1), 1fr 2fr) 1fr;
    grid-gap: var(--gap) calc(var(--gap) * 2);
    list-style-type: none;
    margin-left: calc(0px - (var(--gap) / 2));
    padding: 0;
}

.spinor-upgrade {
    position: relative;
    grid-column: var(--col) / span 3;
    grid-row: var(--row) / span 2;
    height: 0;
    padding-bottom: var(--upgrade-width);
    margin: 0;
}

.spinor-upgrade :deep(button) {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    border: 0;
    border-radius: 0;
    clip-path: polygon(75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 25% 0%);
    width: var(--upgrade-width);
    min-height: var(--upgrade-width);
}
</style>
