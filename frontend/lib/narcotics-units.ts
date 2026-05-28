/** Narcotics weight unit conversion — metric ↔ standard */

const GRAMS_PER_OUNCE = 28.3495;
const GRAMS_PER_POUND = 453.592;
const GRAMS_PER_KG = 1000;

export type MetricUnit = "grams" | "kilograms";
export type StandardUnit = "ounces" | "pounds";

export function metricToGrams(value: number, unit: MetricUnit): number {
  return unit === "kilograms" ? value * GRAMS_PER_KG : value;
}

export function gramsToMetric(grams: number, unit: MetricUnit): number {
  const val = unit === "kilograms" ? grams / GRAMS_PER_KG : grams;
  return Math.round(val * 10000) / 10000;
}

export function standardToGrams(value: number, unit: StandardUnit): number {
  return unit === "pounds" ? value * GRAMS_PER_POUND : value * GRAMS_PER_OUNCE;
}

export function gramsToStandard(grams: number, unit: StandardUnit): number {
  const val = unit === "pounds" ? grams / GRAMS_PER_POUND : grams / GRAMS_PER_OUNCE;
  return Math.round(val * 10000) / 10000;
}

export function convertMetricToStandard(
  value: string | number | undefined,
  metricUnit: MetricUnit,
  standardUnit: StandardUnit
): string {
  const num = parseFloat(String(value ?? ""));
  if (Number.isNaN(num)) return "";
  const grams = metricToGrams(num, metricUnit);
  return String(gramsToStandard(grams, standardUnit));
}

export function convertStandardToMetric(
  value: string | number | undefined,
  standardUnit: StandardUnit,
  metricUnit: MetricUnit
): string {
  const num = parseFloat(String(value ?? ""));
  if (Number.isNaN(num)) return "";
  const grams = standardToGrams(num, standardUnit);
  return String(gramsToMetric(grams, metricUnit));
}
