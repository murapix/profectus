import { jsx } from "features/feature";
import { BaseLayer, createLayer } from "game/layers";

const id = "fome";
const layer = createLayer(id, function (this: BaseLayer) {
    // function dimRepeatableDisplay(type: FomeTypes, dim: FomeDims) {
    //     let dimName: string;
    //     switch (dim) {
    //         case FomeDims.height: dimName = "Height"; break;
    //         case FomeDims.width: dimName = "Width"; break;
    //         case FomeDims.depth: dimName = "Depth"; break;
    //     }
    //     return jsx(() => (
    //         <>
    //             <h3>Enlarge {amounts[type].displayName} {dimName} by 1m</h3>
    //             <br />
    //             <br />
    //             <b>Current {dimName}:</b> {format(unref(dimUpgrades[type][dim].amount))}m
    //             <br />
    //             <br />
    //             <b>Cost:</b> {displayRequirements(dimUpgrades[type][dim].requirements)}
    //         </>
    //     ));
    // }

    // type ReformUpgrade = GenericRepeatable & GenericEffectFeature;
    // const reformUpgrades = Object.fromEntries(
    //     Object.values(FomeTypes).map(type => [
    //         type,
    //         createRepeatable<RepeatableOptions & EffectFeatureOptions>(() => ({
    //             display: jsx(() => {
    //                 const buyable = reformUpgrades[type];
    //                 const description = <>Re-form your {amounts[type].displayName}</>
    //                 const amountDisplay = <>Amount: {formatWhole(unref(buyable.amount))}</>
    //                 const requirementDisplay = <>Requires: {reformLimitResource[type].displayName}<sup>{formatWhole(unref(Decimal.add(unref(buyable.amount), 2)))}</sup></>
    //                 const costDisplay = displayRequirements(buyable.requirements)
    //                 return (
    //                     <>
    //                         {description}
    //                         <div><br />{amountDisplay}</div>
    //                         <div><br />{requirementDisplay}{costDisplay}</div>
    //                     </>
    //                 );
    //             })
    //         }), effectDecorator)
    //     ])
    // ) as Record<FomeTypes, ReformUpgrade>;

    return {
        display: jsx(() => (<></>))
    };
});

export default layer;