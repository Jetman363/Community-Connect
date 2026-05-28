"use client";

import { DynamicEntryCard, FormField, FormSection, inputClass, YesNoSelect } from "@/components/reports/FormSection";
import { EMPTY_WEAPON, type WeaponEntry } from "@/lib/report-types";

interface WeaponsSectionProps {
  weapons: WeaponEntry[];
  onChange: (weapons: WeaponEntry[]) => void;
  disabled?: boolean;
}

export function WeaponsSection({ weapons, onChange, disabled }: WeaponsSectionProps) {
  const update = (index: number, patch: Partial<WeaponEntry>) => {
    const next = [...weapons];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const add = () => onChange([...weapons, EMPTY_WEAPON()]);
  const remove = (index: number) => onChange(weapons.filter((_, i) => i !== index));

  return (
    <FormSection title="Weapons" badge={weapons.length || undefined} defaultOpen={weapons.length > 0}>
      <div className="space-y-4">
        {weapons.map((weapon, i) => (
          <DynamicEntryCard key={weapon.id ?? i} title="Weapon" index={i} onRemove={() => remove(i)} canRemove={!disabled}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Weapon Type"><input className={inputClass} value={weapon.weapon_type ?? ""} onChange={(e) => update(i, { weapon_type: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Make"><input className={inputClass} value={weapon.make ?? ""} onChange={(e) => update(i, { make: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Model"><input className={inputClass} value={weapon.model ?? ""} onChange={(e) => update(i, { model: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Caliber"><input className={inputClass} value={weapon.caliber ?? ""} onChange={(e) => update(i, { caliber: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Serial Number"><input className={inputClass} value={weapon.serial_number ?? ""} onChange={(e) => update(i, { serial_number: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Evidence Tag Number"><input className={inputClass} value={weapon.evidence_tag_number ?? ""} onChange={(e) => update(i, { evidence_tag_number: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Loaded"><YesNoSelect value={weapon.loaded} onChange={(v) => update(i, { loaded: v })} disabled={disabled} /></FormField>
              <FormField label="Recovered"><YesNoSelect value={weapon.recovered} onChange={(v) => update(i, { recovered: v })} disabled={disabled} /></FormField>
              <FormField label="Stolen"><YesNoSelect value={weapon.stolen} onChange={(v) => update(i, { stolen: v })} disabled={disabled} /></FormField>
              <FormField label="Associated Suspect" className="sm:col-span-2"><input className={inputClass} value={weapon.associated_suspect ?? ""} onChange={(e) => update(i, { associated_suspect: e.target.value })} disabled={disabled} /></FormField>
            </div>
          </DynamicEntryCard>
        ))}
      </div>
      {!disabled && (
        <button type="button" onClick={add} className="mt-4 text-sm px-4 py-2 rounded-md bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors">
          Add Weapon
        </button>
      )}
    </FormSection>
  );
}
