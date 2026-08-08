import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { formatNumber, initials } from "@/lib/format";

/**
 * Branch Manager dashboard, scoped to the caller's own branch.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/dashboard/branch` endpoint yet. Replace with
 * `await api.get<BranchDashboard>("/dashboard/branch")` when it lands —
 * that response should already be scoped server-side via AccessGuard.
 * ─────────────────────────────────────────────────────────────────────────
 */

const KPI = {
  teamSize: 142,
  presentToday: 128,
  pendingApprovals: 5,
} as const;

/** Attendance count Mon–Sat, whole numbers, oldest first. */
const ATTENDANCE_WEEK: readonly BarDatum[] = [
  { label: "Mon", value: 119, tooltip: "119 present" },
  { label: "Tue", value: 129, tooltip: "129 present" },
  { label: "Wed", value: 123, tooltip: "123 present" },
  { label: "Thu", value: 128, tooltip: "128 present (today)" },
  { label: "Fri", value: 112, tooltip: "112 present" },
  { label: "Sat", value: 56, tooltip: "56 present" },
];

const SHIFT_COVERAGE = [
  { label: "Morning", count: 70, pct: 49, color: "bg-primary-container" },
  { label: "Afternoon", count: 45, pct: 32, color: "bg-secondary" },
  { label: "Night", count: 27, pct: 19, color: "bg-tertiary" },
] as const;

const TEAM_ATTENDANCE_TODAY = [
  { id: 1, name: "Grace Wambui", code: "NCBD-0142", shift: "Morning", clockIn: "06:55 AM", clockOut: null, hours: "4.5h", status: "On Time" as const },
  { id: 2, name: "Peter Njuguna", code: "NCBD-0089", shift: "Morning", clockIn: "07:15 AM", clockOut: null, hours: "4.2h", status: "Late" as const },
  { id: 3, name: "Sarah Omondi", code: "NCBD-0211", shift: "Morning", clockIn: "06:48 AM", clockOut: null, hours: "4.7h", status: "On Time" as const },
  { id: 4, name: "David Kiprono", code: "NCBD-0045", shift: "Afternoon", clockIn: "1:50 PM", clockOut: null, hours: "—", status: "Upcoming" as const },
  { id: 5, name: "Mary Mutua", code: "NCBD-0178", shift: "Night", clockIn: "9:55 PM", clockOut: "6:05 AM", hours: "8.2h", status: "Completed" as const },
];

const ATTENDANCE_CHIP: Record<(typeof TEAM_ATTENDANCE_TODAY)[number]["status"], string> = {
  "On Time": "bg-tertiary-container/10 text-tertiary-container",
  Late: "bg-amber-main/10 text-amber-main",
  Upcoming: "bg-surface-container-high text-on-surface-variant",
  Completed: "bg-surface-container-high text-on-surface-variant",
};

const ON_LEAVE_TODAY = [
  { id: 1, name: "Alice Odhiambo", type: "Annual Leave", typeLetter: "A", typeColor: "bg-primary-container", returns: "15 Aug" },
  { id: 2, name: "Brian Korir", type: "Sick Leave", typeLetter: "S", typeColor: "bg-error", returns: "12 Aug" },
  { id: 3, name: "Esther Juma", type: "Exam Prep", typeLetter: "E", typeColor: "bg-amber-main", returns: "14 Aug" },
  { id: 4, name: "Michael Njoroge", type: "Annual Leave", typeLetter: "A", typeColor: "bg-primary-container", returns: "20 Aug" },
] as const;

const DEPARTMENT_SPLIT = [
  { label: "Sales", value: 57, color: "var(--color-primary-fixed)" },
  { label: "Operations", value: 50, color: "var(--color-primary-container)" },
  { label: "Logistics", value: 21, color: "var(--color-green-main)" },
  { label: "Admin", value: 14, color: "var(--color-amber-main)" },
] as const;

