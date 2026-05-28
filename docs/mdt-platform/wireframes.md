# MDT Platform — Wireframes

## Officer MDT (Patrol Vehicle / Tablet)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◀ BlueCore MDT          Unit: 1A12                    Officer Smith     │
├──────────────┬───────────────────────────────────────┬───────────────────┤
│ ACTIVE CALLS │  P2  2026-000002                      │  UNIT STATUS      │
│              │  Traffic stop — possible DWI           │ ┌───────┬───────┐ │
│ ▶ P2 DWI     │  ─────────────────────────────────    │ │En Rt  │On Scn │ │
│   P1 Medical │  Location: Hwy 281 / Evans Rd         │ ├───────┼───────┤ │
│   P4 Disturb │  Cross: 281 / Evans                   │ │Transp │ Clear │ │
│              │  Caller: —  Phone: —                   │ ├───────┼───────┤ │
│              │  ┌─────────────────────────────────┐  │ │OOS    │ Meal  │ │
│              │  │         [ GIS MAP VIEW ]        │  │ └───────┴───────┘ │
│              │  │    📍 Incident    🚔 Unit         │  │                   │
│              │  └─────────────────────────────────┘  │  ╔═══════════════╗  │
│              │  Dispatch Notes: Erratic driving     │  ║ SILENT EMERG  ║  │
│              │  Assigned: 1A12                      │  ╚═══════════════╝  │
│              │                                       │  DISPATCH CHAT    │
│              │  [ 🧭 Navigate to Call ]              │  ─────────────    │
└──────────────┴───────────────────────────────────────┴───────────────────┘
```

## Dispatch Console (Multi-Monitor)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ DISPATCH CONSOLE                                    LIVE ●  Dispatcher   │
├─────────────┬─────────────┬─────────────┬────────────────────────────────┤
│ INCOMING    │ ACTIVE      │ AVAILABLE   │  GIS MAP + ASSIGNMENT DROP     │
│ CALLS (3)   │ INCIDENTS   │ UNITS (4)   │                                │
│             │             │             │  Selected: P2 DWI              │
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │  Hwy 281 / Evans               │
│ │P1 Med   │ │ │P2 DWI ●│ │ │ 1A12    │ │                                │
│ └─────────┘ │ │ 1A12   │ │ │ 2B07    │ │  Recommended:                  │
│ ┌─────────┐ │ └─────────┘ │ │ EMS-3   │ │  ★ 2B07 (Score 78) — 2.1 mi  │
│ │P4 Dist  │ │             │ │ K9-1    │ │  ○ EMS-3 — Specialty match   │
│ └─────────┘ │             │ └─────────┘ │                                │
│             │             │  (drag →)   │  ┌──────────────────────────┐  │
├─────────────┴─────────────┴─────────────┤  │ UNIT STATUS BOARD        │  │
│ EVENT TIMELINE │ ALERTS │ RADIO LOG     │  │ 1A12 en_rt  2B07 avail  │  │
└─────────────────────────────────────────┴──┴──────────────────────────┴──┘
```

## 911 Call Intake

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 911 CALL INTAKE                                    Line 1 ●  00:02:34   │
├──────────────────────────────┬───────────────────────┬───────────────────┤
│ CALLER INFO                  │ AI EXTRACTION         │ GIS PLOT          │
│ Name: [________]             │ Type: traffic         │                   │
│ Phone: [210-555-0199]        │ Priority: P2          │   [ ALI MAP ]     │
│ Location: [Hwy 281...]       │ Code: 10-55           │                   │
│ Apt: [____]  Priority: [P2]  │ Confidence: 82%       │ ANI/ALI: ✓        │
│                              │                       │ RapidSOS: Ready   │
│ LIVE TRANSCRIPT              │ Entities:             │ NG911: Ready      │
│ ┌──────────────────────────┐ │  vehicle: Ford F-150  │                   │
│ │ There's a white Ford...  │ │  location: Hwy 281    │                   │
│ │                          │ │  direction: northbound│                   │
│ └──────────────────────────┘ │                       │                   │
│ [ ✨ AI Parse & Auto-Fill ]   │ Threats: (none)       │                   │
│                              │                       │                   │
│ CAD OVERRIDE                 │ [ Create & Dispatch ] │                   │
│ Type: [traffic]              │                       │                   │
│ Notes: [_______________]     │                       │                   │
└──────────────────────────────┴───────────────────────┴───────────────────┘
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0c0c0e` | Primary background |
| Panel | `#141418` | Card/panel surfaces |
| Border | `#2a2a32` | Dividers |
| Accent | `#3b82f6` | Interactive elements |
| P1 Alert | `#ef4444` | Critical priority |
| P2 Alert | `#f59e0b` | Urgent priority |

Touch targets: minimum 48×48px. Font: Inter (UI), JetBrains Mono (incident numbers, unit IDs).
