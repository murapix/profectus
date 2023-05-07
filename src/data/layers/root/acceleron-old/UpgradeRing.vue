<template>
    <div class="ring-container" :style="{top: `${unref(radius)}px`}">
        <template v-for="(upgrades, side) in upgradeData">
            <template v-for="upgrade in unref(upgrades)" :key="upgrade.upgrade.id">
                <svg :width="unref(upgrade.ring.size).width"
                     :height="unref(upgrade.ring.size).height"
                     :style="{...unref(upgrade.ring.position), '--shadow-id': `url(#${upgrade.upgrade.id}-shadow)` }"
                      class="ring-segment"
                     :id="`${upgrade.upgrade.id}-ring`"
                      v-if="isVisible(upgrade.upgrade.upgrade.visibility)"
                     @mouseenter="onMouseEnter(upgrade.upgrade.id)"
                     @mouseleave="onMouseLeave(upgrade.upgrade.id)"
                     @click="upgrade.upgrade.upgrade.purchase">
                    <path :d="unref(upgrade.ring.path)" :stroke="unref(upgrade.upgrade.color)" :stroke-width="`${values.global.border}px`" fill="var(--background)"
                        :class="{ can: unref(upgrade.upgrade.upgrade.canPurchase) }"/>
                    <filter :id="`${upgrade.upgrade.id}-shadow`">
                        <feOffset dx="0" dy="0" />
                        <feGaussianBlur stdDeviation="0" result="offset-blur">
                            <animate attributeName="stdDeviation" restart="whenNotActive" fill="freeze"
                                        to="6" dur="0.5s" begin="indefinite" />
                            <animate attributeName="stdDeviation" restart="whenNotActive" fill="freeze"
                                        to="0" dur="0.5s" begin="indefinite" />
                        </feGaussianBlur>
                        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                        <feFlood :flood-color="unref(upgrade.upgrade.color)" flood-opacity="1" result="color" />
                        <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                    </filter>
                </svg>
                <svg :width="unref(upgrade.line.size).width"
                     :height="unref(upgrade.line.size).height"
                     :style="unref(upgrade.line.position)"
                     class="ring-line"
                     v-if="isVisible(upgrade.upgrade.upgrade.visibility)">
                     <path :d="unref(upgrade.line.path)" :stroke="unref(upgrade.upgrade.color)" :stroke-width="`${values.global.border}px`" fill="none" />
                </svg>
                <div :id="`${upgrade.upgrade.id}-upgrade`">
                    <component :is="upgrade.upgrade.render"
                               :style="{...unref(upgrade.upgrade.position), width: values.upgrade.width, minHeight: values.upgrade.height}"
                                class="ring-upgrade"
                               :class="side"
                               @mouseenter="onMouseEnter(upgrade.upgrade.id)"
                               @mouseleave="onMouseLeave(upgrade.upgrade.id)"/>
                </div>
            </template>
        </template>
    </div>
</template>

<script lang="ts">
import { render, processedPropType, unwrapRef } from "util/vue";
import { computed, ComputedRef, DefineComponent, defineComponent, toRefs, unref } from "vue";
import { GenericUpgrade } from "features/upgrades/upgrade";
import { isVisible } from "features/feature";

