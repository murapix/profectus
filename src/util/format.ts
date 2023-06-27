import { DecimalSource } from "lib/break_eternity";
import Decimal, { commaFormat, exponentialFormat, invertOOM } from "./break_eternity";
import projInfo from "data/projInfo.json"
import settings from "game/settings";

const e1k = Decimal.pow10(1e3);

const smallBoundary = new Decimal(0.001);
const safeLimit = Decimal.pow10(Number.MAX_SAFE_INTEGER);
const slogLimit = new Decimal("eeee1000");

export const enum PrecisionType {
    decimal,
    total
}
export const enum Notations {
    standard,
    thousands,
    engineering,
    scientific
}
export function format(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, displaySmall: boolean = projInfo.defaultShowSmall, notation = settings.numberFormat): string {
    value = new Decimal(value);
    if (Decimal.isNaN(value)) { return "NaN"; }
    if (value.sign < 0) { return `-${format(value.negate(), precision, displaySmall, notation)}`; }
    if (!Decimal.isFinite(value)) { return "Infinity"; }

    if (value.gte(slogLimit)) { return slogFormat(value); }
    if (value.gte(safeLimit)) { return scientificNotation(value); }
    if (value.eq(Decimal.dZero)) { return (0).toFixed(precision); }
    if (value.lt(smallBoundary) && displaySmall) {
        value = invertOOM(value);
        if (value.gte(e1k)) { return `${format(value, precision)}⁻¹`; }
        return exponentialFormat(value, precision).replace(/([^(?:e|F)]*)$/, "-$1");
    }
    
    switch(notation) {
        case Notations.standard: return standardNotation(value);
        case Notations.thousands: return thousandsNotation(value);
        case Notations.engineering: return engineeringNotation(value);
        case Notations.scientific: return scientificNotation(value);
    }
}

export function slogFormat(value: DecimalSource) {
    value = new Decimal(value);
    const slog = value.slog();
    if (slog.gte(1e6)) { return `F${format(slog.floor())}` }
    
    const prefix = slog.sub(slog.floor()).pow10();
    const suffix = slog.floor();
    return `${prefix.toStringWithDecimalPlaces(3)}F${commaFormat(suffix, 0)}`;
}

export function standardNotation(value: DecimalSource, backupNotation: Exclude<Notations, Notations.standard> = Notations.scientific) {
    const [mantissa, exponent] = getStandardNotation(value);
    if (typeof exponent === "string") { return `${mantissa.toPrecision(4)}${exponent}` }
    if (exponent.eq(0)) { return mantissa.toPrecision(4); }
    switch (backupNotation) {
        case Notations.thousands: return thousandsNotation(value);
        case Notations.engineering: return engineeringNotation(value);
        case Notations.scientific: return scientificNotation(value);
    }
}
function getStandardNotation(value: DecimalSource): [Decimal, string|Decimal] {
    const maxExponent = 1000;

    let [mantissa, exponent] = getThousandsNotation(value, 4);
    
    if (exponent.gt(maxExponent)) return [mantissa, exponent];
    if (exponent.eq(0)) return [mantissa, exponent];
    if (exponent.eq(1)) return [mantissa, 'K'];
    if (exponent.eq(2)) return [mantissa, 'M'];
    if (exponent.eq(3)) return [mantissa, 'B'];

    const digits = exponent.minus(1).toNumber();
    const ones = digits%10;
    const tens = Math.trunc(digits%100 / 10);
    const hundreds = Math.trunc(digits%1000 / 100);
    return [mantissa, [getOnes(ones), getTens(tens, ones), getHundreds(hundreds)].join('')];
}
function getOnes(digit: number) {
    switch(digit) {
        default: return '';
        case 1: return 'U';
        case 2: return 'D';
        case 3: return 'T';
        case 4: return 'Qa';
        case 5: return 'Qi';
        case 6: return 'Sx';
        case 7: return 'Sp';
        case 8: return 'Oc';
        case 9: return 'No';
    }
}
function getTens(digit: number, ones: number) {
    if (digit === 0) return '';
    if (digit === 1) {
        return ones === 0 ? 'Dc' : 'D';
    }
    if (digit === 2) return 'Vg';
    return `${getOnes(digit)}g`;
}
function getHundreds(digit: number) {
    if (digit === 0) return '';
    if (digit === 1) return 'C';
    return `${getOnes(digit)}C`;
}

export function thousandsNotation(value: DecimalSource) {
    const [mantissa, exponent] = getThousandsNotation(value, 4);
    if (exponent.eq(0)) return mantissa.toPrecision(4);
    return `${mantissa.toPrecision(4)}t${exponent.toFixed(0)}`;
}
function getThousandsNotation(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown) {
    let [mantissa, exponent] = getEngineeringNotation(value, precision, PrecisionType.total);
    return [mantissa, exponent.div(3)];
}

export function engineeringNotation(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, type: PrecisionType = PrecisionType.decimal) {
    const [mantissa, exponent] = getEngineeringNotation(value, precision, type);
    if (exponent.eq(0)) {
        switch(type) {
            case PrecisionType.decimal: return mantissa.toStringWithDecimalPlaces(precision);
            case PrecisionType.total: return mantissa.toPrecision(precision);
        }
    }
    switch(type) {
        case PrecisionType.decimal: return `${mantissa.toStringWithDecimalPlaces(precision)}e${exponent.toStringWithDecimalPlaces(0)}`;
        case PrecisionType.total: return `${mantissa.toPrecision(precision)}e${exponent.toStringWithDecimalPlaces(0)}`;
    }
}
function getEngineeringNotation(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, type: PrecisionType = PrecisionType.decimal) {
    let [mantissa, exponent] = getScientificNotation(value, precision, type);
    if (exponent.gte(Number.MAX_SAFE_INTEGER)) return [mantissa, exponent];

    const offset = exponent.toNumber() % 3;
    return [Decimal.pow10(offset).times(mantissa), exponent.minus(offset)];
}

export function scientificNotation(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, type: PrecisionType = PrecisionType.decimal) {
    let [mantissa, exponent] = getScientificNotation(value, precision, type);
    const formattedExponent = exponent.gte(1e9)
        ? format(exponent, Math.max(precision, 3, projInfo.defaultDecimalsShown))
        : exponent.gte(10000)
            ? commaFormat(exponent, 0)
            : exponent.toStringWithDecimalPlaces(0);
    const formattedMantissa = (() => {
        switch(type) {
            case PrecisionType.decimal: return mantissa.toStringWithDecimalPlaces(precision);
            case PrecisionType.total: return mantissa.toPrecision(precision);
        }
    })();
    return `${formattedMantissa}e${formattedExponent}`;
}
function getScientificNotation(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, type: PrecisionType = PrecisionType.decimal) {
    let exponent = Decimal.log10(value).floor();
    let mantissa = Decimal.div(value, exponent.pow10());
    const formattedMantissa = (() => {
        switch(type) {
            case PrecisionType.decimal: return mantissa.toStringWithDecimalPlaces(precision);
            case PrecisionType.total: return mantissa.toPrecision(precision);
        }
    })();
    if (formattedMantissa === "10") {
        mantissa = Decimal.dOne;
        exponent = exponent.plus(1);
    }
    return [mantissa, exponent];
}