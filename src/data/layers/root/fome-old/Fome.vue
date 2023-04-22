<template>
    <div class="fome-grid">
        <template v-for="fome in Object.values(FomeTypes).slice().reverse()" :key="fome">
            <div v-if="Decimal.gt(unref(reformUpgrades[fome].amount), 0)">
                <div v-html="getFomeDisplay(fome)" style="white-space: nowrap" />
                <div>{{ format(unref(fomeRates[fome])) }}/sec</div>
            </div>
            <template v-for="dim in FomeDims" :key="dim">
                <component :is="fomeDimUpgrades[fome][dim]" />
            </template>
            <component :is="fomeCondenseUpgrades[fome]" />
            <component :is="fomeReformUpgrades[fome]" />
        </template>
    </div>
</template>

<script lang="ts">
import UpgradeVue from "features/upgrades/Upgrade.vue";
import Decimal, { format, formatWhole } from "util/break_eternity";
import { render } from "util/vue";
import { DefineComponent, defineComponent, unref } from "vue";
import fome, { FomeDims, FomeTypes } from "./fome";

export default defineComponent({
    setup() {
        const fomeDimUpgrades = Object.fromEntries(
            Object.entries(fome.dimUpgrades).map(([type, upgrades]) => {
                return [
                    type,
                    Object.fromEntries(
                        Object.entries(upgrades).map(([dim, upgrade]) => {
                            return [dim, render(upgrade)];
                        })
                    )
                ];
            })
        ) as Record<FomeTypes, Record<FomeDims, JSX.Element | DefineComponent>>;
        const fomeCondenseUpgrades = Object.fromEntries(
            Object.entries(fome.condenseUpgrades).map(([type, upgrade]) => {
                return [type, render(upgrade)];
            })
        ) as Record<FomeTypes, JSX.Element | DefineComponent>;
        const fomeReformUpgrades = Object.fromEntries(
            Object.entries(fome.reformUpgrades).map(([type, upgrade]) => {
                return [type, render(upgrade)];
            })
        ) as Record<FomeTypes, JSX.Element | DefineComponent>;
        function getFomeDisplay(type: FomeTypes) {
            return `You have ${format(unref(fome.amounts[type]))} ${
                fome.amounts[type].displayName
            }${
                Decimal.gt(unref(fome.reformUpgrades[type].amount), 1) ? `<sup>${formatWhole(unref(fome.reformUpgrades[type].amount))}</sup>` : ""
            }`;
        }
        return {
            fomeDimUpgrades,
            fomeCondenseUpgrades,
            fomeReformUpgrades,
            fomeAmounts: fome.amounts,
            fomeRates: fome.rates,
            reformUpgrades: fome.reformUpgrades,
            FomeTypes,
            FomeDims,
            getFomeDisplay,
            unref,
            format,
            Decimal
        };
    },
    components: { UpgradeVue }
});
</script>

<style scoped>
.fome-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-gap: 0px;
    width: 90%;
    max-width: 1200px;
}

.fome-grid > :deep(.clickable) {
    width: 100%;
    min-height: 100px;
}

.fome-grid > :deep(.clickable.auto) {
    background-color: var(--bought);
}
</style>
