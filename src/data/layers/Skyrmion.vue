<template>
    <div class="skyrmion-container">
        <ul class="skyrmion-grid">
            <li
                class="skyrmion-upgrade"
                v-for="(upgrade, index) in unref(upgrades)"
                :key="index"
                v-bind="$attrs"
                :style="getPos(index)"
            >
                <Upgrade v-bind="gatherUpgradeProps(upgrade)" />
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
import { GenericUpgrade } from "features/upgrades/upgrade";
import { processedPropType } from "util/vue";
import { defineComponent, unref } from "vue";
import Upgrade from "features/upgrades/Upgrade.vue";
import { StyleValue } from "features/feature";

export default defineComponent({
    props: {
        upgrades: {
            type: processedPropType<GenericUpgrade[]>(Array),
            required: true
        }
    },
    components: { Upgrade },
    setup() {
        function gatherUpgradeProps(upgrade: GenericUpgrade) {
            const {
                display,
                visibility,
                style,
                classes,
                tooltip,
                resource,
                cost,
                canPurchase,
                bought,
                mark,
                id,
                purchase
            } = upgrade;
            return {
                display,
                visibility,
                style,
                classes,
                tooltip,
                resource,
                cost,
                canPurchase,
                bought,
                mark,
                id,
                purchase
            };
        }
        function getPos(index: number) {
            let row, col;
            switch (index) {
                case 0:
                case 1: {
                    row = 1;
                    col = index * 4 + 7;
                    break;
                }
                case 2:
                case 3:
                case 4: {
                    row = 2;
                    col = (index - 2) * 4 + 5;
                    break;
                }
                case 5:
                case 6:
                case 7:
                case 8: {
                    row = 3;
                    col = (index - 5) * 4 + 3;
                    break;
                }
                case 9:
                case 10:
                case 11:
                case 12:
                case 13: {
                    row = 4;
                    col = (index - 9) * 4 + 1;
                    break;
                }
                case 14:
                case 15:
                case 16:
                case 17: {
                    row = 5;
                    col = (index - 14) * 4 + 3;
                    break;
                }
                default: {
                    row = -1;
                    col = -1;
                    break;
                }
            }
            return {
                "--row": row,
                "--col": col
            } as StyleValue;
        }
        return {
            gatherUpgradeProps,
            getPos,
            unref
        };
    }
});
</script>

<style scoped>
.skyrmion-container {
    --width: 5;
    --row: 1;
    --col: 1;
    --gap: 10;
    width: calc(
        var(--width) * 120px + (var(--width) - 1) * 60px + (var(--width) - 1) * var(--gap) * 1px
    );
}

.skyrmion-grid {
    display: grid;
    grid-template-columns: repeat(calc(var(--width) * 2 - 1), 1fr 2fr) 1fr;
    grid-gap: calc(var(--gap) * 1px) calc(var(--gap) * 2px);
    list-style-type: none;
    margin-left: calc(0px - (var(--gap) / 2 * 1px));
    padding: 0;
}

.skyrmion-upgrade {
    position: relative;
    grid-column: var(--col) / span 3;
    grid-row: var(--row) / span 2;
    height: 0;
    padding-bottom: 120px;
    margin: 0;
}

.skyrmion-upgrade > * {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
}
</style>