export default defineComponent({
    props: {
        radius: {
            type: processedPropType<number>(Number),
            required: true
        },
        width: {
            type: processedPropType<number>(Number),
            required: true
        },
        distance: {
            type: processedPropType<number>(Number),
            required: true
        },
        top: {
            type: processedPropType<number>(Number),
            required: true
        },
        right: {
            type: processedPropType<GenericUpgrade[]>(Array),
            required: true
        },
        bottom: {
            type: processedPropType<number>(Number),
            required: true
        },
        left: {
            type: processedPropType<GenericUpgrade[]>(Array),
            required: true
        }
    },
    setup(props) {
        type Side = "left" | "right";
        
        const { radius, width, distance, top, right, bottom, left } = toRefs(props);

        const values = {
            global: {
                margin: 5,
                border: 2
            },
            upgrade: {
                width: 250,
                height: 125
            },
            line: {
                x: 8,
                y: 32,
                radius: computed(() => unref(outerRadius) + unwrapRef(width))
            }
        }

        const visibleSegments: Record<Side, ComputedRef<number>> = {
            left: computed(() => unwrapRef(left).filter(upgrade => isVisible(upgrade.visibility)).length),
            right: computed(() => unwrapRef(right).filter(upgrade => isVisible(upgrade.visibility)).length)
        };

        const lengths = {
            top: computed(() => unwrapRef(top)),
            right: computed(() => unwrapRef(right).length),
            bottom: computed(() => unwrapRef(bottom)),
            left: computed(() => unwrapRef(left).length)
        };
        const numSegments = computed(() => Object.values(lengths).map(length => unref(length)).reduce((a,b) => a+b));
        const anglePerSegment = computed(() => 2*Math.PI / unref(numSegments));

        const innerRadius = computed(() => unwrapRef(radius));
        const outerRadius = computed(() => unwrapRef(radius) + unwrapRef(width));
        const innerArc = computed(() => unref(innerRadius) * unref(anglePerSegment) - (values.global.margin+values.global.border));
        const outerArc = computed(() => unref(outerRadius) * unref(anglePerSegment) - (values.global.margin+values.global.border));
        const innerAngle = computed(() => unref(innerArc) / unref(innerRadius));
        const outerAngle = computed(() => unref(outerArc) / unref(outerRadius));
        
        type Points = number[][];
        type Bounds = { minX: number, minY: number, maxX: number, maxY: number };
        type Size = { width: number, height: number };
        type Offset = { x: number, y: number };
        type Position = { top: string, left: string };
        type Base = {
            index: ComputedRef<number>,
            angle: ComputedRef<number>
        };
        type Ring = {
            points: ComputedRef<Points>,
            bounds: ComputedRef<Bounds>,
            size: ComputedRef<Size>,
            position: ComputedRef<Position>,
            path: ComputedRef<string>
        };
        type Upgrade = {
            upgrade: GenericUpgrade,
            render: JSX.Element | DefineComponent,
            id: string,
            color: ComputedRef<string>,
            distance: ComputedRef<number>,
            offset: ComputedRef<Offset>,
            position: ComputedRef<Position>
        };
        type Line = {
            height: ComputedRef<number>,
            angle: ComputedRef<number>,
            radius: ComputedRef<number>,
            points: ComputedRef<Points>,
            bounds: ComputedRef<Bounds>
            size: ComputedRef<Size>,
            position: ComputedRef<Position>,
            path: ComputedRef<string>
        }

        const upgradeData: Record<Side, { base: Base, ring: Ring, upgrade: Upgrade, line: Line }[]> = {
            left: unwrapRef(left).map((upgrade, index, array) => ({
                base: {
                    index: (() => {
                        if (index === 0) return computed(() => 0);
                        return computed(() => unref(upgradeData.left[index-1].base.index) + (isVisible(array[index-1].visibility) ? 1 : 0));
                    })(),
                    angle: computed(() => Math.PI - unref(anglePerSegment) * (unref(upgradeData.left[index].base.index) - unref(visibleSegments.left)/2 + 0.5))
                },
                ring: {
                    points: computed(() => {
                        let baseAngle = unref(upgradeData.left[index].base.angle);
                        let innerMin = [baseAngle - unref(innerAngle)/2, unref(innerRadius)];
                        let innerMax = [baseAngle + unref(innerAngle)/2, unref(innerRadius)];
                        let outerMin = [baseAngle - unref(outerAngle)/2, unref(outerRadius)];
                        let outerMax = [baseAngle + unref(outerAngle)/2, unref(outerRadius)];

                        return [innerMin, innerMax, outerMax, outerMin].map(([angle, radius]) => [Math.cos(angle) * radius, Math.sin(angle) * radius]);
                    }),
                    bounds: computed(() => {
                        let points = unref(upgradeData.left[index].ring.points);
                        let bounds = {
                            minX: Math.min(...points.map(point => point[0])),
                            maxX: Math.max(...points.map(point => point[0])),
                            minY: Math.min(...points.map(point => point[1])),
                            maxY: Math.max(...points.map(point => point[1]))
                        };
                        if (Math.sign(bounds.minY) !== Math.sign(bounds.maxY)) {
                            bounds.minX = Math.min(-unref(outerRadius), bounds.minX);
                        }
                        return bounds;
                    }),
                    size: computed(() => {
                        let bounds = unref(upgradeData.left[index].ring.bounds);
                        return {
                            width: bounds.maxX - bounds.minX + values.global.border,
                            height: bounds.maxY - bounds.minY + values.global.border
                        };
                    }),
                    position: computed(() => {
                        let bounds = unref(upgradeData.left[index].ring.bounds);
                        return {
                            top: `${bounds.minY - values.global.border/2}px`,
                            left: `${bounds.minX - values.global.border/2}px`
                        };
                    }),
                    path: computed(() => {
                        let inner = unref(innerRadius);
                        let outer = unref(outerRadius);
                        let points = unref(upgradeData.left[index].ring.points);
                        let bounds = unref(upgradeData.left[index].ring.bounds);
                        let p = points.map(point => [
                            point[0] - bounds.minX + values.global.border/2,
                            point[1] - bounds.minY + values.global.border/2
                        ]);
                        return [
                            `M ${p[0][0]} ${p[0][1]}`,
                            `A ${inner} ${inner} 0 0 1 ${p[1][0]} ${p[1][1]}`,
                            `L ${p[2][0]} ${p[2][1]}`,
                            `A ${outer} ${outer} 0 0 0 ${p[3][0]} ${p[3][1]}`,
                            'Z'
                        ].join(' ');
                    })
                },
                upgrade: {
                    upgrade,
                    render: render(upgrade),
                    id: upgrade.id,
                    color: computed(() => {
                        if (unref(upgrade.bought)) return 'var(--bought)';
                        else if (unref(upgrade.canPurchase)) return 'var(--layer-color)';
                        else return 'var(--locked)';
                    }),
                    distance: computed(() => {
                        let angle = unref(upgradeData.left[index].base.angle);
                        if (angle === 0) return unref(outerRadius);
                        let segmentIndex = (Math.PI - angle) / unref(anglePerSegment);
                        let height = (values.upgrade.height + values.global.margin) * segmentIndex;
                        return height / Math.sin(angle);
                    }),
                    offset: computed(() => {
                        let angle = unref(upgradeData.left[index].base.angle);
                        let radius = unref(upgradeData.left[index].upgrade.distance);

                        let outerPos = Math.cos(angle) * radius;
                        let innerPos = Math.cos(angle) * unref(outerRadius);

                        return {
                            x: Math.min(outerPos - innerPos, -unwrapRef(distance)) + innerPos - values.upgrade.width/2,
                            y: Math.sin(angle) * radius
                        };
                    }),
                    position: computed(() => {
                        let offset = unref(upgradeData.left[index].upgrade.offset);
                        return {
                            top: `${offset.y - values.upgrade.height/2}px`,
                            left: `${offset.x - values.upgrade.width/2}px`
                        }
                    })
                },
                line: {
                    height: computed(() => {
                        let angle = unref(upgradeData.left[index].base.angle);
                        let segmentIndex = (Math.PI - angle) / unref(anglePerSegment);
                        return (values.upgrade.height + values.global.margin) * segmentIndex + values.line.y - values.upgrade.height/2;
                    }),
                    angle: computed(() => {
                        let radius = unref(values.line.radius);
                        let height = unref(upgradeData.left[index].line.height);
                        let angle = Math.PI - Math.asin(height / radius);
                        return Math.min(unref(upgradeData.left[index].base.angle) + unref(outerAngle)/2, angle)
                    }),
                    radius: computed(() => {
                        let height = unref(upgradeData.left[index].line.height);
                        let angle = unref(upgradeData.left[index].line.angle);
                        return height / Math.sin(angle);
                    }),
                    points: computed(() => {
                        let angle = unref(upgradeData.left[index].line.angle);
                        let height = unref(upgradeData.left[index].line.height);
                        let radius = unref(upgradeData.left[index].line.radius);
                        return [
                            [unref(upgradeData.left[index].upgrade.offset).x - values.upgrade.width/2 + values.line.x, height],
                            [Math.cos(angle) * radius, height],
                            [Math.cos(angle) * unref(outerRadius), Math.sin(angle) * unref(outerRadius)]
                        ]
                    }),
                    bounds: computed(() => {
                        let points = unref(upgradeData.left[index].line.points);
                        return {
                            minX: Math.min(...points.map(point => point[0])),
                            maxX: Math.max(...points.map(point => point[0])),
                            minY: Math.min(...points.map(point => point[1])),
                            maxY: Math.max(...points.map(point => point[1]))
                        }
                    }),
                    size: computed(() => {
                        let bounds = unref(upgradeData.left[index].line.bounds);
                        return {
                            width: bounds.maxX - bounds.minX + values.global.border,
                            height: bounds.maxY - bounds.minY + values.global.border
                        }
                    }),
                    position: computed(() => {
                        let bounds = unref(upgradeData.left[index].line.bounds);
                        return {
                            top: `${bounds.minY - values.global.border/2}px`,
                            left: `${bounds.minX - values.global.border/2}px`
                        };
                    }),
                    path: computed(() => {
                        let points = unref(upgradeData.left[index].line.points);
                        let bounds = unref(upgradeData.left[index].line.bounds);
                        let p = points.map(point => [
                            point[0] - bounds.minX + values.global.border/2,
                            point[1] - bounds.minY + values.global.border/2
                        ]);
                        return [
                            `M ${p[0][0]} ${p[0][1]}`,
                            `L ${p[1][0]} ${p[1][1]}`,
                            `L ${p[2][0]} ${p[2][1]}`
                        ].join(' ');
                    })
                }
            })),
            right: unwrapRef(right).map((upgrade, index, array) => ({
                base: {
                    index: (() => {
                        if (index === 0) return computed(() => 0);
                        return computed(() => unref(upgradeData.right[index-1].base.index) + (isVisible(array[index-1].visibility) ? 1 : 0));
                    })(),
                    angle: computed(() => unref(anglePerSegment) * (unref(upgradeData.right[index].base.index) - unref(visibleSegments.right)/2 + 0.5))
                },
                ring: {
                    points: computed(() => {
                        let baseAngle = unref(upgradeData.right[index].base.angle);
                        let innerMin = [baseAngle - unref(innerAngle)/2, unref(innerRadius)];
                        let innerMax = [baseAngle + unref(innerAngle)/2, unref(innerRadius)];
                        let outerMin = [baseAngle - unref(outerAngle)/2, unref(outerRadius)];
                        let outerMax = [baseAngle + unref(outerAngle)/2, unref(outerRadius)];

                        return [innerMin, innerMax, outerMax, outerMin].map(([angle, radius]) => [Math.cos(angle) * radius, Math.sin(angle) * radius]);
                    }),
                    bounds: computed(() => {
                        let points = unref(upgradeData.right[index].ring.points);
                        let bounds = {
                            minX: Math.min(...points.map(point => point[0])),
                            maxX: Math.max(...points.map(point => point[0])),
                            minY: Math.min(...points.map(point => point[1])),
                            maxY: Math.max(...points.map(point => point[1]))
                        };
                        if (Math.sign(bounds.minY) !== Math.sign(bounds.maxY)) {
                            bounds.maxX = Math.max(unref(outerRadius), bounds.maxX);
                        }
                        return bounds;
                    }),
                    size: computed(() => {
                        let bounds = unref(upgradeData.right[index].ring.bounds);
                        return {
                            width: bounds.maxX - bounds.minX + values.global.border,
                            height: bounds.maxY - bounds.minY + values.global.border
                        };
                    }),
                    position: computed(() => {
                        let bounds = unref(upgradeData.right[index].ring.bounds);
                        return {
                            top: `${bounds.minY - values.global.border/2}px`,
                            left: `${bounds.minX - values.global.border/2}px`
                        };
                    }),
                    path: computed(() => {
                        let inner = unref(innerRadius);
                        let outer = unref(outerRadius);
                        let points = unref(upgradeData.right[index].ring.points);
                        let bounds = unref(upgradeData.right[index].ring.bounds);
                        let p = points.map(point => [
                            point[0] - bounds.minX + values.global.border/2,
                            point[1] - bounds.minY + values.global.border/2
                        ]);
                        return [
                            `M ${p[0][0]} ${p[0][1]}`,
                            `A ${inner} ${inner} 0 0 1 ${p[1][0]} ${p[1][1]}`,
                            `L ${p[2][0]} ${p[2][1]}`,
                            `A ${outer} ${outer} 0 0 0 ${p[3][0]} ${p[3][1]}`,
                            'Z'
                        ].join(' ');
                    })
                },
                upgrade: {
                    upgrade,
                    render: render(upgrade),
                    id: upgrade.id,
                    color: computed(() => {
                        if (unref(upgrade.bought)) return 'var(--bought)';
                        else if (unref(upgrade.canPurchase)) return 'var(--layer-color)';
                        else return 'var(--locked)';
                    }),
                    distance: computed(() => {
                        let angle = unref(upgradeData.right[index].base.angle);
                        if (angle === 0) return unref(outerRadius);
                        let segmentIndex = angle / unref(anglePerSegment);
                        let height = (values.upgrade.height + values.global.margin) * segmentIndex;
                        return height / Math.sin(angle);
                    }),
                    offset: computed(() => {
                        let angle = unref(upgradeData.right[index].base.angle);
                        let radius = unref(upgradeData.right[index].upgrade.distance);

                        let outerPos = Math.cos(angle) * radius;
                        let innerPos = Math.cos(angle) * unref(outerRadius);

                        return {
                            x: Math.max(outerPos - innerPos, unwrapRef(distance)) + innerPos + values.upgrade.width/2,
                            y: Math.sin(angle) * radius
                        };
                    }),
                    position: computed(() => {
                        let offset = unref(upgradeData.right[index].upgrade.offset);
                        return {
                            top: `${offset.y - values.upgrade.height/2}px`,
                            left: `${offset.x - values.upgrade.width/2}px`
                        }
                    })
                },
                line: {
                    height: computed(() => {
                        let angle = unref(upgradeData.right[index].base.angle);
                        let segmentIndex = angle / unref(anglePerSegment);
                        return (values.upgrade.height + values.global.margin) * segmentIndex + values.line.y - values.upgrade.height/2;
                    }),
                    angle: computed(() => {
                        let radius = unref(values.line.radius);
                        let height = unref(upgradeData.right[index].line.height);
                        let angle = Math.asin(height / radius);
                        return Math.max(unref(upgradeData.right[index].base.angle) - unref(outerAngle)/2, angle)
                    }),
                    radius: computed(() => {
                        let height = unref(upgradeData.right[index].line.height);
                        let angle = unref(upgradeData.right[index].line.angle);
                        return height / Math.sin(angle);
                    }),
                    points: computed(() => {
                        let angle = unref(upgradeData.right[index].line.angle);
                        let height = unref(upgradeData.right[index].line.height);
                        let radius = unref(upgradeData.right[index].line.radius);
                        return [
                            [unref(upgradeData.right[index].upgrade.offset).x + values.upgrade.width/2 - values.line.x, height],
                            [Math.cos(angle) * radius, height],
                            [Math.cos(angle) * unref(outerRadius), Math.sin(angle) * unref(outerRadius)]
                        ]
                    }),
                    bounds: computed(() => {
                        let points = unref(upgradeData.right[index].line.points);
                        return {
                            minX: Math.min(...points.map(point => point[0])),
                            maxX: Math.max(...points.map(point => point[0])),
                            minY: Math.min(...points.map(point => point[1])),
                            maxY: Math.max(...points.map(point => point[1]))
                        }
                    }),
                    size: computed(() => {
                        let bounds = unref(upgradeData.right[index].line.bounds);
                        return {
                            width: bounds.maxX - bounds.minX + values.global.border,
                            height: bounds.maxY - bounds.minY + values.global.border
                        }
                    }),
                    position: computed(() => {
                        let bounds = unref(upgradeData.right[index].line.bounds);
                        return {
                            top: `${bounds.minY - values.global.border/2}px`,
                            left: `${bounds.minX - values.global.border/2}px`
                        };
                    }),
                    path: computed(() => {
                        let points = unref(upgradeData.right[index].line.points);
                        let bounds = unref(upgradeData.right[index].line.bounds);
                        let p = points.map(point => [
                            point[0] - bounds.minX + values.global.border/2,
                            point[1] - bounds.minY + values.global.border/2
                        ]);
                        return [
                            `M ${p[0][0]} ${p[0][1]}`,
                            `L ${p[1][0]} ${p[1][1]}`,
                            `L ${p[2][0]} ${p[2][1]}`
                        ].join(' ');
                    })
                }
            }))
        };

        function onMouseEnter(id: string) {
            (document.getElementById(`${id}-ring`)?.children[1].children[1].children[0] as SVGAnimationElement).beginElement();
            document.getElementById(`${id}-upgrade`)?.children[0].classList.add("hover");
        }

        function onMouseLeave(id: string) {
            (document.getElementById(`${id}-ring`)?.children[1].children[1].children[1] as SVGAnimationElement).beginElement();
            document.getElementById(`${id}-upgrade`)?.children[0].classList.remove("hover");
        }

        return {
            render,
            unref,
            isVisible,

            onMouseEnter,
            onMouseLeave,

            upgradeData,
            values
        }
    }
})
</script>

