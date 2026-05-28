"use client";

import { DynamicEntryCard, FormField, FormSection, inputClass, selectClass } from "@/components/reports/FormSection";
import { convertMetricToStandard, convertStandardToMetric } from "@/lib/narcotics-units";
import { EMPTY_NARCOTIC, type NarcoticEntry } from "@/lib/report-types";

interface NarcoticsSectionProps {
  narcotics: NarcoticEntry[];
  onChange: (items: NarcoticEntry[]) => void;
  disabled?: boolean;
}

export function NarcoticsSection({ narcotics, onChange, disabled }: NarcoticsSectionProps) {
  const update = (index: number, patch: Partial<NarcoticEntry>) => {
    const next = [...narcotics];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const updateMetric = (index: number, value: string, unit: NarcoticEntry["weight_metric_unit"]) => {
    const entry = narcotics[index];
    const standardUnit = entry.weight_standard_unit ?? "ounces";
    update(index, {
      weight_metric: value,
      weight_metric_unit: unit,
      weight_standard: convertMetricToStandard(value, unit ?? "grams", standardUnit),
    });
  };

  const updateStandard = (index: number, value: string, unit: NarcoticEntry["weight_standard_unit"]) => {
    const entry = narcotics[index];
    const metricUnit = entry.weight_metric_unit ?? "grams";
    update(index, {
      weight_standard: value,
      weight_standard_unit: unit,
      weight_metric: convertStandardToMetric(value, unit ?? "ounces", metricUnit),
    });
  };

  const add = () => onChange([...narcotics, EMPTY_NARCOTIC()]);
  const remove = (index: number) => onChange(narcotics.filter((_, i) => i !== index));

  return (
    <FormSection title="Narcotics Evidence" badge={narcotics.length || undefined} defaultOpen={narcotics.length > 0}>
      <div className="space-y-4">
        {narcotics.map((item, i) => (
          <DynamicEntryCard key={item.id ?? i} title="Narcotics Entry" index={i} onRemove={() => remove(i)} canRemove={!disabled}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Drug Type"><input className={inputClass} value={item.drug_type ?? ""} onChange={(e) => update(i, { drug_type: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Packaging Type"><input className={inputClass} value={item.packaging_type ?? ""} onChange={(e) => update(i, { packaging_type: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Quantity"><input className={inputClass} value={item.quantity ?? ""} onChange={(e) => update(i, { quantity: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Weight (Metric)">
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    value={item.weight_metric ?? ""}
                    onChange={(e) => updateMetric(i, e.target.value, item.weight_metric_unit ?? "grams")}
                    disabled={disabled}
                    inputMode="decimal"
                  />
                  <select
                    className={selectClass + " w-32 shrink-0"}
                    value={item.weight_metric_unit ?? "grams"}
                    onChange={(e) => updateMetric(i, item.weight_metric ?? "", e.target.value as "grams" | "kilograms")}
                    disabled={disabled}
                  >
                    <option value="grams">grams</option>
                    <option value="kilograms">kilograms</option>
                  </select>
                </div>
              </FormField>
              <FormField label="Weight (Standard)">
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    value={item.weight_standard ?? ""}
                    onChange={(e) => updateStandard(i, e.target.value, item.weight_standard_unit ?? "ounces")}
                    disabled={disabled}
                    inputMode="decimal"
                  />
                  <select
                    className={selectClass + " w-32 shrink-0"}
                    value={item.weight_standard_unit ?? "ounces"}
                    onChange={(e) => updateStandard(i, item.weight_standard ?? "", e.target.value as "ounces" | "pounds")}
                    disabled={disabled}
                  >
                    <option value="ounces">ounces</option>
                    <option value="pounds">pounds</option>
                  </select>
                </div>
              </FormField>
              <FormField label="Estimated Street Value"><input className={inputClass} value={item.estimated_street_value ?? ""} onChange={(e) => update(i, { estimated_street_value: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Test Performed"><input className={inputClass} value={item.test_performed ?? ""} onChange={(e) => update(i, { test_performed: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Test Result"><input className={inputClass} value={item.test_result ?? ""} onChange={(e) => update(i, { test_result: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Evidence Number"><input className={inputClass} value={item.evidence_number ?? ""} onChange={(e) => update(i, { evidence_number: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Associated Suspect" className="sm:col-span-2"><input className={inputClass} value={item.associated_suspect ?? ""} onChange={(e) => update(i, { associated_suspect: e.target.value })} disabled={disabled} /></FormField>
            </div>
          </DynamicEntryCard>
        ))}
      </div>
      {!disabled && (
        <button type="button" onClick={add} className="mt-4 text-sm px-4 py-2 rounded-md bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors">
          Add Narcotics Entry
        </button>
      )}
    </FormSection>
  );
}
