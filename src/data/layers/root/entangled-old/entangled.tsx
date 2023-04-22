import { jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import MainDisplay from "features/resources/MainDisplay.vue";
import Spacer from "components/layout/Spacer.vue";
import { render, renderCol } from "util/vue";
import { format } from "util/break_eternity";
import { computed, unref } from "vue";
import { persistent } from "game/persistence";
import acceleron, { id as acceleronId } from "../acceleron-old/acceleron";
import inflaton, { id as inflatonId } from "../inflaton-old/inflaton";
import timecube from "../timecube-old/timecube";
import { createAchievement, GenericAchievement } from "features/achievements/achievement";
import { createClickable, GenericClickable } from "features/clickables/clickable";

const layer = createLayer("entangled", () => {
    const name = "Entangled Strings";
    const color = "#9a4500";
    const strings = createResource<DecimalSource>(0, "Entangled Strings");

    type BranchOrder = '' | typeof acceleronId | typeof inflatonId
    const branchOrder = persistent<BranchOrder>('');
    function isFirstBranch(branch: BranchOrder): boolean {
        if (unref(milestones[1].earned)) return true;
        return ['', branch].includes(unref(branchOrder));
    }

    const requirements = {
        acceleron: {
            resource: acceleron.accelerons,
            amount: computed(() => Decimal.dInf)
        },
        inflaton: {
            resource: inflaton.inflatons,
            amount: computed(() => Decimal.dInf)
        },
        timecube: {
            resource: timecube.timecubes,
            amount: computed(() => Decimal.dInf),
            visibility: false
        }
    }
    const resetButton: GenericClickable = createClickable(() => ({
        canClick() {
            return Object.values(requirements).every(({resource, amount}) => Decimal.gte(unref(resource), unref(amount)));
        },
        display: 'Reset for 1 Entangled String'
    }));

    const milestones: Record<1|2|3|7, GenericAchievement> = {
        1: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(strings), 1) },
            display: {
                requirement: `1 ${strings.displayName}`,
                effectDisplay: `${acceleron.accelerons.displayName} and ${inflaton.inflatons.displayName} no longer inflate each other's costs`
            },
            small: false
        })),
        2: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(strings), 2) },
            display: {
                requirement: `2 ${strings.displayName}`,
                effectDisplay: jsx(() => <>
                    Unlock expansions to previous content<br />
                    Keep Skyrmion upgrades and Foam milestones
                </>)
            },
            small: false
        })),
        3: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(strings), 3) },
            display: {
                requirement: `3 ${strings.displayName}`,
                effectDisplay: 'Keep all parallel research and research queue researches'
            },
            small: false
        })),
        7: createAchievement(() => ({
            shouldEarn() { return Decimal.gte(unref(strings), 7) },
            display: {
                requirement: `7 ${strings.displayName}`,
                effectDisplay: 'Unlock Fundamental Particles'
            },
            small: false
        }))
    }

    return {
        name,
        color,
        strings,
        milestones,
        display: jsx(() => (
            <>
                <MainDisplay resource={strings} color={color} />
                <Spacer />
                {render(resetButton)}
                <Spacer />
                <div>The next {strings.displayName} requires:</div>
                <Spacer />
                <div color={acceleron.color}>
                    {acceleron.accelerons.displayName}: {format(unref(requirements.acceleron.resource))} / {format(unref(requirements.acceleron.amount))}
                </div>
                <div color={inflaton.color}>
                    Stored {inflaton.inflatons.displayName}: {format(unref(requirements.inflaton.resource))} / {format(unref(requirements.inflaton.amount))}
                </div>
                <div color={timecube.color} v-show={false}>
                    Total Timeline Score: {format(unref(requirements.timecube.resource))} / {format(unref(requirements.timecube.amount))}
                </div>
                <Spacer />
                {renderCol(...Object.values(milestones))}
            </>
        )),

        branchOrder,
        isFirstBranch
    };
});

export default layer;
