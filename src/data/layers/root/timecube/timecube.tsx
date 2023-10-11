import { effectDecorator } from "features/decorators/common";
import { jsx } from "features/feature";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource, trackBest } from "features/resources/resource";
import { createUpgrade, EffectUpgrade, EffectUpgradeOptions } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { Ref, computed, unref } from "vue";
import acceleron from "../acceleron/acceleron";
import TimecubeUpgradesVue from "./TimecubeUpgrades.vue";
import { noPersist } from "game/persistence"
import entangled from "../entangled/entangled";
import fome, { FomeTypes } from "../fome/fome";

const id = "timecube";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Time Cubes";
    const color = "#f037ea";

    const unlocked: Ref<boolean> = computed(() => unref(entangled.milestones[1].earned) || unref(acceleron.loops.loops.timecube.built));
    
    const timecubes = createResource<DecimalSource>(0, "Time Cubes");
    const bestTimecubes = trackBest(timecubes);

    const upgrades = (() => {
        const tile = createUpgrade<EffectUpgradeOptions<Decimal>>(upgrade => ({
            display: {
                title: 'Tile',
                description: 'log10(Accelerons) increases Time Cube gain',
                effectDisplay: jsx(() => <>{format(unref((upgrade as EffectUpgrade<Decimal>).effect))}x</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1
            })),
            effect() { return Decimal.max(unref(acceleron.accelerons), 0).plus(1).log10() }
        }), effectDecorator) as EffectUpgrade<Decimal>;
        const time = createUpgrade<EffectUpgradeOptions<Decimal>>(upgrade => ({
            visibility() { return unref(this.bought) || unref(tile.bought) },
            display: {
                title: 'Time',
                description: 'log10(Best Time Cubes) increases Acceleron effect',
                effectDisplay: jsx(() => <>{format(unref((upgrade as EffectUpgrade<DecimalSource>).effect))}x</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 2
            })),
            effect() { return Decimal.max(unref(bestTimecubes), 0).plus(1).log10().plus(1) }
        }), effectDecorator) as EffectUpgrade<Decimal>;
        const tier = createUpgrade<EffectUpgradeOptions<number>>(upgrade => ({
            visibility() { return unref(this.bought) || unref(time.bought) },
            display: {
                title: 'Tier',
                description: 'Each upgrade in this row gives a free level of every Foam Boost',
                effectDisplay: jsx(() => <>+{formatWhole(unref((upgrade as EffectUpgrade<number>).effect))} free levels</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 3
            })),
            effect(): number { return [tile, time, this, tilt, tiny].filter(upgrade => unref(upgrade.bought)).length }
        }), effectDecorator) as EffectUpgrade<number>;
        const tilt = createUpgrade<EffectUpgradeOptions<number>>(() => ({
            visibility() { return unref(this.bought) || unref(tier.bought) },
            display: {
                title: 'Tilt',
                description: 'Entropic Expansion is 50% stronger',
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 10
            })),
            effect: 1.5
        }), effectDecorator) as EffectUpgrade<number>;
        const tiny = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(tilt.bought) },
            display: {
                title: 'Tiny',
                description: 'Unlock another Entropic Loop'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 25
            }))
        }));
        const twice = createUpgrade<EffectUpgradeOptions<number>>(() => ({
            visibility() { return unref(this.bought) || unref(tiny.bought) },
            display: () => ({
                title: 'Twice',
                description: `${unref(triple.bought) ? 'Triple' : 'Double'} maximum entropy`
            }),
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 2500
            })),
            effect() { return unref(triple.bought) ? 3 : 2 }
        }), effectDecorator) as EffectUpgrade<number>;
        const twist = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(twice.bought) },
            display: {
                title: 'Twist',
                description: 'You may select an additional first row Entropic Enhancement'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 4e8
            }))
        }));
        const ten = createUpgrade<EffectUpgradeOptions<number>>(() => ({
            visibility() { return unref(this.bought) || unref(twist.bought) },
            display: {
                title: 'Ten',
                description: 'Increase Entropic Loop build speed by 10,000x',
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 5e8
            })),
            effect: 10000
        }), effectDecorator) as EffectUpgrade<number>;
        const twirl = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(ten.bought) },
            display: {
                title: 'Twirl',
                description: 'You may select an additional fourth row Entropic Enhancement'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1.25e9
            }))
        }));
        const tetrate = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(twirl.bought) },
            display: {
                title: 'Tetrate',
                description: 'Unlock the fourth column of Entropic Enhancements'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 5e9
            }))
        }));
        const tesselate = createUpgrade(() => ({
            visibility() { return unref(this.bought) || (unref(tetrate.bought) && unref(entangled.expansions.timecube.bought)) },
            display: {
                title: 'Tesselate',
                description: 'Unlock Time Squares'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1e6
            }))
        }));
        const triple = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(tesselate.bought) },
            display: {
                title: 'Triple',
                description: 'Change <b>Twice</b> from double to triple'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1e11
            }))
        }));
        const turn = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(tesselate.bought) },
            display: {
                title: 'Triple',
                description: 'Front squares are 50% stronger'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1e12
            }))
        }));
        const tall = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(turn.bought) },
            display: {
                title: 'Tall',
                description: 'Bottom squares are 50% stronger'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 2e12
            }))
        }));
        const tour = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(turn.bought) },
            display: {
                title: 'Tour',
                description: 'Double the Acceleron effect'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 5e12
            }))
        }));
        const tactics = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(tour.bought) },
            display: {
                title: 'Tactics',
                description: 'Unlock Timelines'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1e13
            }))
        }));
        const tower = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(tactics.bought) },
            display: {
                title: 'Tactics',
                description: 'While in at least one Top timeline, Foam retainment applies to Pions and Spinors as well'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1e16
            }))
        }));
        const title = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(tactics.bought) },
            display: {
                title: 'Title',
                description: 'Best timeline scores also increase their corresponding Time Square gain'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1e17
            }))
        }));
        const tempo = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(tactics.bought) },
            display: {
                title: 'Tempo',
                description: 'The first entropic loop always produces at least one Acceleron'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1e18
            }))
        }));
        const fomeLimits: Record<FomeTypes, number> = {
            [FomeTypes.protoversal]: 1e46,
            [FomeTypes.infinitesimal]: 3e38,
            [FomeTypes.subspatial]: 1e31,
            [FomeTypes.subplanck]: 3e23,
            [FomeTypes.quantum]: 1e16
        };
        const toil = createUpgrade<EffectUpgradeOptions<Record<FomeTypes, DecimalSource>>>(() => ({
            visibility() { return unref(this.bought) || unref(tactics.bought) },
            display: {
                title: 'Toil',
                description: 'While in at least one Left timeline, Foam gain is massively increased based on how little of that Foam you have'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: 1e19
            })),
            effect() {
                if (unref(this.bought)) {
                    return Object.fromEntries((Object.entries(fomeLimits) as [FomeTypes, number][]).map(([type, limit]) => [type,
                        Decimal.minus(Math.E/Math.PI, Decimal.div(unref(fome[type].amount), limit)).pow10().times(15).plus(1)
                    ])) as Record<FomeTypes, Decimal>;
                }
                return Object.fromEntries(Object.keys(fomeLimits).map(type => [type, 1])) as Record<FomeTypes, number>
            }
        }));
        const a = createUpgrade(upgrade => ({
            visibility() { return false },
            display: {
                description: "X"
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dInf
            }))
        }));
        const b = createUpgrade(upgrade => ({
            visibility() { return false },
            display: {
                description: "X"
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dInf
            }))
        }));
        const c = createUpgrade(upgrade => ({
            visibility() { return false },
            display: {
                description: "X"
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dInf
            }))
        }));
        const d = createUpgrade(upgrade => ({
            visibility() { return false },
            display: {
                description: "X"
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dInf
            }))
        }));
        const e = createUpgrade(upgrade => ({
            visibility() { return false },
            display: {
                description: "X"
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dInf
            }))
        }));

        return {
            tile, time, tier, tilt, tiny,
            twice, twist, ten, twirl, tetrate,
            tesselate, triple, turn, tall, tour,
            tactics, tower, title, tempo, toil,
            a, b, c, d, e
        }
    })();

    return {
        name,
        color,
        unlocked,
        timecubes,
        bestTimecubes,
        upgrades,
        display: jsx(() => (
            <>
                <MainDisplayVue resource={timecubes} color={color} />
                <TimecubeUpgradesVue upgrades={Object.values(upgrades)} />
            </>
        ))
    }
})

export default layer;