<style scoped>
.ring-container {
    pointer-events: none;
    position: relative;
    width: max-content;
    min-height: max-content;
}

.ring-segment {
    pointer-events: fill;
    position: absolute;
    top: 0;
    left: 0;
}

.ring-segment > :deep(.can) {
    transform: none;
    filter: var(--shadow-id);
}

.ring-line {
    position: absolute;
    top: 0;
    left: 0;
}

:deep(.ring-upgrade.ring-upgrade) {
    pointer-events: all;
    
    margin: 0;
    padding: 5px 10px;
    width: 250px;
    min-height: 125px;
    
    position: absolute;
    top: 0;
    left: 0;

    border-radius: 0;
    border-width: 2px;
    background: #0000002F;
}

:deep(.ring-upgrade.left) {
    text-align: left;
    border-style: solid solid solid none;
}

:deep(.ring-upgrade.right) {
    text-align: right;
    border-style: solid none solid solid;
}

:deep(.ring-upgrade.locked) {
    border-color: var(--locked);
    color: var(--locked);
}

:deep(.ring-upgrade.can) {
    border-color: var(--layer-color);
    color: var(--layer-color);
}

:deep(.ring-upgrade.bought) {
    border-color: var(--bought);
    color: var(--bought);
}

:deep(.ring-upgrade.can:hover), :deep(.ring-upgrade.can.hover) {
    transform: none;
    box-shadow: inset 0 0 20px var(--layer-color);
}

</style>