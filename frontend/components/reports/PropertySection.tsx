"use client";

import { DynamicEntryCard, FormField, FormSection, inputClass, textareaClass, YesNoSelect } from "@/components/reports/FormSection";
import { EMPTY_PROPERTY, type PropertyEntry } from "@/lib/report-types";

interface PropertySectionProps {
  propertyItems: PropertyEntry[];
  onChange: (items: PropertyEntry[]) => void;
  disabled?: boolean;
}

export function PropertySection({ propertyItems, onChange, disabled }: PropertySectionProps) {
  const update = (index: number, patch: Partial<PropertyEntry>) => {
    const next = [...propertyItems];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const add = () => onChange([...propertyItems, EMPTY_PROPERTY()]);
  const remove = (index: number) => onChange(propertyItems.filter((_, i) => i !== index));

  return (
    <FormSection title="Property / Evidence" badge={propertyItems.length || undefined} defaultOpen={propertyItems.length > 0}>
      <div className="space-y-4">
        {propertyItems.map((item, i) => (
          <DynamicEntryCard key={item.id ?? i} title="Property Item" index={i} onRemove={() => remove(i)} canRemove={!disabled}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Property Type"><input className={inputClass} value={item.property_type ?? ""} onChange={(e) => update(i, { property_type: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Serial Number"><input className={inputClass} value={item.serial_number ?? ""} onChange={(e) => update(i, { serial_number: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Value"><input className={inputClass} value={item.value ?? ""} onChange={(e) => update(i, { value: e.target.value })} disabled={disabled} placeholder="$" /></FormField>
              <FormField label="Owner"><input className={inputClass} value={item.owner ?? ""} onChange={(e) => update(i, { owner: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Evidence Number"><input className={inputClass} value={item.evidence_number ?? ""} onChange={(e) => update(i, { evidence_number: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Recovered"><YesNoSelect value={item.recovered} onChange={(v) => update(i, { recovered: v })} disabled={disabled} /></FormField>
              <FormField label="Damaged"><YesNoSelect value={item.damaged} onChange={(v) => update(i, { damaged: v })} disabled={disabled} /></FormField>
              <FormField label="Description" className="sm:col-span-2 lg:col-span-3">
                <textarea className={textareaClass} value={item.description ?? ""} onChange={(e) => update(i, { description: e.target.value })} disabled={disabled} rows={2} />
              </FormField>
              <FormField label="Chain of Custody Notes" className="lg:col-span-3">
                <textarea className={textareaClass} value={item.chain_of_custody_notes ?? ""} onChange={(e) => update(i, { chain_of_custody_notes: e.target.value })} disabled={disabled} rows={2} />
              </FormField>
            </div>
          </DynamicEntryCard>
        ))}
      </div>
      {!disabled && (
        <button type="button" onClick={add} className="mt-4 text-sm px-4 py-2 rounded-md bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors">
          Add Another Property Item
        </button>
      )}
    </FormSection>
  );
}
