"use client";

import {
  CjiBadge,
  DynamicEntryCard,
  FormField,
  FormSection,
  inputClass,
  textareaClass,
  YesNoSelect,
} from "@/components/reports/FormSection";
import { EMPTY_SUSPECT, type SuspectEntry } from "@/lib/report-types";
import { Camera } from "lucide-react";

interface SuspectsSectionProps {
  suspects: SuspectEntry[];
  onChange: (suspects: SuspectEntry[]) => void;
  disabled?: boolean;
}

export function SuspectsSection({ suspects, onChange, disabled }: SuspectsSectionProps) {
  const update = (index: number, patch: Partial<SuspectEntry>) => {
    const next = [...suspects];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const add = () => onChange([...suspects, EMPTY_SUSPECT()]);
  const remove = (index: number) => onChange(suspects.filter((_, i) => i !== index));

  return (
    <FormSection title="Suspect Information" badge={suspects.length}>
      <div className="mb-4"><CjiBadge /></div>
      <div className="space-y-4">
        {suspects.map((suspect, i) => (
          <DynamicEntryCard
            key={suspect.id ?? i}
            title="Suspect"
            index={i}
            onRemove={() => remove(i)}
            canRemove={suspects.length > 1 && !disabled}
          >
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-3">
              <input
                type="checkbox"
                checked={suspect.is_unknown ?? false}
                onChange={(e) => update(i, { is_unknown: e.target.checked, full_name: e.target.checked ? "Unknown" : suspect.full_name })}
                disabled={disabled}
                className="rounded border-slate-600"
              />
              Flag suspect as unknown
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Full Name">
                <input className={inputClass} value={suspect.full_name ?? ""} onChange={(e) => update(i, { full_name: e.target.value })} disabled={disabled || suspect.is_unknown} />
              </FormField>
              <FormField label="Alias / Nickname">
                <input className={inputClass} value={suspect.alias ?? ""} onChange={(e) => update(i, { alias: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="DOB">
                <input type="date" className={inputClass} value={suspect.dob ?? ""} onChange={(e) => update(i, { dob: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="Gender"><input className={inputClass} value={suspect.gender ?? ""} onChange={(e) => update(i, { gender: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Race"><input className={inputClass} value={suspect.race ?? ""} onChange={(e) => update(i, { race: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Height"><input className={inputClass} value={suspect.height ?? ""} onChange={(e) => update(i, { height: e.target.value })} disabled={disabled} placeholder="e.g. 5'10&quot;" /></FormField>
              <FormField label="Weight"><input className={inputClass} value={suspect.weight ?? ""} onChange={(e) => update(i, { weight: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Hair Color"><input className={inputClass} value={suspect.hair_color ?? ""} onChange={(e) => update(i, { hair_color: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Eye Color"><input className={inputClass} value={suspect.eye_color ?? ""} onChange={(e) => update(i, { eye_color: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Clothing Description" className="sm:col-span-2 lg:col-span-3">
                <textarea className={textareaClass} value={suspect.clothing_description ?? ""} onChange={(e) => update(i, { clothing_description: e.target.value })} disabled={disabled} rows={2} />
              </FormField>
              <FormField label="Identifying Marks / Tattoos" className="sm:col-span-2">
                <input className={inputClass} value={suspect.identifying_marks ?? ""} onChange={(e) => update(i, { identifying_marks: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="Address"><input className={inputClass} value={suspect.address ?? ""} onChange={(e) => update(i, { address: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Phone Number"><input type="tel" className={inputClass} value={suspect.phone_number ?? ""} onChange={(e) => update(i, { phone_number: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Gang Affiliation"><input className={inputClass} value={suspect.gang_affiliation ?? ""} onChange={(e) => update(i, { gang_affiliation: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Warrants Known"><input className={inputClass} value={suspect.warrants_known ?? ""} onChange={(e) => update(i, { warrants_known: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Arrested"><YesNoSelect value={suspect.arrested} onChange={(v) => update(i, { arrested: v })} disabled={disabled} /></FormField>
              <FormField label="Miranda Given"><YesNoSelect value={suspect.miranda_given} onChange={(v) => update(i, { miranda_given: v })} disabled={disabled} /></FormField>
              <FormField label="Charges" className="sm:col-span-2 lg:col-span-3">
                <input className={inputClass} value={suspect.charges ?? ""} onChange={(e) => update(i, { charges: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="Photo Attachment" className="lg:col-span-3">
                <div className="flex items-center gap-3 p-4 border border-dashed border-slate-600 rounded-md bg-slate-900/50">
                  <Camera className="w-5 h-5 text-slate-500" />
                  <div className="flex-1">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Photo reference / evidence tag (placeholder for upload integration)"
                      value={suspect.photo_placeholder ?? ""}
                      onChange={(e) => update(i, { photo_placeholder: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </FormField>
            </div>
          </DynamicEntryCard>
        ))}
      </div>
      {!disabled && (
        <button type="button" onClick={add} className="mt-4 text-sm px-4 py-2 rounded-md bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors">
          Add Another Suspect
        </button>
      )}
    </FormSection>
  );
}
