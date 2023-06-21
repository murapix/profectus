// import { jsx } from "features/feature";
// import Decimal from "lib/break_eternity";
// import { format, formatWhole } from "util/break_eternity";
// import { unref, computed } from "vue";
// import { GenericResearch, createResearch, getResearchEffect } from "../inflaton/research";
// import { persistent } from "game/persistence";

// const queueLength = computed<number>(() => {
//     return 1 + getResearchEffect(research.queueTwo, 0) + getResearchEffect(research.queueFour, 0);
// });

// const researchQueue = persistent<[keyof typeof researchLocations, string][]>([]);
// function startResearch(location: keyof typeof researchLocations) {
//     const research = researchLocations[location];
//     return function(this: GenericResearch, force: boolean = false) {
//         if (force || unref(researchQueue).length < unref(queueLength)) {
//             const key = Object.keys(research).find(key => research[key].id === this.id);
//             if (key) unref(researchQueue).push([location, key]);
//         }
//     }
// }
// function isResearching(this: GenericResearch) {
//     return unref(researchQueue).some(([key, id]) => researchLocations[key][id].id === this.id);
// }
