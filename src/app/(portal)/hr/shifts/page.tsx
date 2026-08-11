// src/app/(portal)/hr/shifts/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<Shift[]>("/hr/shifts")`.
 * Time-track bar positions (left%/width%) are computed from start/end here
 * rather than hardcoded, so they stay correct if times change.
 * ─────────────────────────────────────────────────────────────────────────
 */
interface Shift {
  id: string;
  name: string;
  department: string;
  status: "Active" | "Upcoming";
  startHour: number; // 0-24, can wrap past 24 for overnight display purposes handled separately
  endHour: number;
  breakStartHour?: number;
  breakMinutes?: number;
  assignedAvatars: string[];
  assignedExtra: number;
  totalAssigned: number;
  startLabel: string;
  endLabel: string;
  breakMins: number;
  days: string;
}

const SHIFTS: Shift[] = [
  {
    id: "1",
    name: "Morning Shift",
    department: "All",
    status: "Active",
    startHour: 8,
    endHour: 16,
    breakStartHour: 13,
    breakMinutes: 30,
    assignedAvatars: ["/avatars/staff-1.jpg", "/avatars/staff-2.jpg", "/avatars/staff-3.jpg"],
    assignedExtra: 39,
    totalAssigned: 42,
    startLabel: "08:00",
    endLabel: "16:00",
    breakMins: 60,
    days: "Mon-Fri",
  },
  {
    id: "2",
    name: "Evening Shift",
    department: "Operations",
    status: "Active",
    startHour: 15,
    endHour: 23,
    breakStartHour: 19,
    breakMinutes: 30,
    assignedAvatars: ["/avatars/staff-4.jpg", "/avatars/staff-5.jpg"],
    assignedExtra: 28,
    totalAssigned: 30,
    startLabel: "15:00",
    endLabel: "23:00",
    breakMins: 45,
    days: "Mon-Fri",
  },
  {
    id: "3",
    name: "Night Shift",
    department: "Security",
    status: "Upcoming",
    startHour: 23,
    endHour: 7,
    assignedAvatars: ["/avatars/staff-6.jpg"],
    assignedExtra: 17,
    totalAssigned: 18,
    startLabel: "07:00",
    endLabel: "23:00",
    breakMins: 45,
    days: "Mon-Fri",
  },
];

const COVERAGE = [
  { label: "Morning", count: 42, pct: 45, color: "bg-primary-container" },
  { label: "Evening", count: 30, pct: 35, color: "bg-secondary" },
  { label: "Night", count: 18, pct: 20, color: "bg-on-secondary-fixed-variant" },
];

function timeBandStyle(startHour: number, endHour: number) {
  // handles overnight (end < start) by returning two segments; caller decides
  const left = (startHour / 24) * 100;
  const width = ((endHour - startHour + 24) % 24 || 24) / 24 * 100;
  return { left: `${left}%`, width: `${width}%` };
}

export default async function ShiftsPage() {
  await requirePermission("shift:write");

  return (
    <>
      <div className="mb-gutter flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Shift Management</h1>
          <p className="mt-1 text-on-surface-variant">Manage schedules, track coverage, and assign staff.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#0B2A45] px-6 py-2 font-bold text-on-primary shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:bg-on-primary-fixed-variant hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
          <Icon name="add" />
          Create Shift
        </button>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          {SHIFTS.map((shift) => (
            <div key={shift.id} className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{shift.name}</h3>
                  <p className="mt-1 text-xs text-on-surface-variant">Department: {shift.department}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider ${
                      shift.status === "Active" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    {shift.status}
                  </span>
                  <div className="flex -space-x-2">
                    {shift.assignedAvatars.map((url, i) => (
                      <div key={i} className="size-8 overflow-hidden rounded-full border-2 border-surface-container-lowest bg-surface-variant">
                        <img src={url} alt="" className="size-full object-cover" />
                      </div>
                    ))}
                    <div className="z-10 flex size-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-primary-container text-[10px] font-bold text-on-primary-container">
                      +{shift.assignedExtra}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mb-2 mt-4 h-4 overflow-hidden rounded-full bg-surface-container">
                <div className="absolute h-full rounded-full bg-primary-container" style={timeBandStyle(shift.startHour, shift.endHour)} />
                {shift.breakStartHour !== undefined && (
                  <div
                    className="absolute h-full bg-error-container"
                    style={{ left: `${(shift.breakStartHour / 24) * 100}%`, width: `${((shift.breakMinutes ?? 30) / 60 / 24) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs font-medium text-on-surface-variant">
                <span>{shift.startLabel}</span>
                <span>{shift.endLabel}</span>
              </div>
            </div>
          ))}

          <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_2px_8px_rgba(11,42,69,.06)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-surface-container-low text-[10px] font-semibold uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3">Shift Name</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3 text-center">Break (mins)</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3 text-center">Assigned</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {SHIFTS.map((s) => (
                    <tr key={s.id} className="border-t border-surface-container transition-colors hover:bg-surface-bright">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">{s.startLabel}</td>
                      <td className="px-4 py-3">{s.endLabel}</td>
                      <td className="px-4 py-3 text-center">{s.breakMins}</td>
                      <td className="px-4 py-3 text-outline">{s.days}</td>
                      <td className="px-4 py-3 text-center font-semibold">{s.totalAssigned}</td>
                      <td className="px-4 py-3">
                        <span className={s.status === "Active" ? "font-medium text-tertiary" : "font-medium text-outline"}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-[88px] rounded-2xl bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface">Coverage by Shift</h3>
              <button className="rounded p-1 text-primary transition-colors hover:bg-primary-container/10">
                <Icon name="more_vert" />
              </button>
            </div>

            <div className="relative mx-auto mb-6 size-48">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle className="opacity-30" cx="50" cy="50" fill="transparent" r="40" stroke="var(--color-on-secondary-fixed-variant, #2e4965)" strokeWidth="16" />
                <circle cx="50" cy="50" fill="transparent" r="40" stroke="var(--color-secondary, #46607e)" strokeDasharray="251.2" strokeDashoffset="113" strokeWidth="16" />
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="var(--color-primary-container, #1c6eb4)"
                  strokeDasharray="251.2"
                  strokeDashoffset="138"
                  strokeWidth="16"
                  style={{ transform: "rotate(126deg)", transformOrigin: "center" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-on-surface">90</span>
                <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Staff</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {COVERAGE.map((c) => (
                <div key={c.label} className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-full ${c.color}`} />
                    <span className="text-sm font-medium">{c.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{c.count}</span>
                    <span className="w-8 text-right text-xs text-on-surface-variant">{c.pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-surface-container pt-4">
              <button className="flex w-full items-center justify-center gap-1 rounded py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container-low">
                <Icon name="download" className="text-[18px]" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}