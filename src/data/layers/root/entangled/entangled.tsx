import { jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import MainDisplay from "features/resources/MainDisplay.vue";
import Spacer from "components/layout/Spacer.vue";
import { render, renderCol, renderRow } from "util/vue";
import { format } from "util/break_eternity";
import { ComputedRef, computed, unref } from "vue";
import { persistent, noPersist } from "game/persistence";
import acceleron, { id as acceleronId } from "../acceleron-old/acceleron";
import inflaton, { id as inflatonId } from "../inflaton/inflaton";
import timecube from "../timecube-old/timecube";
import { createAchievement, GenericAchievement } from "features/achievements/achievement";
import { createClickable, GenericClickable } from "features/clickables/clickable";
import { createUpgrade } from "features/upgrades/upgrade";
import { createCostRequirement, createBooleanRequirement, requirementsMet } from "game/requirements";
import player from "game/player";
import { ProcessedComputable } from "util/computed";

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

    const expansions = (() => {
        const cost: ComputedRef<number> = computed(() => [skyrmion, fome, acceleron, timecube, inflaton].filter(layer => unref(layer.bought)).length);
        const skyrmion = createUpgrade(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost,
                requiresPay: false
            })),
            visibility: milestones[2].earned,
            display: {
                title: 'Grasp the Void',
                description: 'You have long since extracted all you can from your Skyrmions, but new insights show there may be yet more to gain'
            }
        }));
        const fome = createUpgrade(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost,
                requiresPay: false
            })),
            visibility: milestones[2].earned,
            display: {
                title: 'Architectural Renaissance (TBD)',
                description: 'Look to the past, and see what glories the future may hold'
            }
        }));
        const acceleron = createUpgrade(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost,
                requiresPay: false
            })),
            visibility: milestones[2].earned,
            display: {
                title: 'Tetradimensional Engineering (TBD)',
                description: 'Application of structural ideas gained from Entropic Loops may give rise to a powerful new sector of exploration and progress'
            }
        }));
        const timecube = createUpgrade(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost,
                requiresPay: false
            })),
            visibility: milestones[2].earned,
            display: {
                title: 'Enigmatic Engineering',
                description: 'Time Cubes seem helpful, but limited in power. Maybe your newfound mastery over space and time can reveal more of their secrets'
            }
        }));
        const inflaton = createUpgrade(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost,
                requiresPay: false
            })),
            visibility: milestones[2].earned,
            display: {
                title: 'Technological Ascendency (TBD)',
                description: 'You have shown mastery over space and time, at least individually. Together, though, there are more secrets to unlock'
            }
        }));
        return { skyrmion, fome, acceleron, timecube, inflaton };
    })();

    const numExpansions = computed(() => Object.values(expansions).filter(expansion => expansion.bought.value).length);
    const expansionScore = computed(() => {
        return (
            (unref(expansions.skyrmion.bought) ? 1 : 0)  // 13 - 1
          + (unref(expansions.fome.bought) ? 2 : 0)      // 33 - 16
          + (unref(expansions.acceleron.bought) ? 4 : 0) // 31 - 4
          + (unref(expansions.timecube.bought) ? 8 : 0)  // 23 - 2
          + (unref(expansions.inflaton.bought) ? 16 : 0) // 32 - 8
        )
    })
    const canEntangle = computed(() => {
        if (Decimal.lte(strings.value, 1)) return true;
        return Decimal.lte(strings.value, numExpansions.value+1);
    });
    const requirements = {
        expansion: createBooleanRequirement(canEntangle),
        acceleron: createCostRequirement(() => ({
            resource: acceleron.accelerons,
            cost() {
                if (Decimal.eq(unref(strings), 0)) return 1e19;
                return [
                    1e29,         // 
                    1.5e41,       // Skyrmion
                    Decimal.dInf, //          Fome
                    Decimal.dInf, // Skyrmion Fome
                    Decimal.dInf, //               Acceleron
                    Decimal.dInf, // Skyrmion      Acceleron
                    Decimal.dInf, //          Fome Acceleron
                    Decimal.dInf, // Skyrmion Fome Acceleron
                    2.5e41,       //                         Timecube
                    1e64,         // Skyrmion                Timecube
                    Decimal.dInf, //          Fome           Timecube
                    Decimal.dInf, // Skyrmion Fome           Timecube
                    Decimal.dInf, //               Acceleron Timecube
                    Decimal.dInf, // Skyrmion      Acceleron Timecube
                    Decimal.dInf, //          Fome Acceleron Timecube
                    Decimal.dInf, // Skyrmion Fome Acceleron Timecube
                    Decimal.dInf, //                                  Inflaton
                    Decimal.dInf, // Skyrmion                         Inflaton
                    Decimal.dInf, //          Fome                    Inflaton
                    Decimal.dInf, // Skyrmion Fome                    Inflaton
                    Decimal.dInf, //               Acceleron          Inflaton
                    Decimal.dInf, // Skyrmion      Acceleron          Inflaton
                    Decimal.dInf, //          Fome Acceleron          Inflaton
                    Decimal.dInf, // Skyrmion Fome Acceleron          Inflaton
                    Decimal.dInf, //                         Timecube Inflaton
                    Decimal.dInf, // Skyrmion                Timecube Inflaton
                    Decimal.dInf, //          Fome           Timecube Inflaton
                    Decimal.dInf, // Skyrmion Fome           Timecube Inflaton
                    Decimal.dInf, //               Acceleron Timecube Inflaton
                    Decimal.dInf, // Skyrmion      Acceleron Timecube Inflaton
                    Decimal.dInf, //          Fome Acceleron Timecube Inflaton
                    Decimal.dInf  // Skyrmion Fome Acceleron Timecube Inflaton
                ][unref(expansionScore)];
            }
        })),
        inflaton: createCostRequirement(() => ({
            resource: inflaton.inflatons,
            cost() {
                if (Decimal.eq(unref(strings), 0)) return Decimal.pow10(8000);
                return [
                    Decimal.pow10(1.8e4),  // 
                    Decimal.pow10(8.5e12), // Skyrmion
                    Decimal.dInf,          //          Fome
                    Decimal.dInf,          // Skyrmion Fome
                    Decimal.dInf,          //               Acceleron
                    Decimal.dInf,          // Skyrmion      Acceleron
                    Decimal.dInf,          //          Fome Acceleron
                    Decimal.dInf,          // Skyrmion Fome Acceleron
                    Decimal.pow10(3.7e5),  //                         Timecube
                    Decimal.pow10(4.5e17), // Skyrmion                Timecube
                    Decimal.dInf,          //          Fome           Timecube
                    Decimal.dInf,          // Skyrmion Fome           Timecube
                    Decimal.dInf,          //               Acceleron Timecube
                    Decimal.dInf,          // Skyrmion      Acceleron Timecube
                    Decimal.dInf,          //          Fome Acceleron Timecube
                    Decimal.dInf,          // Skyrmion Fome Acceleron Timecube
                    Decimal.dInf,          //                                  Inflaton
                    Decimal.dInf,          // Skyrmion                         Inflaton
                    Decimal.dInf,          //          Fome                    Inflaton
                    Decimal.dInf,          // Skyrmion Fome                    Inflaton
                    Decimal.dInf,          //               Acceleron          Inflaton
                    Decimal.dInf,          // Skyrmion      Acceleron          Inflaton
                    Decimal.dInf,          //          Fome Acceleron          Inflaton
                    Decimal.dInf,          // Skyrmion Fome Acceleron          Inflaton
                    Decimal.dInf,          //                         Timecube Inflaton
                    Decimal.dInf,          // Skyrmion                Timecube Inflaton
                    Decimal.dInf,          //          Fome           Timecube Inflaton
                    Decimal.dInf,          // Skyrmion Fome           Timecube Inflaton
                    Decimal.dInf,          //               Acceleron Timecube Inflaton
                    Decimal.dInf,          // Skyrmion      Acceleron Timecube Inflaton
                    Decimal.dInf,          //          Fome Acceleron Timecube Inflaton
                    Decimal.dInf           // Skyrmion Fome Acceleron Timecube Inflaton
                ][unref(expansionScore)];
            }
        })),
        timecube: createCostRequirement(() => ({
            resource: timecube.timecubes,
            cost() {
                if (!unref(expansions.timecube.bought)) return 0;
                return [
                    Decimal.dInf, // 
                    Decimal.dInf, // Skyrmion
                    Decimal.dInf, //          Fome
                    Decimal.dInf, // Skyrmion Fome
                    Decimal.dInf, //               Acceleron
                    Decimal.dInf, // Skyrmion      Acceleron
                    Decimal.dInf, //          Fome Acceleron
                    Decimal.dInf, // Skyrmion Fome Acceleron
                    1e4,          //                         Timecube
                    5e6,          // Skyrmion                Timecube
                    Decimal.dInf, //          Fome           Timecube
                    Decimal.dInf, // Skyrmion Fome           Timecube
                    Decimal.dInf, //               Acceleron Timecube
                    Decimal.dInf, // Skyrmion      Acceleron Timecube
                    Decimal.dInf, //          Fome Acceleron Timecube
                    Decimal.dInf, // Skyrmion Fome Acceleron Timecube
                    Decimal.dInf, //                                  Inflaton
                    Decimal.dInf, // Skyrmion                         Inflaton
                    Decimal.dInf, //          Fome                    Inflaton
                    Decimal.dInf, // Skyrmion Fome                    Inflaton
                    Decimal.dInf, //               Acceleron          Inflaton
                    Decimal.dInf, // Skyrmion      Acceleron          Inflaton
                    Decimal.dInf, //          Fome Acceleron          Inflaton
                    Decimal.dInf, // Skyrmion Fome Acceleron          Inflaton
                    Decimal.dInf, //                         Timecube Inflaton
                    Decimal.dInf, // Skyrmion                Timecube Inflaton
                    Decimal.dInf, //          Fome           Timecube Inflaton
                    Decimal.dInf, // Skyrmion Fome           Timecube Inflaton
                    Decimal.dInf, //               Acceleron Timecube Inflaton
                    Decimal.dInf, // Skyrmion      Acceleron Timecube Inflaton
                    Decimal.dInf, //          Fome Acceleron Timecube Inflaton
                    Decimal.dInf  // Skyrmion Fome Acceleron Timecube Inflaton
                ][unref(expansionScore)];
            },
            visibility: expansions.timecube.bought
        }))
    }
    const resetButton: GenericClickable = createClickable(() => ({
        canClick() {
            return requirementsMet(Object.values(requirements));
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
        expansions,
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
                    {acceleron.accelerons.displayName}: {format(unref(requirements.acceleron.resource))} / {format(unref(requirements.acceleron.cost as ProcessedComputable<DecimalSource>))}
                </div>
                <div color={inflaton.color}>
                    Stored {inflaton.inflatons.displayName}: {format(unref(requirements.inflaton.resource))} / {format(unref(requirements.inflaton.cost as ProcessedComputable<DecimalSource>))}
                </div>
                <div color={timecube.color} v-show={requirements.timecube.visibility}>
                    Total Timeline Score: {format(unref(requirements.timecube.resource))} / {format(unref(requirements.timecube.cost as ProcessedComputable<DecimalSource>))}
                </div>
                <Spacer />
                {renderRow(...Object.values(expansions))}
                {renderCol(...Object.values(milestones))}
            </>
        )),

        branchOrder,
        isFirstBranch
    };
});

export default layer;
