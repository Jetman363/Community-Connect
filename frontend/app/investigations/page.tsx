"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PriorityBadge, EntityGraph } from "@/components/ui/DataDisplay";
import { INVESTIGATIONS, ENTITY_LINKS } from "@/lib/mock-data";
import { formatDateTime, cn } from "@/lib/utils";
import { Network, Users, Link2, Clock } from "lucide-react";

export default function InvestigationsPage() {
  const [selected, setSelected] = useState(INVESTIGATIONS[0]);

  return (
    <AppShell title="Investigations Workspace" subtitle="Entity resolution · Link analysis · Cross-case intelligence">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="panel xl:col-span-1">
          <div className="panel-header">
            <span className="text-sm font-medium text-white">Active Investigations</span>
            <span className="text-xs text-slate-500">{INVESTIGATIONS.length} cases</span>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
            {INVESTIGATIONS.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelected(inv)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-slate-800/30 transition-colors",
                  selected.id === inv.id && "bg-cyan-500/5 border-l-2 border-cyan-500"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-cyan-400">{inv.id}</span>
                  <PriorityBadge priority={inv.priority} />
                </div>
                <div className="text-sm text-slate-200 font-medium mb-1">{inv.title}</div>
                <div className="text-xs text-slate-500">{inv.leadDetective}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="font-mono text-xs text-cyan-400 mb-0.5">{selected.id}</div>
                <span className="text-sm font-medium text-white">{selected.title}</span>
              </div>
              <PriorityBadge priority={selected.priority} />
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-300 leading-relaxed mb-4">{selected.summary}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/50 rounded-md p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Users className="w-3 h-3" /> Subjects
                  </div>
                  <div className="text-lg font-semibold text-white">{selected.subjects}</div>
                </div>
                <div className="bg-slate-900/50 rounded-md p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Link2 className="w-3 h-3" /> Linked Cases
                  </div>
                  <div className="text-lg font-semibold text-white">{selected.linkedCases}</div>
                </div>
                <div className="bg-slate-900/50 rounded-md p-3">
                  <div className="text-xs text-slate-500 mb-1">Status</div>
                  <div className="text-sm font-medium text-emerald-400 capitalize">{selected.status}</div>
                </div>
                <div className="bg-slate-900/50 rounded-md p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Clock className="w-3 h-3" /> Updated
                  </div>
                  <div className="text-xs text-slate-300">{formatDateTime(selected.lastUpdated)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Link Analysis</span>
                </div>
              </div>
              <div className="p-4 h-52">
                <EntityGraph />
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="text-sm font-medium text-white">Entity Links</span>
              </div>
              <div className="overflow-x-auto max-h-52">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Relation</th>
                      <th>Target</th>
                      <th>Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENTITY_LINKS.map((link) => (
                      <tr key={link.id} className="hover:bg-slate-800/20">
                        <td className="text-slate-300 text-xs">{link.source}</td>
                        <td className="text-cyan-400 text-xs font-mono">{link.relation}</td>
                        <td className="text-slate-300 text-xs">{link.target}</td>
                        <td className="text-slate-400 text-xs tabular-nums">{(link.confidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="text-sm font-medium text-white">Timeline Reconstruction</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { time: "2026-05-27 09:15", event: "Traffic stop initiated – N Main St", type: "field" },
                { time: "2026-05-27 09:22", event: "Consent search – narcotics located", type: "field" },
                { time: "2026-05-27 09:35", event: "Arrest – Marcus J. Webb, PCS Sch II", type: "arrest" },
                { time: "2026-05-27 10:00", event: "Case linked to INV-2026-0041 (Operation Nightfall)", type: "intel" },
                { time: "2026-05-27 12:00", event: "BOLO issued – White Ford F-150, associate vehicle", type: "alert" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-28 shrink-0 text-xs font-mono text-slate-500 tabular-nums">{item.time}</div>
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <div className="text-sm text-slate-300">{item.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
