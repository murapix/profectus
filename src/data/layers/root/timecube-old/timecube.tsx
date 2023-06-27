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
import acceleron from "../acceleron-old/acceleron";
import TimecubeUpgradesVue from "./TimecubeUpgrades.vue";
import { noPersist } from "game/persistence"

const id = "timecube";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Time Cubes";
    const color = "#f037ea";
    
    const timecubes = createResource<DecimalSource>(0, "Time Cubes");
    const bestTimecubes = trackBest(timecubes);

    const upgrades = (() => {
        const tile = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            display: {
                title: 'Tile',
                description: 'log10(Accelerons) increases Time Cube gain',
                effectDisplay: jsx(() => <>{format(unref((upgrade as EffectUpgrade<DecimalSource>).effect))}x</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dOne
            })),
            effect() { return Decimal.max(unref(acceleron.accelerons), 0).plus(1).log10() }
        }), effectDecorator);
        const time = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || unref(tile.bought) },
            display: {
                title: 'Time',
                description: 'log10(Best Time Cubes) increases Acceleron effect',
                effectDisplay: jsx(() => <>{format(unref((upgrade as EffectUpgrade<DecimalSource>).effect))}x</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dTwo
            })),
            effect() { return Decimal.max(unref(bestTimecubes), 0).plus(1).log10().plus(1) }
        }), effectDecorator);
        const tier = createUpgrade<EffectUpgradeOptions>(upgrade => ({
            visibility() { return unref(this.bought) || unref(time.bought) },
            display: {
                title: 'Tier',
                description: 'Each upgrade in this row gives a free level of every Foam Boost',
                effectDisplay: jsx(() => <>+{formatWhole(unref((upgrade as EffectUpgrade<DecimalSource>).effect))} free levels</>)
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(3)
            })),
            effect() { return [tile, time, tier, tilt, tiny].filter(upgrade => unref(upgrade.bought)).length }
        }), effectDecorator);
        const tilt = createUpgrade<EffectUpgradeOptions>(() => ({
            visibility() { return unref(this.bought) || unref(tier.bought) },
            display: {
                title: 'Tilt',
                description: 'Entropic Expansion is 50% stronger',
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: Decimal.dTen
            })),
            effect: 1.5
        }), effectDecorator);
        const tiny = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(tilt.bought) },
            display: {
                title: 'Tiny',
                description: 'Unlock another Entropic Loop'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(25)
            }))
        }));
        const twice = createUpgrade<EffectUpgradeOptions>(() => ({
            visibility() { return unref(this.bought) || unref(tiny.bought) },
            display: () => ({
                title: 'Twice',
                description: `${unref(triple.bought) ? 'Triple' : 'Double'} maximum entropy`
            }),
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(2500)
            })),
            effect() { return unref(triple.bought) ? 3 : 2 }
        }), effectDecorator);
        const twist = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(twice.bought) },
            display: {
                title: 'Twist',
                description: 'You may select an additional first row Entropic Enhancement'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(4e8)
            }))
        }));
        const ten = createUpgrade<EffectUpgradeOptions>(() => ({
            visibility() { return unref(this.bought) || unref(twist.bought) },
            display: {
                title: 'Ten',
                description: 'Increase Entropic Loop build speed by 10,000x',
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(5e8)
            })),
            effect: new Decimal(10000)
        }), effectDecorator);
        const twirl = createUpgrade(() => ({
            visibility() { return unref(this.bought) || unref(ten.bought) },
            display: {
                title: 'Twirl',
                description: 'You may select an additional fourth row Entropic Enhancement'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(1.25e9)
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
                cost: new Decimal(5e9)
            }))
        }));
        const tesselate = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const triple = createUpgrade(() => ({
            visibility() { return unref(this.bought) || false },
            display: {
                title: 'Triple',
                description: 'Change <b>Twice</b> from double to triple'
            },
            requirements: createCostRequirement(() => ({
                resource: noPersist(timecubes),
                cost: new Decimal(1e11)
            }))
        }));
        const turn = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const tall = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const tour = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const tactics = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const tower = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const title = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const tempo = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const toil = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const a = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const b = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const c = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const d = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));
        const e = createUpgrade(upgrade => ({ visibility() { return false }, display: { description: "X" }, requirements: createCostRequirement(() => ({ resource: noPersist(timecubes), cost: Decimal.dInf })) }));

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