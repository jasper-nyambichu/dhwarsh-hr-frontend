//src/app/%28portal%29/hr/dashboard/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart, ProgressRows } from "@/components/shared/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatNumber, initials } from "@/lib/format";

/**
 * HR Manager dashboard.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER. Every constant below is shaped like the response it
 * will come from, but there is no `/dashboard/hr` endpoint on the Spring side
 * yet. When it lands, replace the constants with one
 * `await api.get<HrDashboard>("/dashboard/hr")` — every component here takes
 * props, so nothing else in this file changes.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Stitch shipped two takes on this screen. The layout, spotlight, hires table
 * and donut follow the later one; the KPI row follows the earlier one, whose
 * tiles (pending leave, probation, documents) are HR's own work queue. The
 * later take's tiles were headcount/new hires/exits — already the admin
 * dashboard's top row, and not something HR acts on from here. To swap back,
 * replace the three MetricCards; nothing else depends on them.
 */

const QUEUE = {
  pendingLeave: 18,
  probationEnding: 9,
  documentsExpiring: 14,
} as const;

/** Daily attendance rate, whole percent, oldest first. */
const ATTENDANCE_TREND: readonly BarDatum[] = [
  { label: "Mon", value: 88, tooltip: "88% present" },
  { label: "Tue", value: 92, tooltip: "92% present" },
  { label: "Wed", value: 90, tooltip: "90% present" },
  { label: "Thu", value: 95, tooltip: "95% present" },
  { label: "Fri", value: 93, tooltip: "93% present" },
  { label: "Sat", value: 71, tooltip: "71% present" },
  { label: "Sun", value: 64, tooltip: "64% present" },
];

/** Share of each queue already actioned, whole percent. */
const THROUGHPUT = [
  { label: "Leave Requests", value: 75, color: "var(--color-tertiary)" },
  { label: "Loan Applications", value: 40, color: "var(--color-secondary)" },
] as const;

const EMPLOYMENT_TYPE = [
  { label: "Full-time", value: 850, color: "var(--color-blue)" },
  { label: "Contract", value: 320, color: "var(--color-amber-main)" },
  { label: "Probation", value: 78, color: "var(--color-green-main)" },
] as const;

const RECENT_HIRES = [
  {
    id: 1,
    name: "Kariuki John",
    role: "Software Engineer",
    department: "IT",
    startDate: "2026-07-27",
    status: "ACTIVE" as const,
  },
  {
    id: 2,
    name: "Sarah Omondi",
    role: "HR Business Partner",
    department: "Human Resources",
    startDate: "2026-08-03",
    status: "ONBOARDING" as const,
  },
  {
    id: 3,
    name: "Emmanuel Kiprono",
    role: "Data Analyst",
    department: "Finance",
    startDate: "2026-08-05",
    status: "ONBOARDING" as const,
  },
];

const STATUS_CHIP: Record<(typeof RECENT_HIRES)[number]["status"], string> = {
  ACTIVE: "bg-tertiary/10 text-tertiary",
  ONBOARDING: "bg-amber-main/10 text-amber-main",
};

export default async function HrDashboardPage() {
  await requirePermission("employee:read");

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard
            label="Pending Leave"
            value={formatNumber(QUEUE.pendingLeave)}
            icon="beach_access"
            tone="primary"
            hint="Awaiting HR approval"
          />
          <MetricCard
            label="Probation Ending"
            value={formatNumber(QUEUE.probationEnding)}
            icon="timer"
            tone="error"
            accent
            hint="Within 30 days"
          />
          <MetricCard
            label="Docs Expiring"
            value={formatNumber(QUEUE.documentsExpiring)}
            icon="description"
            tone="tertiary"
            accent
            hint="Contracts and permits"
          />
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <BentoCard
            title="Attendance Trend"
            subtitle="Last 7 days"
            action={
              <Link
                href="/hr/attendance"
                className="text-[10px] text-primary-container hover:underline"
              >
                View All
              </Link>
            }
            className="flex min-h-64 flex-col"
            bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2"
          >
            <BarChart
              data={ATTENDANCE_TREND}
              max={100}
              axisLabels={["100", "66", "33", "0"]}
              tone="primary"
            />
          </BentoCard>

          <BentoCard
            title="Leave & Loans"
            subtitle="Actioned this month"
            action={
              <Link
                href="/hr/leave"
                className="text-[10px] text-primary-container hover:underline"
              >
                Details
              </Link>
            }
            className="flex min-h-64 flex-col"
            bodyClassName="flex flex-1 flex-col"
          >
            <ProgressRows rows={THROUGHPUT} className="flex-1" />
          </BentoCard>
        </div>

        <BentoCard
          title="Recent Hires"
          action={
            <Link
              href="/hr/employees"
              className="rounded px-3 py-1.5 text-[10px] font-semibold text-primary-container transition-colors hover:bg-blue-soft"
            >
              View Directory
            </Link>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                    Employee
                  </th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                    Role
                  </th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                    Department
                  </th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                    Start Date
                  </th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="font-body-md text-body-md">
                {RECENT_HIRES.map((hire) => (
                  <tr key={hire.id} className="group transition-colors">
                    <td className="py-3 pl-2">
                      <Link
                        href={`/hr/employees/${hire.id}`}
                        className="flex items-center gap-3"
                      >
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-[10px] font-bold text-primary-container"
                        >
                          {initials(hire.name)}
                        </span>
                        <span className="font-medium text-on-surface group-hover:text-primary-container">
                          {hire.name}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">{hire.role}</td>
                    <td className="py-3 text-on-surface-variant">
                      {hire.department}
                    </td>
                    <td className="py-3 text-on-surface-variant">
                      {formatDate(hire.startDate)}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[hire.status]}`}
                      >
                        {hire.status === "ACTIVE" ? "Active" : "Onboarding"}
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
        <AlertSpotlight
          eyebrow="Payroll Alert"
          title="August run closes in 3 days"
          message="Approve outstanding overtime and leave before the cutoff — anything still pending is excluded from the run."
          cta="Review Pending Approvals"
          href="/hr/leave"
        />

        <BentoCard
          title="Employment Type"
          action={
            <Icon name="more_vert" className="text-sm text-on-surface-variant" />
          }
          className="flex flex-1 flex-col"
          bodyClassName="flex flex-1 flex-col justify-center"
        >
          <DonutChart
            segments={EMPLOYMENT_TYPE}
            size={160}
            legend="value"
            centerLabel="Total"
          />
        </BentoCard>
      </div>
    </div>
  );
}
