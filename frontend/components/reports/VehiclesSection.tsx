"use client";

import { DynamicEntryCard, FormField, FormSection, inputClass, YesNoSelect } from "@/components/reports/FormSection";
import { EMPTY_VEHICLE, type VehicleEntry } from "@/lib/report-types";

interface VehiclesSectionProps {
  vehicles: VehicleEntry[];
  onChange: (vehicles: VehicleEntry[]) => void;
  disabled?: boolean;
}

export function VehiclesSection({ vehicles, onChange, disabled }: VehiclesSectionProps) {
  const update = (index: number, patch: Partial<VehicleEntry>) => {
    const next = [...vehicles];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const add = () => onChange([...vehicles, EMPTY_VEHICLE()]);
  const remove = (index: number) => onChange(vehicles.filter((_, i) => i !== index));

  return (
    <FormSection title="Vehicle Information" badge={vehicles.length || undefined} defaultOpen={vehicles.length > 0}>
      {vehicles.length === 0 && (
        <p className="text-sm text-slate-500 mb-4">No vehicles recorded. Add a vehicle if applicable.</p>
      )}
      <div className="space-y-4">
        {vehicles.map((vehicle, i) => (
          <DynamicEntryCard key={vehicle.id ?? i} title="Vehicle" index={i} onRemove={() => remove(i)} canRemove={!disabled}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Year"><input className={inputClass} value={vehicle.year ?? ""} onChange={(e) => update(i, { year: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Make"><input className={inputClass} value={vehicle.make ?? ""} onChange={(e) => update(i, { make: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Model"><input className={inputClass} value={vehicle.model ?? ""} onChange={(e) => update(i, { model: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Color"><input className={inputClass} value={vehicle.color ?? ""} onChange={(e) => update(i, { color: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Style"><input className={inputClass} value={vehicle.style ?? ""} onChange={(e) => update(i, { style: e.target.value })} disabled={disabled} placeholder="Sedan, SUV, etc." /></FormField>
              <FormField label="License Plate"><input className={inputClass} value={vehicle.license_plate ?? ""} onChange={(e) => update(i, { license_plate: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="State"><input className={inputClass} value={vehicle.state ?? ""} onChange={(e) => update(i, { state: e.target.value })} disabled={disabled} maxLength={2} /></FormField>
              <FormField label="VIN" className="sm:col-span-2"><input className={inputClass} value={vehicle.vin ?? ""} onChange={(e) => update(i, { vin: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Damage Description" className="lg:col-span-3"><input className={inputClass} value={vehicle.damage_description ?? ""} onChange={(e) => update(i, { damage_description: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Registered Owner"><input className={inputClass} value={vehicle.registered_owner ?? ""} onChange={(e) => update(i, { registered_owner: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Towed"><YesNoSelect value={vehicle.towed} onChange={(v) => update(i, { towed: v })} disabled={disabled} /></FormField>
              <FormField label="Tow Company"><input className={inputClass} value={vehicle.tow_company ?? ""} onChange={(e) => update(i, { tow_company: e.target.value })} disabled={disabled} /></FormField>
              <FormField label="Associated Person"><input className={inputClass} value={vehicle.associated_person ?? ""} onChange={(e) => update(i, { associated_person: e.target.value })} disabled={disabled} /></FormField>
            </div>
          </DynamicEntryCard>
        ))}
      </div>
      {!disabled && (
        <button type="button" onClick={add} className="mt-4 text-sm px-4 py-2 rounded-md bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors">
          Add Vehicle
        </button>
      )}
    </FormSection>
  );
}
