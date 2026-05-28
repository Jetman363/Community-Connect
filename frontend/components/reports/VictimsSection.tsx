"use client";

import {
  CjiBadge,
  DynamicEntryCard,
  FormField,
  FormSection,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/reports/FormSection";
import { EMPTY_VICTIM, type PartyRole, type VictimEntry } from "@/lib/report-types";

interface VictimsSectionProps {
  victims: VictimEntry[];
  onChange: (victims: VictimEntry[]) => void;
  disabled?: boolean;
  cjiRestricted?: boolean;
}

export function VictimsSection({ victims, onChange, disabled, cjiRestricted }: VictimsSectionProps) {
  const update = (index: number, patch: Partial<VictimEntry>) => {
    const next = [...victims];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const add = () => onChange([...victims, EMPTY_VICTIM()]);
  const remove = (index: number) => onChange(victims.filter((_, i) => i !== index));

  return (
    <FormSection
      title="Complainant / Victim Information"
      subtitle="CJI-protected personal identifiers"
      badge={victims.length}
    >
      <div className="flex items-center gap-2 mb-4">
        <CjiBadge />
        {cjiRestricted && (
          <span className="text-xs text-amber-400">Some fields restricted — insufficient CJI authorization</span>
        )}
      </div>
      <div className="space-y-4">
        {victims.map((victim, i) => (
          <DynamicEntryCard
            key={victim.id ?? i}
            title="Entry"
            index={i}
            onRemove={() => remove(i)}
            canRemove={victims.length > 1 && !disabled}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Role">
                <select
                  className={selectClass}
                  value={victim.role}
                  onChange={(e) => update(i, { role: e.target.value as PartyRole })}
                  disabled={disabled}
                >
                  <option value="victim">Victim</option>
                  <option value="complainant">Complainant</option>
                  <option value="witness">Witness</option>
                </select>
              </FormField>
              <FormField label="Full Name">
                <input className={inputClass} value={victim.full_name ?? ""} onChange={(e) => update(i, { full_name: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" className={inputClass} value={victim.date_of_birth ?? ""} onChange={(e) => update(i, { date_of_birth: e.target.value })} disabled={disabled || cjiRestricted} />
              </FormField>
              <FormField label="Gender">
                <input className={inputClass} value={victim.gender ?? ""} onChange={(e) => update(i, { gender: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="Race / Ethnicity">
                <input className={inputClass} value={victim.race_ethnicity ?? ""} onChange={(e) => update(i, { race_ethnicity: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="Phone Number">
                <input type="tel" className={inputClass} value={victim.phone_number ?? ""} onChange={(e) => update(i, { phone_number: e.target.value })} disabled={disabled || cjiRestricted} />
              </FormField>
              <FormField label="Email Address">
                <input type="email" className={inputClass} value={victim.email_address ?? ""} onChange={(e) => update(i, { email_address: e.target.value })} disabled={disabled || cjiRestricted} />
              </FormField>
              <FormField label="Driver License / State ID" className="sm:col-span-2">
                <input className={inputClass} value={victim.driver_license ?? ""} onChange={(e) => update(i, { driver_license: e.target.value })} disabled={disabled || cjiRestricted} />
              </FormField>
              <FormField label="Home Address" className="lg:col-span-3">
                <input className={inputClass} value={victim.home_address ?? ""} onChange={(e) => update(i, { home_address: e.target.value })} disabled={disabled || cjiRestricted} />
              </FormField>
              <FormField label="Relationship to Incident">
                <input className={inputClass} value={victim.relationship_to_incident ?? ""} onChange={(e) => update(i, { relationship_to_incident: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="Injury Information" className="sm:col-span-2">
                <input className={inputClass} value={victim.injury_information ?? ""} onChange={(e) => update(i, { injury_information: e.target.value })} disabled={disabled} />
              </FormField>
              <FormField label="Statement Summary" className="lg:col-span-3">
                <textarea className={textareaClass} value={victim.statement_summary ?? ""} onChange={(e) => update(i, { statement_summary: e.target.value })} disabled={disabled} rows={3} />
              </FormField>
            </div>
          </DynamicEntryCard>
        ))}
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={add}
          className="mt-4 text-sm px-4 py-2 rounded-md bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
        >
          Add Another Victim / Complainant
        </button>
      )}
    </FormSection>
  );
}
