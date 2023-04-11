import { effectDecorator } from "features/decorators/common";
import { jsx } from "features/feature";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource, trackBest } from "features/resources/resource";
import { createUpgrade, EffectUpgrade, EffectUpgradeOptions, GenericUpgrade } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import { createCostRequirement } from "game/requirements";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { unref } from "vue";
import acceleron from "../acceleron/acceleron";
import TimecubeUpgradesVue from "./TimecubeUpgrades.vue";
import { noPersist } from "game/persistence"

const id = "timecube";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Time Cubes";
    const color = "#f037ea";
    
    const timecubes = createResource<DecimalSource>(0, "Time Cubes");
    const bestTimecubes = trackBest(timecubes);

    type Upgrades = 'tile' | 'time' | 'tier' | 'tilt' | 'tiny' |
                    'twice' | 'twist' | 'ten' | 'twirl' | 'tetrate' |
                    'tesselate' | 'triple' | 'turn' | 'tall' | 'tour' |
                    'tactics' | 'tower' | 'title' | 'tempo' | 'toil' |
                    'a' | 'b' | 'c' | 'd' | 'e'
    const upgrades: Record<Upgrades, GenericUpgrade | EffectUpgrade> = {
        tile: createUpgrade<EffectUpgradeOptions>(() => ({
            display: {
                title: 'Tile',
                description: 'log10(Accelerons) increases Time Cube gain',
                effectDisplay: jsx(() => <>{format(unref((upgrades.tile as EffectUpgrade).effect))}x</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dOne
            })),
            effect() { return Decimal.max(unref(acceleron.accelerons), 0).plus(1).log10() }
        }), effectDecorator),
        time: createUpgrade<EffectUpgradeOptions>(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.tile.bought) },
            display: {
                title: 'Time',
                description: 'log10(Best Time Cubes) increases Acceleron effect',
                effectDisplay: jsx(() => <>{format(unref((upgrades.time as EffectUpgrade).effect))}x</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dTwo
            })),
            effect() { return Decimal.max(unref(bestTimecubes), 0).plus(1).log10().plus(1) }
        }), effectDecorator),
        tier: createUpgrade<EffectUpgradeOptions>(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.time.bought) },
            display: {
                title: 'Tier',
                description: 'Each upgrade in this row gives a free level of every Foam Boost',
                effectDisplay: jsx(() => <>+{formatWhole(unref((upgrades.tier as EffectUpgrade).effect))} free levels</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(3)
            })),
            effect() { return [upgrades.tile, upgrades.time, upgrades.tier, upgrades.tilt, upgrades.tiny].filter(upgrade => unref(upgrade.bought)).length }
        }), effectDecorator),
        tilt: createUpgrade<EffectUpgradeOptions>(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.tier.bought) },
            display: {
                title: 'Tilt',
                description: 'Entropic Expansion is 50% stronger',
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dTen
            })),
            effect: 1.5
        }), effectDecorator),
        tiny: createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.tilt.bought) },
            display: {
                title: 'Tiny',
                description: 'Unlock another Entropic Loop'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(25)
            }))
        })),
        twice: createUpgrade<EffectUpgradeOptions>(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.tiny.bought) },
            display: () => ({
                title: 'Twice',
                description: `${unref(upgrades.triple.bought) ? 'Triple' : 'Double'} maximum entropy`
            }),
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(2500)
            })),
            effect() { return unref(upgrades.triple.bought) ? 3 : 2 }
        }), effectDecorator),
        twist: createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.twice.bought) },
            display: {
                title: 'Twist',
                description: 'You may select an additional first row Entropic Enhancement'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(4e8)
            }))
        })),
        ten: createUpgrade<EffectUpgradeOptions>(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.twist.bought) },
            display: {
                title: 'Ten',
                description: 'Increase Entropic Loop build speed by 10,000x',
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(5e8)
            })),
            effect: new Decimal(10000)
        }), effectDecorator),
        twirl: createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.ten.bought) },
            display: {
                title: 'Twirl',
                description: 'You may select an additional fourth row Entropic Enhancement'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(1.25e9)
            }))
        })),
        tetrate: createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(upgrades.twirl.bought) },
            display: {
                title: 'Tetrate',
                description: 'Unlock the fourth column of Entropic Enhancements'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(5e9)
            }))
        })),
        tesselate: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        triple: createUpgrade(() => ({
            visibility() { return unref(this.bought) || false },
            display: {
                title: 'Triple',
                description: 'Change <b>Twice</b> from double to triple'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(1e11)
            }))
        })),
        turn: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        tall: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        tour: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        tactics: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        tower: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        title: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        tempo: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        toil: createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        'a': createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        'b': createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        'c': createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        'd': createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
        'e': createUpgrade(() => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) })),
    }

    return {
        name,
        color,
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