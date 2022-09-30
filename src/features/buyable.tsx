import ClickableComponent from "features/clickables/Clickable.vue";
import type { CoercableComponent, OptionsFunc, Replace, StyleValue } from "features/feature";
import { Component, GatherProps, getUniqueID, jsx, setDefault, Visibility } from "features/feature";
import type { Resource } from "features/resources/resource";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import type { DecimalSource } from "util/bignum";
import Decimal, { format, formatWhole } from "util/bignum";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent } from "util/vue";
import type { Ref } from "vue";
import { computed, unref } from "vue";

export const BuyableType = Symbol("Buyable");

export type BuyableDisplay =
    | CoercableComponent
    | {
          title?: CoercableComponent;
          description?: CoercableComponent;
          effectDisplay?: CoercableComponent;
          showAmount?: boolean;
      };

export interface BuyableOptions {
    visibility?: Computable<Visibility>;
    cost?: Computable<DecimalSource>;
    resource?: Resource;
    bulk?: Computable<DecimalSource>;
    effect?: Computable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    canPurchase?: Computable<boolean>;
    purchaseLimit?: Computable<DecimalSource>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    mark?: Computable<boolean | string>;
    small?: Computable<boolean>;
    display?: Computable<BuyableDisplay>;
    onPurchase?: (cost?: DecimalSource) => void;
}

export interface BaseBuyable {
    id: string;
    amount: Persistent<DecimalSource>;
    maxed: Ref<boolean>;
    canAfford: Ref<boolean>;
    canClick: ProcessedComputable<boolean>;
    onClick: VoidFunction;
    purchase: VoidFunction;
    type: typeof BuyableType;
    [Component]: typeof ClickableComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Buyable<T extends BuyableOptions> = Replace<
    T & BaseBuyable,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        cost: GetComputableType<T["cost"]>;
        resource: GetComputableType<T["resource"]>;
        bulk: GetComputableTypeWithDefault<T["bulk"], 1>;
        effect: GetComputableType<T["effect"]>;
        canPurchase: GetComputableTypeWithDefault<T["canPurchase"], Ref<boolean>>;
        purchaseLimit: GetComputableTypeWithDefault<T["purchaseLimit"], Decimal>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        mark: GetComputableType<T["mark"]>;
        small: GetComputableType<T["small"]>;
        display: Ref<CoercableComponent>;
    }
>;

export type GenericBuyable = Replace<
    Buyable<BuyableOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        canPurchase: ProcessedComputable<boolean>;
        purchaseLimit: ProcessedComputable<DecimalSource>;
    }
>;

