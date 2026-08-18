// src/app/(portal)/branch/roster/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<RosterRow[]>("/branch/roster")`.
 * Drag-and-drop reassignment is NOT wired yet — chips are display-only.
 * ─────────────────────────────────────────────────────────────────────────
 */
type ShiftKind = "Morning" | "Evening" | "Night" | "Off";

interface Shift {
  kind: ShiftKind;
  time?: string;
}

interface RosterRow {
  employeeName: string;
  days: Shift[]; // 7 entries, Mon–Sun
}

const DAYS = ["MON 23", "TUE 24", "WED 25", "THU 26", "FRI 27", "SAT 28", "SUN 29"];

const ROSTER: RosterRow[] = [
  {
    employeeName: "Alice Johnson",
    days: [
      { kind: "Morning", time: "08:00 - 16:00" },
      { kind: "Morning", time: "08:00 - 16:00" },
      { kind: "Evening", time: "15:00 - 23:00" },
      { kind: "Off" },
      { kind: "Morning", time: "08:00 - 16:00" },
      { kind: "Off" },
      { kind: "Off" },
    ],
  },
  {
    employeeName: "Bob Smith",
    days: [
      { kind: "Evening", time: "15:00 - 23:00" },
      { kind: "Off" },
      { kind: "Morning", time: "08:00 - 16:00" },
      { kind: "Evening", time: "15:00 - 23:00" },
      { kind: "Evening", time: "15:00 - 23:00" },
      { kind: "Night", time: "23:00 - 07:00" },
      { kind: "Night", time: "23:00 - 07:00" },
    ],
  },
];

function chipClass(kind: ShiftKind) {
  switch (kind) {
    case "Morning":
      return "bg-primary-container/10 border-primary-container/20 text-on-primary-fixed-variant";
    case "Evening":
      return "bg-tertiary-container/10 border-tertiary-container/20 text-tertiary";
    case "Night":
      return "bg-secondary-container/30 border-secondary/20 text-secondary";
    default:
      return "bg-surface-variant/30 border-outline-variant/30 border-dashed text-on-surface-variant justify-center";
  }
}

export default async function WeeklyRosterPage() {
  await requirePermission("shift:assign");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-bold text-on-surface">Weekly Roster: Downtown Branch</h1>
          <p className="text-xs text-on-surface-variant">Oct 23 - Oct 29, 2023</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 rounded-md border border-outline-variant px-3 py-1.5 text-sm font-medium transition hover:bg-surface-variant">
            <Icon name="chevron_left" className="text-sm" />
            Prev
          </button>
          <button className="flex items-center gap-1 rounded-md border border-outline-variant px-3 py-1.5 text-sm font-medium transition hover:bg-surface-variant">
            Next
            <Icon name="chevron_right" className="text-sm" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-ambient-1">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E9EFF5] bg-surface/50">
                <th className="sticky left-0 z-10 w-48 bg-surface/90 p-4 text-[10px] font-semibold uppercase text-on-surface-variant backdrop-blur">
                  Employee
                </th>
                {DAYS.map((d) => (
                  <th key={d} className="min-w-[140px] p-4 text-center text-[10px] font-semibold uppercase text-on-surface-variant">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EFF5] text-sm">
              {ROSTER.map((row) => (
                <tr key={row.employeeName} className="transition-colors hover:bg-surface-variant/20">
                  <td className="sticky left-0 z-10 bg-surface-container-lowest/90 p-4 font-medium backdrop-blur">{row.employeeName}</td>
                  {row.days.map((shift, i) => (
                    <td key={i} className="p-2">
                      <div className={`flex min-h-[58px] items-center gap-2 rounded-md border p-2 ${chipClass(shift.kind)}`}>
                        {shift.kind !== "Off" ? (
                          <>
                            <Icon name="drag_indicator" className="cursor-grab text-sm text-outline-variant" />
                            <div className="flex-1 text-center font-medium">
                              {shift.kind}
                              <br />
                              <span className="text-[10px] font-normal text-on-surface-variant">{shift.time}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs font-medium">OFF</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}