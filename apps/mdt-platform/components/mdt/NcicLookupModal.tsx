"use client";

import { useState } from "react";
import clsx from "clsx";
import { Car, Loader2, User, X } from "lucide-react";
import { queryNcicPerson, queryNcicVehicle } from "@/lib/cad-api";
import type { Incident, NcicQueryResult } from "@/lib/types";

type LookupMode = "vehicle" | "person";

interface Props {
  mode: LookupMode | null;
  incident: Incident | null;
  onClose: () => void;
  onResult?: (result: NcicQueryResult) => void;
}

export function NcicLookupModal({ mode, incident, onClose, onResult }: Props) {
  const [plate, setPlate] = useState("");
  const [state, setState] = useState("TX");
  const [vin, setVin] = useState("");
  const [lastName, setLastName] = useState(incident?.caller_name?.split(" ").slice(-1)[0] ?? "");
  const [firstName, setFirstName] = useState(incident?.caller_name?.split(" ")[0] ?? "");
  const [dob, setDob] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [sid, setSid] = useState("");
  const [address, setAddress] = useState(incident?.location ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NcicQueryResult | null>(null);

  if (!mode) return null;

  const runQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res =
        mode === "vehicle"
          ? await queryNcicVehicle({
              plate: plate || undefined,
              state,
              vin: vin || undefined,
            })
          : await queryNcicPerson({
              last_name: lastName || undefined,
              first_name: firstName || undefined,
              dob: dob || undefined,
              dl_number: dlNumber || undefined,
              sid: sid || undefined,
              address: address || undefined,
            });
      setResult(res);
      onResult?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "NCIC query failed");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    mode === "vehicle"
      ? plate.trim().length >= 2 || vin.trim().length >= 11
      : lastName.trim().length >= 1 || sid.trim().length >= 3 || address.trim().length >= 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="tactical-panel w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#2a2a32] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === "vehicle" ? (
              <Car className="w-5 h-5 text-cyan-400" />
            ) : (
              <User className="w-5 h-5 text-cyan-400" />
            )}
            <h2 className="font-bold text-slate-100">
              {mode === "vehicle" ? "TCIC/NCIC — Vehicle Query" : "TCIC/NCIC — Person Query"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {incident && (
            <p className="text-xs text-slate-500">
              Linked call: <span className="font-mono text-slate-400">{incident.incident_number}</span>
              {incident.nature ? ` — ${incident.nature}` : ""}
            </p>
          )}

          {mode === "vehicle" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <label className="col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase">License Plate</span>
                  <input
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="ABC-1234"
                    className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </label>
                <label>
                  <span className="text-[10px] text-slate-500 uppercase">State</span>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                    maxLength={2}
                    className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </label>
              </div>
              <label>
                <span className="text-[10px] text-slate-500 uppercase">VIN</span>
                <input
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17))}
                  placeholder="1FTFW1ET5DFC12345"
                  maxLength={17}
                  className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="text-[10px] text-slate-500 uppercase">Last Name</span>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </label>
                <label>
                  <span className="text-[10px] text-slate-500 uppercase">First Name</span>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="text-[10px] text-slate-500 uppercase">DOB</span>
                  <input
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="MM/DD/YYYY"
                    className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </label>
                <label>
                  <span className="text-[10px] text-slate-500 uppercase">DL Number</span>
                  <input
                    value={dlNumber}
                    onChange={(e) => setDlNumber(e.target.value)}
                    className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </label>
              </div>
              <label>
                <span className="text-[10px] text-slate-500 uppercase">SID (State ID)</span>
                <input
                  value={sid}
                  onChange={(e) => setSid(e.target.value.toUpperCase())}
                  placeholder="TX01234567"
                  className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </label>
              <label>
                <span className="text-[10px] text-slate-500 uppercase">Address</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, city, or last known location"
                  className="w-full mt-0.5 bg-[#1a1a20] border border-[#2a2a32] rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </label>
            </div>
          )}

          {mode === "vehicle" && (
            <p className="text-[10px] text-slate-600">
              Demo hits: plate ABC-1234 · VIN 1FTFW1ET5DFC12345 (stolen vehicle BOLO)
            </p>
          )}
          {mode === "person" && (
            <p className="text-[10px] text-slate-600">
              Demo hits: last name Doe · SID TX01234567 · address containing Elm
            </p>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-600/10 border border-red-500/30 rounded p-2">{error}</p>
          )}

          {result && (
            <div
              className={clsx(
                "rounded border p-3 space-y-2",
                result.status === "hit"
                  ? "bg-red-600/10 border-red-500/50"
                  : result.status === "error"
                    ? "bg-amber-600/10 border-amber-500/40"
                    : "bg-green-600/10 border-green-500/40",
              )}
            >
              <p
                className={clsx(
                  "text-sm font-bold uppercase",
                  result.status === "hit"
                    ? "text-red-300"
                    : result.status === "error"
                      ? "text-amber-300"
                      : "text-green-300",
                )}
              >
                {result.message}
              </p>
              <p className="text-[10px] font-mono text-slate-500">Query ID: {result.query_id}</p>
              {result.hits.map((hit, i) => (
                <div key={i} className="bg-[#0c0c0e] rounded p-2 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-red-400">{hit.type}</span>
                    <span className="text-slate-500">{hit.source}</span>
                  </div>
                  {hit.title && <p className="text-slate-200 font-medium">{hit.title}</p>}
                  {hit.subject_name && <p className="text-slate-200">{hit.subject_name}</p>}
                  {hit.description && <p className="text-slate-400">{hit.description}</p>}
                  {hit.warrant_type && (
                    <p className="text-amber-300">Warrant: {hit.warrant_type} · Case {hit.case_number}</p>
                  )}
                  {hit.location_hint && <p className="text-slate-500">Last known: {hit.location_hint}</p>}
                  {hit.sid && <p className="font-mono text-slate-400">SID: {hit.sid}</p>}
                  {hit.match_reason && <p className="text-cyan-600/80 italic">{hit.match_reason}</p>}
                  {hit.plate && <p className="font-mono text-slate-400">Plate: {hit.plate}</p>}
                  {hit.vin && <p className="font-mono text-slate-400">VIN: {hit.vin}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#2a2a32] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="tactical-btn flex-1 bg-[#1a1a20] border border-[#2a2a32] text-slate-300"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={runQuery}
            className="tactical-btn flex-1 bg-cyan-700 hover:bg-cyan-600 text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Querying…</>
            ) : (
              "Run Query"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
