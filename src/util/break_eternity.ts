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
export function format(value: DecimalSource, precision: number = projInfo.defaultDigitsShown, displaySmall: boolean = projInfo.defaultShowSmall, notation: Notations = settings.numberFormat): string {
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
            case Notations.standard: return standardNotation(value, settings.backupNumberFormat, precision+1, PrecisionType.total, value.gte(mantissaLimit));
            case Notations.thousands: return thousandsNotation(value, precision+1, PrecisionType.total, value.gte(mantissaLimit));
            case Notations.engineering: return engineeringNotation(value, precision+1, PrecisionType.total, value.gte(mantissaLimit));
            case Notations.scientific: return scientificNotation(value, precision, PrecisionType.decimal, value.gte(mantissaLimit));
        }
    }
    if (value.gte(1e3)) {
        switch(notation) {
            case Notations.standard:
            case Notations.thousands:
            case Notations.engineering:
                return commaFormat(value, precision, PrecisionType.total);
            case Notations.scientific:
                return commaFormat(value, precision, PrecisionType.decimal);
        }
    }
    return regularFormat(value, precision);
}

export function formatWhole(value: DecimalSource, displaySmall: boolean = projInfo.defaultShowSmall, notation: Notations = settings.numberFormat) {
    value = new Decimal(value);
    if (value.gte(1e9)) { return format(value, undefined, displaySmall, notation); }
    if (value.lte(0.98) && value.neq(0) && displaySmall) { return format(value, undefined, displaySmall, notation); }

    switch(notation) {
        case Notations.standard:
        case Notations.thousands:
            if (value.gte(1e4)) {
                return format(value, undefined, displaySmall, notation);
            }
            return format(value, 0, displaySmall, Notations.scientific);
        default: return format(value, 0, displaySmall, notation);
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

export function standardNotation(
    value: DecimalSource,
    backupNotation: Exclude<Notations, Notations.standard> = settings.backupNumberFormat,
    precision: number = projInfo.defaultDigitsShown + 1,
    type: PrecisionType = PrecisionType.total,
    skipMantissa: boolean = false
) {
    if (precision < 3) precision = 3; // Standard Notation must be able to display a mantissa of 100-999 as a single value

    const [mantissa, exponent] = getStandardNotation(value, precision);
    if (typeof exponent === "string") {
        if (skipMantissa) { return `1 ${exponent}`; }
        switch(type) {
            case PrecisionType.decimal: return `${regularFormat(mantissa, precision)} ${exponent}`;
            case PrecisionType.total: return `${mantissa.toPrecision(precision)} ${exponent}`;
        }
    }
    if (exponent.eq(0)) {
        switch(type) {
            case PrecisionType.decimal: return regularFormat(mantissa, precision)
            case PrecisionType.total: return mantissa.toPrecision(precision);
        }
    }
    switch (backupNotation) {
        case Notations.thousands: return thousandsNotation(value, precision, undefined, skipMantissa);
        case Notations.engineering: return engineeringNotation(value, precision, undefined, skipMantissa);
        case Notations.scientific: return scientificNotation(value, precision - 1, undefined, skipMantissa);
    }
}
function getStandardNotation(value: DecimalSource, precision: number = projInfo.defaultDigitsShown + 1): [Decimal, string|Decimal] {
    const maxExponent = 1000;

    let [mantissa, exponent] = getThousandsNotation(value, precision);
    
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

export function thousandsNotation(value: DecimalSource, precision: number = projInfo.defaultDigitsShown + 1, type: PrecisionType = PrecisionType.total, skipMantissa: boolean = false) {
    if (precision < 3) precision = 3; // Thousands Notation must be able to display a mantissa of 100-999 as a single value

    const [mantissa, exponent] = getThousandsNotation(value, precision, type);
    if (exponent.eq(0)) {
        switch(type) {
            case PrecisionType.decimal: return regularFormat(mantissa);
            case PrecisionType.total: return mantissa.toPrecision(precision);
        }
    }
    if (skipMantissa) return `t${exponent.toStringWithDecimalPlaces(0)}`;

    switch(type) {
        case PrecisionType.decimal: return `${regularFormat(mantissa)}t${exponent.toStringWithDecimalPlaces(0)}`;
        case PrecisionType.total: return `${mantissa.toPrecision(precision)}t${exponent.toStringWithDecimalPlaces(0)}`;
    }
}
function getThousandsNotation(value: DecimalSource, precision: number = projInfo.defaultDigitsShown + 1, type: PrecisionType = PrecisionType.total) {
    let [mantissa, exponent] = getEngineeringNotation(value, precision, type);
    return [mantissa, exponent.div(3)];
}

export function engineeringNotation(value: DecimalSource, precision: number = projInfo.defaultDigitsShown + 1, type: PrecisionType = PrecisionType.total, skipMantissa: boolean = false) {
    if (precision < 3) precision = 3; // Engineering Notation must be able to display a mantissa of 100-999 as a single value

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
function getEngineeringNotation(value: DecimalSource, precision: number = projInfo.defaultDigitsShown + 1, type: PrecisionType = PrecisionType.total) {
    let [mantissa, exponent] = getScientificNotation(value, precision, type);
    if (exponent.gte(Number.MAX_SAFE_INTEGER)) return [mantissa, exponent];

    const offset = exponent.toNumber() % 3;
    return [Decimal.pow10(offset).times(mantissa), exponent.minus(offset)];
}

export const exponentialFormat = scientificNotation;
export function scientificNotation(value: DecimalSource, precision: number = projInfo.defaultDigitsShown, type: PrecisionType = PrecisionType.decimal, skipMantissa: boolean = false) {
    let [mantissa, exponent] = getScientificNotation(value, precision, type);
    const formattedExponent = exponent.gte(1e9)
        ? format(exponent, Math.max(precision, 3, projInfo.defaultDigitsShown))
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
function getScientificNotation(value: DecimalSource, precision: number = projInfo.defaultDigitsShown, type: PrecisionType = PrecisionType.decimal) {
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

export function commaFormat(value: DecimalSource, precision: number = projInfo.defaultDigitsShown, type: PrecisionType = PrecisionType.decimal) {
    value = new Decimal(value);
    if (value.lt(smallBoundary)) return (0).toFixed(precision);

    const initial = (() => {
        switch(type) {
            case PrecisionType.decimal: return value.toStringWithDecimalPlaces(precision);
            case PrecisionType.total: return value.toStringWithDecimalPlaces(Math.max(precision - value.log10().floor().toNumber(), 0));
        }
    })();
    const portions = initial.split('.');
    portions[0] = portions[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    return portions.join('.');
}

export function regularFormat(value: DecimalSource, precision: number = projInfo.defaultDigitsShown) {
    value = new Decimal(value);
    if (value.lt(smallBoundary)) return (0).toFixed(precision);

    if (value.lt(0.1) && precision > 0) {
        precision = Math.max(precision, value.log10().negate().ceil().toNumber(), projInfo.defaultDigitsShown);
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
    const seconds = time.toPrecision(2);

    const daysOut = String(days).padStart(3);
    const hoursOut = String(hours).padStart(2);
    const minutesOut = String(minutes).padStart(2);
    const secondsOut = seconds.padStart(2);

    if (years > 0) { return `${years}y ${daysOut}d ${hoursOut}h`; }
    if (days > 0) { return `${daysOut}d ${hoursOut}h ${minutesOut}m`; }
    if (hours > 0) { return `${hoursOut}h ${minutesOut}m ${secondsOut}s`; }
    if (minutes > 0) { return `${minutesOut}m ${secondsOut}s`; }
    return `${secondsOut}s`;
}

export function toPlaces(value: DecimalSource, precision: number, maxAccepted: DecimalSource): string {
    value = new Decimal(value);

    let result = value.toStringWithDecimalPlaces(precision);
    if (Decimal.gte(result, maxAccepted)) {
        result = Decimal.minus(maxAccepted, Math.pow(0.1, precision)).toStringWithDecimalPlaces(precision);
    }
    return result;
}

export function formatSmall(value: DecimalSource, precision: number = projInfo.defaultDigitsShown, notation: Notations = settings.numberFormat) {
    return format(value, precision, true, notation);
}

export function invertOOM(value: DecimalSource): Decimal {
    const exponent = Decimal.log10(value).ceil();
    const mantissa = Decimal.divide(value, exponent.pow10());
    return exponent.negate().pow10().times(mantissa);
}