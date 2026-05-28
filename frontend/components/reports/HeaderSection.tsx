"use client";

import { FormField, FormSection, inputClass, selectClass } from "@/components/reports/FormSection";
import type { ReportHeader } from "@/lib/report-types";
import { REQUIRED_HEADER_FIELDS } from "@/lib/report-types";

interface HeaderSectionProps {
  header: ReportHeader;
  onChange: (header: ReportHeader) => void;
  disabled?: boolean;
  errors?: Partial<Record<keyof ReportHeader, string>>;
}

const PRIORITIES = ["Emergency", "Priority", "Routine", "Low"];
const CALL_TYPES = ["911", "Officer Initiated", "Citizen Report", "Follow-Up", "Other"];

export function HeaderSection({ header, onChange, disabled, errors = {} }: HeaderSectionProps) {
  const set = (key: keyof ReportHeader, value: string) => {
    onChange({ ...header, [key]: value });
  };

  return (
    <FormSection title="Report Header" subtitle="Core incident identification and assignment">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(
          [
            ["incident_number", "Incident Number", true],
            ["case_number", "Case Number", false],
            ["report_date", "Report Date", true],
            ["report_time", "Report Time", false],
            ["reporting_officer_name", "Reporting Officer", true],
            ["supervisor_name", "Supervisor", false],
            ["incident_location", "Incident Location", true],
            ["incident_type", "Incident Type", true],
            ["call_type", "Call Type", false],
            ["priority_level", "Priority Level", false],
            ["agency", "Agency", false],
            ["division_unit", "Division / Unit", false],
          ] as const
        ).map(([key, label, required]) => {
          if (key === "call_type") {
            return (
              <FormField key={key} label={label} required={required} error={errors[key]}>
                <select
                  className={selectClass}
                  value={header.call_type ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                  disabled={disabled}
                >
                  <option value="">— Select —</option>
                  {CALL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>
            );
          }
          if (key === "priority_level") {
            return (
              <FormField key={key} label={label} required={required} error={errors[key]}>
                <select
                  className={selectClass}
                  value={header.priority_level ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                  disabled={disabled}
                >
                  <option value="">— Select —</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </FormField>
            );
          }
          const inputType = key === "report_date" ? "date" : key === "report_time" ? "time" : "text";
          return (
            <FormField
              key={key}
              label={label}
              required={required || REQUIRED_HEADER_FIELDS.includes(key)}
              error={errors[key]}
            >
              <input
                type={inputType}
                className={inputClass}
                value={(header[key] as string) ?? ""}
                onChange={(e) => set(key, e.target.value)}
                disabled={disabled}
              />
            </FormField>
          );
        })}
        <FormField label="Assisting Officer(s)" className="sm:col-span-2 lg:col-span-3">
          <input
            type="text"
            className={inputClass}
            placeholder="Comma-separated names or badge numbers"
            value={(header.assisting_officers ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                ...header,
                assisting_officers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            disabled={disabled}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
