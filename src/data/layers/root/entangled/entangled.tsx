import { isVisible, jsx } from "features/feature";
import { createResource } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import MainDisplay from "features/resources/MainDisplay.vue";
import Spacer from "components/layout/Spacer.vue";
import { render, renderCol } from "util/vue";
import { format } from "util/break_eternity";
import { ComputedRef, Ref, computed, nextTick, unref } from "vue";
import { persistent, noPersist } from "game/persistence";
import acceleron, { id as acceleronId } from "../acceleron/acceleron";
import inflaton, { id as inflatonId } from "../inflaton/inflaton";
import timecube from "../timecube/timecube";
import { createAchievement, GenericAchievement } from "features/achievements/achievement";
import { createClickable, GenericClickable } from "features/clickables/clickable";
import { createUpgrade } from "features/upgrades/upgrade";
import { createCostRequirement, createBooleanRequirement, requirementsMet, Requirement, CostRequirement } from "game/requirements";
import { ProcessedComputable } from "util/computed";
import { createReset } from "features/reset";
import skyrmion from "../skyrmion/skyrmion";
import fome from "../fome/fome";
import Row from "components/layout/Row.vue";
import Column from "components/layout/Column.vue";

const layer = createLayer("entangled", () => {
    const name = "Entangled Strings";
    const color = "#9a4500";

    const unlocked: Ref<boolean> = computed(() => unref(milestones[1].earned) || (unref(acceleron.upgrades.mastery.bought) && unref(inflaton.coreResearch.research.mastery.researched)));

    const strings = createResource<DecimalSource>(0, "Entangled Strings");

    type BranchOrder = '' | typeof acceleronId | typeof inflatonId
    const branchOrder = persistent<BranchOrder>('', false);
    function isFirstBranch(branch: BranchOrder): boolean {
        if (unref(milestones[1].earned)) return true;
        return branch === unref(branchOrder);
    }

    const buttonSize = '160px';
    const expansions = (() => {
        const cost: ComputedRef<number> = computed(() => [skyrmion, fome, acceleron, timecube, inflaton].filter(layer => unref(layer.bought)).length + 2);
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
            },
            style: { width: buttonSize, height: buttonSize }
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
            },
            style: { width: buttonSize, height: buttonSize }
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
            },
            style: { width: buttonSize, height: buttonSize }
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
            },
            style: { width: buttonSize, height: buttonSize }
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
            },
            style: { width: buttonSize, height: buttonSize }
        }));
        return { skyrmion, fome, acceleron, timecube, inflaton };
    })();

    const numExpansions = computed(() => Object.values(expansions).filter(expansion => expansion.bought.value).length);
    const expansionScore = computed(() => {
        return (
            (unref(expansions.skyrmion.bought) ? 1 : 0)
          + (unref(expansions.fome.bought) ? 2 : 0)
          + (unref(expansions.acceleron.bought) ? 4 : 0)
          + (unref(expansions.timecube.bought) ? 8 : 0)
          + (unref(expansions.inflaton.bought) ? 16 : 0)
        )
    })
    const canEntangle = computed(() => {
        if (Decimal.lte(strings.value, 1)) return true;
        return Decimal.lte(strings.value, numExpansions.value+1);
    });
    const requirements: Record<'expansion', Requirement> & Record<'acceleron' | 'inflaton' | 'timecube', CostRequirement> = {
        expansion: createBooleanRequirement(canEntangle),
        acceleron: createCostRequirement(() => ({
            resource: noPersist(acceleron.accelerons),
            cost() {
                const cost = (() => {
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
                })();
                return Decimal.times(cost, unref(skyrmion.pion.upgrades.xi.effect));
            }
        })),
        inflaton: createCostRequirement(() => ({
            resource: noPersist(inflaton.inflatons),
            cost() {
                const cost = (() => {
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
                })();
                return Decimal.times(cost, unref(skyrmion.spinor.upgrades.xi.effect));
            }
        })),
        timecube: createCostRequirement(() => ({
            resource: createResource(computed(() => 
                Object.values(timecube.timelines.timelines)
                    .map(timeline => unref(timeline.score))
                    .reduce((sum: Decimal, score) => sum.plus(score), Decimal.dZero)
                )),
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
            visibility: noPersist(expansions.timecube.bought)
        }))
    }
    const resetButton: GenericClickable = createClickable(() => ({
        canClick() {
            return requirementsMet(Object.values(requirements));
        },
        onClick() {
            strings.value = Decimal.add(unref(strings.value), 1);
            nextTick(() => {
                const keptInflatonResearch = (unref(milestones[3].earned)
                    ? [inflaton.coreResearch.research.queueTwo, inflaton.coreResearch.research.queueFour]
                    : []).filter(research => unref(research.researched));
                reset.reset();
                if (unref(milestones[2].earned)) {
                    fome.protoversal.upgrades.reform.amount.value = Decimal.dOne;
                }
                for (const research of keptInflatonResearch) {
                    research.researched.value = true;
                }
                skyrmion.skyrmions.value = unref(acceleron.achievements.skyrmion.earned) ? 10 : 1;
            });
        },
        display: '<h2>Condense reality into 1 Entangled String</h2>',
        style: { width: buttonSize, height: buttonSize }
    }));
    const reset = createReset(() => ({
        thingsToReset() {
            const toReset: unknown[] = [
                skyrmion.skyrmions,
                skyrmion.pion,
                skyrmion.spinor,

                fome.protoversal,
                fome.infinitesimal,
                fome.subspatial,
                fome.subplanck,
                fome.quantum,

                acceleron.accelerons, acceleron.bestAccelerons, acceleron.totalAccelerons,
                acceleron.time, acceleron.upgrades, acceleron.loops,

                timecube,

                inflaton.inflatons, inflaton.inflating, inflaton.upgrades,
                inflaton.buildings,
                inflaton.coreResearch
            ];
            if (!unref(milestones[2].earned)) {
                toReset.push(skyrmion.upgrades, fome.achievements);
            }
            return toReset;
        }
    }))

    const milestones: Record<1|2|3|7, GenericAchievement> = {
        1: createAchievement(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost: 1
            })),
            display: {
                requirement: `1 ${strings.displayName}`,
                effect: `${acceleron.accelerons.displayName} and ${inflaton.inflatons.displayName} no longer inflate each other's costs`
            },
            small: false
        })),
        2: createAchievement(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost: 2
            })),
            display: {
                requirement: `2 ${strings.displayName}`,
                effect: jsx(() => <>
                    Unlock expansions to previous content<br />
                    Keep Skyrmion upgrades and Foam milestones
                </>)
            },
            small: false
        })),
        3: createAchievement(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost: 3
            })),
            display: {
                requirement: `3 ${strings.displayName}`,
                effect: 'Keep all parallel research and research queue researches'
            },
            small: false
        })),
        7: createAchievement(() => ({
            requirements: createCostRequirement(() => ({
                resource: noPersist(strings),
                cost: 7
            })),
            display: {
                requirement: `7 ${strings.displayName}`,
                effect: 'Unlock Fundamental Particles'
            },
            small: false
        }))
    }

    return {
        name,
        color,
        unlocked,
        strings,
        expansions,
        milestones,
        display: jsx(() => (
            <>
                <MainDisplay resource={strings} color={color} />
                <Row>
                    {renderCol(expansions.skyrmion, expansions.fome)}
                    <Column>
                        {render(resetButton)}
                        <Spacer height={buttonSize} />
                        {render(expansions.acceleron)}
                    </Column>
                    {renderCol(expansions.inflaton, expansions.timecube)}
                </Row>
                <Spacer />
                <div>The next {strings.displayName} requires:</div>
                <Spacer />
                <div style={{ color: acceleron.color }}>
                    {acceleron.accelerons.displayName}: {format(unref(requirements.acceleron.resource))} / {format(unref(requirements.acceleron.cost as ProcessedComputable<DecimalSource>))}
                </div>
                <div style={{ color: inflaton.color }}>
                    Stored {inflaton.inflatons.displayName}: {format(unref(requirements.inflaton.resource))} / {format(unref(requirements.inflaton.cost as ProcessedComputable<DecimalSource>))}
                </div>
                {isVisible(requirements.timecube.visibility)
                    ? <div style={{ color: timecube.color }}>
                        Total Timeline Score: {format(unref(requirements.timecube.resource))} / {format(unref(requirements.timecube.cost as ProcessedComputable<DecimalSource>))}
                    </div>
                    : undefined
                }
                <Spacer />
                {renderCol(...Object.values(milestones))}
            </>
        )),

        branchOrder,
        isFirstBranch
    };
});

export default layer;
