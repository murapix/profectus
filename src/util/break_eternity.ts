import projInfo from "data/projInfo.json";
import type { DecimalSource } from "lib/break_eternity";
import Decimal from "lib/break_eternity";
import settings from "game/settings";
import { Notations } from "./notation";

export default Decimal;

const e1k = Decimal.pow10(1e3);

const smallBoundary = new Decimal(0.001);
const mantissaLimit = Decimal.pow10(10000);
const safeLimit = Decimal.pow10(Number.MAX_SAFE_INTEGER);
const slogLimit = new Decimal("eeee1000");

export enum PrecisionType {
    decimal = "decimal",
    total = "total"
}
export function format(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, displaySmall: boolean = projInfo.defaultShowSmall, notation: Notations = settings.numberFormat): string {
    value = new Decimal(value);
    if (Decimal.isNaN(value)) { return "NaN"; }
    if (value.sign < 0) { return `-${format(value.negate(), precision, displaySmall, notation)}`; }
    if (!Decimal.isFinite(value)) { return "Infinity"; }

    if (value.gte(slogLimit)) { return slogFormat(value); }
    if (value.gte(safeLimit)) { return scientificNotation(value, precision); }
    if (value.eq(Decimal.dZero)) { return (0).toFixed(precision); }
    if (value.lt(smallBoundary) && displaySmall) {
        value = invertOOM(value) as Decimal;
        if (value.gte(e1k)) { return `${format(value, precision)}⁻¹`; }
        return scientificNotation(value, precision).replace(/([^(?:e|F)]*)$/, "-$1");
    }

    if (value.gte(1e9)) {
        switch(notation) {
            case Notations.standard: return standardNotation(value, undefined, value.gte(mantissaLimit));
            case Notations.thousands: return thousandsNotation(value, value.gte(mantissaLimit));
            case Notations.engineering: return engineeringNotation(value, precision, undefined, value.gte(mantissaLimit));
            case Notations.scientific: return scientificNotation(value, precision, undefined, value.gte(mantissaLimit));
        }
    }
    if (value.gte(1e3)) { return commaFormat(value, precision); }
    return regularFormat(value, precision);
}

export function formatWhole(value: DecimalSource, displaySmall: boolean = projInfo.defaultShowSmall, notation: Notations = settings.numberFormat) {
    value = new Decimal(value);
    if (value.gte(1e9)) { return format(value, undefined, displaySmall, notation); }
    if (value.lte(0.98) && value.neq(0) && displaySmall) { return format(value, undefined, undefined, notation); }

    switch(notation) {
        case Notations.standard:
        case Notations.thousands:
            if (value.gte(1e4)) {
                return format(value, undefined, displaySmall, notation);
            }
            return format(value, 0, displaySmall, Notations.scientific);
        default: break;
    }
    return format(value, 0, displaySmall, notation);
}

export function slogFormat(value: DecimalSource) {
    value = new Decimal(value);
    const slog = value.slog();
    if (slog.gte(1e6)) { return `F${format(slog.floor())}` }
    
    const prefix = slog.sub(slog.floor()).pow10();
    const suffix = slog.floor();
    return `${prefix.toStringWithDecimalPlaces(3)}F${commaFormat(suffix, 0)}`;
}

