import type { Units } from './types';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;
export const ML_PER_FLOZ = 29.5735;

export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const mlToFlOz = (ml: number) => ml / ML_PER_FLOZ;
export const flOzToMl = (oz: number) => oz * ML_PER_FLOZ;

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = cm / CM_PER_IN;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
}

export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * CM_PER_IN;

export function round(value: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function formatNumber(value: number, locale: string, maxDigits = 0): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxDigits }).format(value);
}

/** Weight in the user's units, as a number (kg or lb). */
export function weightValue(kg: number, units: Units): number {
  return units === 'imperial' ? round(kgToLb(kg), 1) : round(kg, 1);
}

export function weightFromValue(value: number, units: Units): number {
  return units === 'imperial' ? lbToKg(value) : value;
}

export const weightUnit = (units: Units) => (units === 'imperial' ? 'lb' : 'kg');

export function formatWeight(kg: number, units: Units, locale: string): string {
  return `${formatNumber(weightValue(kg, units), locale, 1)} ${weightUnit(units)}`;
}

export function formatHeight(cm: number, units: Units, locale: string): string {
  if (units === 'imperial') {
    const { ft, inch } = cmToFtIn(cm);
    return `${ft}′ ${inch}″`;
  }
  return `${formatNumber(cm, locale)} cm`;
}

export function volumeValue(ml: number, units: Units): number {
  return units === 'imperial' ? Math.round(mlToFlOz(ml)) : Math.round(ml);
}

export const volumeUnit = (units: Units) => (units === 'imperial' ? 'fl oz' : 'mL');

export function formatVolume(ml: number, units: Units, locale: string): string {
  return `${formatNumber(volumeValue(ml, units), locale)} ${volumeUnit(units)}`;
}
