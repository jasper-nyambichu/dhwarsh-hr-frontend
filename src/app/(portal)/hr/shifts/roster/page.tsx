// src/app/(portal)/hr/shifts/roster/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<RosterRow[]>("/hr/shifts/roster")`.
 * ─────────────────────────────────────────────────────────────────────────
 */
type ShiftKind = "Morning" | "Evening" | "Night" | "Off";

interface Cell {
  kind: ShiftKind;
  time?: string;
}

interface RosterRow {
  name: string;
  employeeId: string;
  initials: string;
  days: Cell[]; // Mon-Sun
}

const DAYS = [
  { label: "MON", date: "23" },
  { label: "TUE", date: "24" },
  { label: "WED", date: "25" },
  { label: "THU", date: "26" },
  { label: "FRI", date: "27" },
  { label: "SAT", date: "28" },
  { label: "SUN", date: "29" },
];

const ROSTER: RosterRow[] = [
  {
    name: "Sarah Jenkins",
    employeeId: "EMP-001",
    initials: "SJ",
    days: [
      { kind: "Morning", time: "08:00 - 16:00" },
      { kind: "Morning", time: "08:00 - 16:00" },
      { kind: "Off" },
      { kind: "Evening", time: "16:00 - 00:00" },
      { kind: "Evening", time: "16:00 - 00:00" },
      { kind: "Night", time: "00:00 - 08:00" },
      { kind: "Off" },
    ],
  },
];

function cellClass(kind: ShiftKind) {
  switch (kind) {
    case "Morning":
      return "bg-primary-container/20 border-primary-container/30 text-primary-fixed-dim";
    case "Evening":
      return "bg-secondary-container/30 border-secondary/30 text-secondary";
    case "Night":
      return "bg-on-secondary-fixed text-on-primary";
    default:
      return "bg-surface-container-high text-on-surface-variant border-dashed border-surface-variant";
  }
}

export default async function WeeklyRosterPage() {
  await requirePermission("shift:write");

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-gutter">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 text-xl font-bold text-on-surface">Weekly Roster</h1>
          <p className="text-on-surface-variant">Manage and publish employee shifts</p>
        </div>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <div className="flex w-full items-center rounded-lg border border-surface-container-high bg-surface-container-low p-1 sm:w-auto">
            <button className="rounded p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest">
              <Icon name="chevron_left" />
            </button>
            <span className="whitespace-nowrap px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface">OCT 23 - OCT 29, 2023</span>
            <button className="rounded p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest">
              <Icon name="chevron_right" />
            </button>
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 px-6 text-[10px] font-semibold uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant sm:w-auto">
            <Icon name="publish" className="text-[18px]" />
            Publish Roster
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest shadow-[0_2px_8px_rgba(11,42,69,.06)]">
        <div className="flex-1 overflow-x-auto">
          <div className="grid min-w-[1040px] border-l border-t border-surface-container-high" style={{ gridTemplateColumns: "200px repeat(7, minmax(120px, 1fr))" }}>
            <div className="sticky left-0 top-0 z-30 flex items-end border-b border-r border-surface-container-high bg-surface-container-low p-3 pb-4 text-[10px] font-semibold uppercase text-on-surface-variant">
              Employee
            </div>
            {DAYS.map((d, i) => (
              <div
                key={d.label}
                className={`sticky top-0 z-10 border-b border-r border-surface-container-high bg-surface-container-low p-3 text-center text-[10px] font-semibold uppercase ${
                  i >= 5 ? "bg-surface-container-high/30" : ""
                }`}
              >
                <div className="mb-1 text-on-surface-variant">{d.label}</div>
                <div className="text-sm text-on-surface">{d.date}</div>
              </div>
            ))}

            {ROSTER.map((row) => (
              <>
                <div key={row.employeeId} className="sticky left-0 z-20 border-b border-r-2 border-surface-container-high bg-surface-container-lowest p-3 transition-colors hover:bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary-container text-[10px] font-bold text-on-primary-container">
                      {row.initials}
                    </div>
                    <div>
                      <div className="font-bold text-on-surface">{row.name}</div>
                      <div className="text-[10px] text-on-surface-variant">{row.employeeId}</div>
                    </div>
                  </div>
                </div>
                {row.days.map((cell, i) => (
                  <div key={i} className={`border-b border-r border-surface-container-high p-3 transition-colors hover:bg-surface-container-low ${i >= 5 ? "bg-surface-container-highest/20" : ""}`}>
                    <div className={`flex h-full cursor-pointer flex-col justify-center rounded border p-2 text-center transition-shadow hover:shadow-md ${cellClass(cell.kind)}`}>
                      {cell.kind !== "Off" ? (
                        <>
                          <span className="text-[11px] font-bold">{cell.time}</span>
                          <span className="mt-1 text-[9px} uppercase opacity-80">{cell.kind}</span>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold">OFF</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 border-t border-surface-container-high bg-surface-container-low p-4">
          <span className="mr-2 text-[10px] font-semibold uppercase text-on-surface-variant">Legend:</span>
          <LegendItem colorClass="bg-primary-container/20 border-primary-container/30" label="Morning Shift" />
          <LegendItem colorClass="bg-secondary-container/30 border-secondary/30" label="Evening Shift" />
          <LegendItem colorClass="bg-on-secondary-fixed" label="Night Shift" />
          <LegendItem colorClass="bg-surface-container-high border-dashed border-surface-variant" label="Off Day" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`size-4 rounded border ${colorClass}`} />
      <span className="text-[11px] font-medium text-on-surface">{label}</span>
    </div>
  );
}