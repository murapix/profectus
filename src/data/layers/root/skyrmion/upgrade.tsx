import SpacerVue from "components/layout/Spacer.vue";
import { Visibility, jsx } from "features/feature";
import { addTooltip } from "features/tooltips/tooltip";
import { GenericUpgrade, createUpgrade } from "features/upgrades/upgrade";
import { Requirements, displayRequirements } from "game/requirements";
import { Direction } from "util/common";
import { Computable } from "util/computed";

export interface SkyrmionUpgradeData {
    visibility?: Computable<Visibility | boolean>;
    requirements: Requirements;
    display: {
        title: string,
        description: JSX.Element;
    };
    onPurchase?(): void;
}

export function createSkyrmionUpgrade(data: SkyrmionUpgradeData): GenericUpgrade {
    const upgrade = createUpgrade(() => ({
        visibility: data.visibility,
        requirements: data.requirements,
        display: data.display.title,
        onPurchase: data.onPurchase
    }));

    addTooltip(upgrade, {
        direction: Direction.Up,
        display: jsx(() => (
            <>
                {data.display.description}
                <SpacerVue />
                {displayRequirements(data.requirements)}
            </>
        ))
    })

    return upgrade;
}