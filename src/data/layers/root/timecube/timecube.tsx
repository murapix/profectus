import { jsx, showIf } from "features/feature";
import MainDisplayVue from "features/resources/MainDisplay.vue";
import { createResource, trackBest } from "features/resources/resource";
import { createUpgrade, GenericUpgrade } from "features/upgrades/upgrade";
import { BaseLayer, createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { unref } from "vue";
import acceleron from "../acceleron/acceleron";
import TimecubeUpgradesVue from "./TimecubeUpgrades.vue";

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
    const upgrades: Record<Upgrades, GenericUpgrade> = {
        tile: createUpgrade(() => ({
            display: {
                title: 'Tile',
                description: 'log10(Accelerons) increases Time Cube gain',
                effectDisplay: jsx(() => <>{format(unref(upgrades.tile.effect))}x</>)
            },
            cost: Decimal.dOne,
            resource: timecubes,
            effect() { return Decimal.max(unref(acceleron.accelerons), 0).plus(1).log10() }
        })),
        time: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.tile.bought)) },
            display: {
                title: 'Time',
                description: 'log10(Best Time Cubes) increases Acceleron effect',
                effectDisplay: jsx(() => <>{format(unref(upgrades.time.effect))}x</>)
            },
            cost: Decimal.dTwo,
            resource: timecubes,
            effect() { return Decimal.max(unref(bestTimecubes), 0).plus(1).log10().plus(1) }
        })),
        tier: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.time.bought)) },
            display: {
                title: 'Tier',
                description: 'Each upgrade in this row gives a free level of every Foam Boost',
                effectDisplay: jsx(() => <>+{formatWhole(unref(upgrades.tier.effect))} free levels</>)
            },
            cost: new Decimal(3),
            resource: timecubes,
            effect() { return [upgrades.tile, upgrades.time, upgrades.tier, upgrades.tilt, upgrades.tiny].filter(upgrade => unref(upgrade.bought)).length }
        })),
        tilt: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.tier.bought)) },
            display: {
                title: 'Tilt',
                description: 'Entropic Expansion is 50% stronger',
            },
            cost: Decimal.dTen,
            resource: timecubes,
            effect: 1.5
        })),
        tiny: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.tilt.bought)) },
            display: {
                title: 'Tiny',
                description: 'Unlock another Entropic Loop'
            },
            cost: new Decimal(25),
            resource: timecubes
        })),
        twice: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.tiny.bought)) },
            display: () => ({
                title: 'Twice',
                description: `${unref(upgrades.triple.bought) ? 'Triple' : 'Double'} maximum entropy`
            }),
            cost: new Decimal(2500),
            resource: timecubes,
            effect() { return unref(upgrades.triple.bought) ? 3 : 2 }
        })),
        twist: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.twice.bought)) },
            display: {
                title: 'Twist',
                description: 'You may select an additional first row Entropic Enhancement'
            },
            cost: new Decimal(4e8),
            resource: timecubes
        })),
        ten: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.twist.bought)) },
            display: {
                title: 'Ten',
                description: 'Increase Entropic Loop build speed by 10,000x',
            },
            cost: new Decimal(5e8),
            resource: timecubes,
            effect: new Decimal(10000)
        })),
        twirl: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.ten.bought)) },
            display: {
                title: 'Twirl',
                description: 'You may select an additional fourth row Entropic Enhancement'
            },
            cost: new Decimal(1.25e9),
            resource: timecubes
        })),
        tetrate: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || unref(upgrades.twirl.bought)) },
            display: {
                title: 'Tetrate',
                description: 'Unlock the fourth column of Entropic Enhancements'
            },
            cost: new Decimal(5e9),
            resource: timecubes
        })),
        tesselate: createUpgrade(() => ({visibility: showIf(false)})),
        triple: createUpgrade(() => ({
            visibility() { return showIf(unref(this.bought) || false) },
            display: {
                title: 'Triple',
                description: 'Change <b>Twice</b> from double to triple'
            },
            cost: new Decimal(1e11),
            resource: timecubes
        })),
        turn: createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        tall: createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        tour: createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        tactics: createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        tower: createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        title: createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        tempo: createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        toil: createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        'a': createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        'b': createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        'c': createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        'd': createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
        'e': createUpgrade(() => ({ visibility() { return showIf(false) }, display: { description: "X" }, cost: Decimal.dInf, resource: timecubes })),
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