export function standardNotation(value: DecimalSource, backupNotation: Exclude<Notations, Notations.standard> = settings.backupNumberFormat, skipMantissa: boolean = false) {
    const [mantissa, exponent] = getStandardNotation(value);
    if (typeof exponent === "string") {
        if (skipMantissa) { return `1 ${exponent}`; }
        return `${mantissa.toPrecision(4)} ${exponent}`
    }
    if (exponent.eq(0)) { return mantissa.toPrecision(4); }
    switch (backupNotation) {
        case Notations.thousands: return thousandsNotation(value, skipMantissa);
        case Notations.engineering: return engineeringNotation(value, undefined, undefined, skipMantissa);
        case Notations.scientific: return scientificNotation(value, undefined, undefined, skipMantissa);
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

export function thousandsNotation(value: DecimalSource, skipMantissa: boolean = false) {
    const [mantissa, exponent] = getThousandsNotation(value, 4);
    if (exponent.eq(0)) return mantissa.toPrecision(4);
    if (skipMantissa) return `t${exponent.toStringWithDecimalPlaces(0)}`;
    return `${mantissa.toPrecision(4)}t${exponent.toStringWithDecimalPlaces(0)}`;
}
function getThousandsNotation(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown) {
    let [mantissa, exponent] = getEngineeringNotation(value, precision, PrecisionType.total);
    return [mantissa, exponent.div(3)];
}

export function engineeringNotation(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, type: PrecisionType = PrecisionType.decimal, skipMantissa: boolean = false) {
    const [mantissa, exponent] = getEngineeringNotation(value, precision, type);
    if (exponent.eq(0)) {
        switch(type) {
            case PrecisionType.decimal: return regularFormat(mantissa);
            case PrecisionType.total: return mantissa.toPrecision(precision);
        }
    }
    if (skipMantissa) return `e${exponent.toStringWithDecimalPlaces(0)}`;

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

export const exponentialFormat = scientificNotation;
export function scientificNotation(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, type: PrecisionType = PrecisionType.decimal, skipMantissa: boolean = false) {
    let [mantissa, exponent] = getScientificNotation(value, precision, type);
    const formattedExponent = exponent.gte(1e9)
        ? format(exponent, Math.max(precision, 3, projInfo.defaultDecimalsShown))
        : exponent.gte(10000)
            ? commaFormat(exponent, 0)
            : exponent.toStringWithDecimalPlaces(0);
    if (skipMantissa) return `e${formattedExponent}`;

    const formattedMantissa = (() => {
        switch(type) {
            case PrecisionType.decimal: return regularFormat(mantissa);
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

export function commaFormat(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown) {
    if (value == undefined) { return "NaN"; }
    value = new Decimal(value);
    if (value.lt(smallBoundary)) return (0).toFixed(precision);

    const initial = value.toStringWithDecimalPlaces(precision);
    const portions = initial.split('.');
    portions[0] = portions[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    return portions.join('.');
}

export function regularFormat(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown) {
    if (value == undefined) { return "NaN"; }
    value = new Decimal(value);
    if (value.lt(smallBoundary)) return (0).toFixed(precision);

    if (value.lt(0.1) && precision > 0) {
        precision = Math.max(precision, value.log10().negate().ceil().toNumber(), projInfo.defaultDecimalsShown);
    }
    return value.toStringWithDecimalPlaces(precision);
}

const secondsPerMinute = 60;
const minutesPerHour = 60;
const hoursPerDay = 24;
const daysPerYear = 365;

const secondsPerHour = secondsPerMinute * minutesPerHour;
const secondsPerDay = secondsPerHour * hoursPerDay;
const secondsPerYear = secondsPerDay * daysPerYear;
export function formatTime(time: DecimalSource): string {
    time = new Decimal(time);
    if (time.lt(0)) { return `-${formatTime(time.negate())}`; }
    if (time.gt(Number.MAX_SAFE_INTEGER)) { return `${format(time.div(secondsPerYear))}y` }

    time = time.toNumber();
    const years = Math.floor(time / secondsPerYear);
    time -= years * secondsPerYear;
    const days = Math.floor(time / secondsPerDay);
    time -= days * secondsPerDay;
    const hours = Math.floor(time / secondsPerHour);
    time -= hours * secondsPerHour;
    const minutes = Math.floor(time / secondsPerMinute);
    time -= minutes * secondsPerMinute;
    const seconds = time;
    if (years > 0) { return `${years}y ${days}d ${hours}h`; }
    if (days > 0) { return `${days}d ${hours}h ${minutes}m`; }
    if (hours > 0) { return `${hours}h ${minutes}m ${seconds}s`; }
    if (minutes > 0) { return `${minutes}m ${seconds}s`; }
    return `${seconds}s`;
}

export function toPlaces(value: DecimalSource, precision: number, maxAccepted: DecimalSource): string {
    value = new Decimal(value);

    let result = value.toStringWithDecimalPlaces(precision);
    if (Decimal.gte(result, maxAccepted)) {
        result = Decimal.minus(maxAccepted, Math.pow(0.1, precision)).toStringWithDecimalPlaces(precision);
    }
    return result;
}

export function formatSmall(value: DecimalSource, precision: number = projInfo.defaultDecimalsShown, notation: Notations = settings.numberFormat) {
    return format(value, precision, true, notation);
}

export function invertOOM(value: DecimalSource): Decimal {
    const exponent = Decimal.log10(value).ceil();
    const mantissa = Decimal.divide(value, exponent.pow10());
    return exponent.negate().pow10().times(mantissa);
}