import Spacer from "components/layout/Spacer.vue";
import { createUpgrade } from "features/clickables/upgrade";
import { Visibility } from "features/feature";
import { Requirements, displayRequirements } from "game/requirements";
import { Direction } from "util/common";
import { MaybeRefOrGetter } from "vue";
import { JSX } from "vue/jsx-runtime";
import { addTooltip } from "wrappers/tooltips/tooltip";

export interface SkyrmionUpgradeData {
    visibility?: MaybeRefOrGetter<Visibility | boolean>;
    requirements: Requirements;
    display: {
        title: string,
        description: JSX.Element;
    };
    onPurchase?(): void;
}

export function createSkyrmionUpgrade(data: SkyrmionUpgradeData) {
    const upgrade = createUpgrade(() => ({
        visibility: data.visibility,
        requirements: data.requirements,
        display: data.display.title,
        onPurchase: data.onPurchase
    }));

    addTooltip(upgrade, () => ({
        direction: Direction.Up,
        display: () => (
            <>
                {data.display.description}
                <Spacer />
                {displayRequirements(data.requirements)}
            </>
        )
    }))

    return upgrade;
}