export default async function BranchDashboardPage() {
  await requirePermission("attendance:read");

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard
            label="Team Size"
            value={formatNumber(KPI.teamSize)}
            icon="groups"
            tone="primary"
            hint="+2 since last month"
          />
          <MetricCard
            label="Present Today"
            value={formatNumber(KPI.presentToday)}
            icon="how_to_reg"
            tone="tertiary"
            hint="90% attendance rate"
          />
          <MetricCard
            label="Pending Approvals"
            value={formatNumber(KPI.pendingApprovals)}
            icon="pending_actions"
            tone="tertiary"
            accent
            hint="Action required"
          />
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <BentoCard
            title="Attendance This Week"
            action={
              <Link href="/branch/attendance" className="text-[10px] text-primary-container hover:underline">
                View Details
              </Link>
            }
            className="flex h-64 flex-col"
            bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2"
          >
            <BarChart data={ATTENDANCE_WEEK} max={140} axisLabels={["140", "70", "0"]} tone="primary" />
          </BentoCard>

          <BentoCard title="Shift Coverage" className="flex h-64 flex-col" bodyClassName="flex flex-1 flex-col justify-center">
            <div className="mb-6 flex h-3 w-full overflow-hidden rounded-full shadow-inner">
              {SHIFT_COVERAGE.map((s) => (
                <div key={s.label} className={s.color} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.count}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SHIFT_COVERAGE.map((s) => (
                <div key={s.label} className="rounded-lg bg-surface-container-low p-2">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${s.color}`} />
                    <span className="text-[10px] font-medium text-on-surface-variant">{s.label}</span>
                  </span>
                  <span className="mt-1 block pl-3.5 text-body-md font-bold text-on-surface">{s.count}</span>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        <BentoCard
          title="Team Attendance Today"
          action={
            <Link href="/branch/attendance" className="text-[10px] text-primary-container hover:underline">
              View All
            </Link>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Shift</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Clock In</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Clock Out</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Hours</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {TEAM_ATTENDANCE_TODAY.map((row) => (
                  <tr key={row.id} className="group transition-colors">
                    <td className="py-3 pl-2">
                      <Link href={`/branch/team/${row.id}`} className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container"
                        >
                          {initials(row.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-on-surface group-hover:text-primary-container">
                            {row.name}
                          </span>
                          <span className="block text-[10px] text-outline">{row.code}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">{row.shift}</td>
                    <td className="py-3 font-medium text-on-surface">{row.clockIn}</td>
                    <td className="py-3 text-outline">{row.clockOut ?? "—:—"}</td>
                    <td className="py-3 text-on-surface-variant">{row.hours}</td>
                    <td className="py-3 pr-2 text-right">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${ATTENDANCE_CHIP[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* ──────────────────────────────── side column ──────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-4">
        <SegmentStrip
          segments={[
            { label: "Present", value: formatNumber(128) },
            { label: "Late", value: formatNumber(9), tone: "warning" },
            { label: "Absent", value: formatNumber(5), tone: "warning" },
          ]}
        />

        <AlertSpotlight
          eyebrow="Action Needed"
          title="3 leave requests are waiting on you"
          message="Review before the payroll cutoff."
          cta="Review Approvals"
          href="/branch/approvals"
        />

        <BentoCard title="On Leave Today" action={<span className="text-[10px] text-on-surface-variant">4 Away</span>}>
          <ul className="flex flex-col gap-4">
            {ON_LEAVE_TODAY.map((person) => (
              <li key={person.id} className="flex items-center gap-3">
                <span className="relative shrink-0">
                  <span
                    aria-hidden
                    className="flex size-10 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container"
                  >
                    {initials(person.name)}
                  </span>
                  <span
                    className={`absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-surface-container-lowest text-[8px] font-bold text-on-primary ${person.typeColor}`}
                  >
                    {person.typeLetter}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body-md text-[13px] font-medium text-on-surface">
                    {person.name}
                  </span>
                  <span className="block truncate text-[11px] text-on-surface-variant">{person.type}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[10px] font-semibold uppercase text-outline">Returns</span>
                  <span className="block text-[12px] font-medium text-on-surface">{person.returns}</span>
                </span>
              </li>
            ))}
          </ul>
        </BentoCard>

        <BentoCard title="Department Split">
          <DonutChart segments={DEPARTMENT_SPLIT} size={160} legend="value" centerLabel="Total" />
        </BentoCard>
      </div>
    </div>
  );
}