export function createBuyable<T extends BuyableOptions>(
    optionsFunc: OptionsFunc<T, BaseBuyable, GenericBuyable>,
    ...decorators: ((buyable: T & Partial<BaseBuyable> & ThisType<T & GenericBuyable>) => void)[]
): Buyable<T> {
    const amount = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const buyable = optionsFunc();

        if (buyable.canPurchase == null && (buyable.resource == null || buyable.cost == null)) {
            console.warn(
                "Cannot create buyable without a canPurchase property or a resource and cost property",
                buyable
            );
            throw "Cannot create buyable without a canPurchase property or a resource and cost property";
        }

        buyable.id = getUniqueID("buyable-");
        buyable.type = BuyableType;
        buyable[Component] = ClickableComponent;

        buyable.amount = amount;
        buyable.canAfford = computed(() => {
            const genericBuyable = buyable as GenericBuyable;
            const cost = unref(genericBuyable.cost);
            return (
                genericBuyable.resource != null &&
                cost != null &&
                Decimal.gte(unref(genericBuyable.resource), cost)
            );
        });
        if (buyable.canPurchase == null) {
            buyable.canPurchase = computed(
                () =>
                    unref((buyable as GenericBuyable).visibility) === Visibility.Visible &&
                    unref((buyable as GenericBuyable).canAfford) &&
                    Decimal.lt(
                        (buyable as GenericBuyable).amount.value,
                        unref((buyable as GenericBuyable).purchaseLimit)
                    )
            );
        }
        buyable.maxed = computed(() =>
            Decimal.gte(
                (buyable as GenericBuyable).amount.value,
                unref((buyable as GenericBuyable).purchaseLimit)
            )
        );
        processComputable(buyable as T, "classes");
        const classes = buyable.classes as ProcessedComputable<Record<string, boolean>> | undefined;
        buyable.classes = computed(() => {
            const currClasses = unref(classes) || {};
            if ((buyable as GenericBuyable).maxed.value) {
                currClasses.bought = true;
            }
            return currClasses;
        });
        processComputable(buyable as T, "bulk");
        setDefault(buyable as T, "bulk", 1);
        processComputable(buyable as T, "effect");
        processComputable(buyable as T, "canPurchase");
        buyable.canClick = buyable.canPurchase as ProcessedComputable<boolean>;
        buyable.onClick = buyable.purchase =
            buyable.onClick ??
            buyable.purchase ??
            function (this: GenericBuyable) {
                const genericBuyable = buyable as GenericBuyable;
                if (!unref(genericBuyable.canPurchase)) {
                    return;
                }
                const cost = unref(genericBuyable.cost);
                if (genericBuyable.cost != null && genericBuyable.resource != null) {
                    genericBuyable.resource.value = Decimal.sub(
                        genericBuyable.resource.value,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        cost!
                    );
                    genericBuyable.amount.value = Decimal.add(genericBuyable.amount.value, unref(genericBuyable.bulk));
                }
                genericBuyable.onPurchase?.(cost);
            };
        processComputable(buyable as T, "display");
        const display = buyable.display;
        buyable.display = jsx(() => {
            // TODO once processComputable types correctly, remove this "as X"
            const currDisplay = unref(display) as BuyableDisplay;
            if (isCoercableComponent(currDisplay)) {
                const coercedDisplay = coerceComponent(currDisplay);
                return <coercedDisplay />;
            }
            if (currDisplay != null && buyable.cost != null && buyable.resource != null) {
                const genericBuyable = buyable as GenericBuyable;
                const Title = coerceComponent(currDisplay.title || "", "h3");
                const Description = coerceComponent(currDisplay.description || "");
                const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "");

                return (
                    <span>
                        {currDisplay.title ? (
                            <div>
                                <Title />
                            </div>
                        ) : null}
                        {currDisplay.description ? <Description /> : null}
                        {currDisplay.showAmount === false ? null : (
                            <div>
                                <br />
                                {unref(genericBuyable.purchaseLimit) === Decimal.dInf ? (
                                    <>Amount: {formatWhole(genericBuyable.amount.value)}</>
                                ) : (
                                    <>
                                        Amount: {formatWhole(genericBuyable.amount.value)} /{" "}
                                        {formatWhole(unref(genericBuyable.purchaseLimit))}
                                    </>
                                )}
                            </div>
                        )}
                        {currDisplay.effectDisplay ? (
                            <div>
                                <br />
                                Currently: <EffectDisplay />
                            </div>
                        ) : null}
                        {genericBuyable.cost && !genericBuyable.maxed.value ? (
                            <div>
                                <br />
                                Cost: {format(unref(genericBuyable.cost) || 0)}{" "}
                                {buyable.resource.displayName}
                            </div>
                        ) : null}
                    </span>
                );
            }
            return "";
        });

        processComputable(buyable as T, "visibility");
        setDefault(buyable, "visibility", Visibility.Visible);
        processComputable(buyable as T, "cost");
        processComputable(buyable as T, "resource");
        processComputable(buyable as T, "purchaseLimit");
        setDefault(buyable, "purchaseLimit", Decimal.dInf);
        processComputable(buyable as T, "style");
        processComputable(buyable as T, "mark");
        processComputable(buyable as T, "small");

        buyable[GatherProps] = function (this: GenericBuyable) {
            const { display, visibility, style, classes, onClick, canClick, small, mark, id } =
                this;
            return {
                display,
                visibility,
                style: unref(style),
                classes,
                onClick,
                canClick,
                small,
                mark,
                id
            };
        };

        decorators.forEach(decorator => decorator(buyable));

        return buyable as unknown as Buyable<T>;
    });
};

/*
 ------------
  DECORATORS
 ------------
*/

export interface FreeBuyableOptions extends BuyableOptions {
    isFree: Computable<boolean>;
}

export type FreeBuyable<T extends FreeBuyableOptions> = Replace<
    T & BaseBuyable,
    {
        isFree: GetComputableType<T["isFree"]>;
    }
>;

export type GenericFreeBuyable = GenericBuyable & FreeBuyable<FreeBuyableOptions>;

export function freeBuyableDecorator<T extends FreeBuyableOptions>(buyable: T & Partial<BaseBuyable> & ThisType<T & GenericBuyable>){
    processComputable(buyable as T, "isFree");

    let onPurchase = buyable.onPurchase;
    buyable.onPurchase = (cost?: DecimalSource) => {
        if (cost && buyable.resource && unref(buyable.isFree)) {
            buyable.resource.value = Decimal.add(unref(buyable.resource), cost);
        };
        onPurchase?.(cost);
    }
}

export interface BonusBuyableOptions extends BuyableOptions {
    bonusAmount: Computable<DecimalSource>;
}

export type BonusBuyable<T extends BonusBuyableOptions> = Replace<
    T & BaseBuyable,
    {
        bonusAmount: GetComputableType<T["bonusAmount"]>;
    }
>;

export type GenericBonusBuyable = GenericBuyable & BonusBuyable<BonusBuyableOptions>;

export function bonusBuyableDecorator<T extends BonusBuyableOptions>(buyable: T & Partial<BaseBuyable> & ThisType<T & GenericBuyable>) {
        processComputable(buyable as T, "bonusAmount");
}