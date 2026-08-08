import Link from "next/link";

import { requireAnyPermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { ApprovalList, type ApprovalItem } from "@/components/shared/approval-list";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart, StackedBar } from "@/components/shared/charts";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { StatCard } from "@/components/shared/stat-card";
import { Icon } from "@/components/ui/icon";
import { formatMoneyCompact, formatNumber, formatPercent } from "@/lib/format";

/**
 * Admin dashboard. Serves SUPER_ADMIN and ADMIN — both own /admin.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER. Every constant below is shaped like the response it
 * will come from, but there is no `/dashboard/admin` endpoint on the Spring
 * side yet. When it lands, replace the constants with one
 * `await api.get<AdminDashboard>("/dashboard/admin")` — every component here
 * takes props, so nothing else in this file changes.
 * ─────────────────────────────────────────────────────────────────────────
 */

const SUMMARY = {
  totalEmployees: 1248,
  activeBranches: 9,
  labourAgents: 14,
} as const;

const HEADCOUNT: readonly BarDatum[] = [
  { label: "Jan", value: 940 },
  { label: "Feb", value: 986 },
  { label: "Mar", value: 1024 },
  { label: "Apr", value: 1108 },
  { label: "May", value: 1248, highlight: true, tooltip: "+8.2% (1,248)" },
  { label: "Jun", value: 1170 },
  { label: "Jul", value: 1205 },
];

/** Whole percent, matching formatPercent's contract. */
const HEADCOUNT_TREND = 8.2;

const PAYROLL = {
  totalDisbursed: 18_400_000,
  processed: 412,
  pending: 190,
  onHold: 96,
} as const;

const ATTENDANCE_TODAY = {
  present: 1102,
  late: 84,
  absent: 62,
} as const;

const WORKFORCE = [
  { label: "Full-Time", value: 65, color: "var(--color-blue)" },
  { label: "Casuals", value: 20, color: "var(--color-green-main)" },
  { label: "Contract", value: 15, color: "var(--color-amber-main)" },
] as const;

const BRANCH_PERFORMANCE = [
  { id: 1, name: "Nairobi CBD", manager: "Peter Njuguna", employees: 320, attendance: 94, payroll: 4_200_000 },
  { id: 2, name: "Mombasa Port", manager: "Ali Hassan", employees: 215, attendance: 88, payroll: 3_100_000 },
  { id: 3, name: "Kisumu Industrial", manager: "Jane Otieno", employees: 180, attendance: 76, payroll: 2_400_000 },
  { id: 4, name: "Nakuru Branch", manager: "David Kimani", employees: 142, attendance: 91, payroll: 1_800_000 },
] as const;

const APPROVALS: readonly ApprovalItem[] = [
  {
    id: 1,
    requester: "Sarah Muteti",
    summary: "Requested 12 hrs OT for Mombasa branch",
    type: "Overtime",
    tone: "overtime",
    href: "/admin/branches/2",
  },
  {
    id: 2,
    requester: "John Ochieng",
    summary: "Annual leave request (5 days)",
    type: "Leave",
    tone: "leave",
    href: "/admin/dashboard",
  },
  {
    id: 3,
    requester: "Eunice Wanjiku",
    summary: "Travel reimbursement KES 4,500",
    type: "Expense",
    tone: "expense",
    href: "/admin/dashboard",
  },
];

/** Below this, an attendance rate reads as a problem rather than a number. */
const ATTENDANCE_WARNING_THRESHOLD = 85;

export default async function AdminDashboardPage() {
  // ADMIN and SUPER_ADMIN both hold these; anyone else is bounced to their own
  // namespace before a single figure renders.
  await requireAnyPermission(["company:read", "branch:read"]);

  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
      {/* ───────────────────────────────── left column ─────────────────── */}
      <div className="flex flex-col gap-gutter md:col-span-8">
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-3">
          <StatCard
            label="Total Employees"
            value={formatNumber(SUMMARY.totalEmployees)}
            icon="group"
            badgeIcon="badge"
          />
          <StatCard
            label="Active Branches"
            value={formatNumber(SUMMARY.activeBranches)}
            icon="corporate_fare"
            badgeIcon="storefront"
          />
          <StatCard
            label="Labour Agents"
            value={formatNumber(SUMMARY.labourAgents)}
            icon="engineering"
            badgeIcon="handshake"
          />
        </div>

        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
          <BentoCard
            title="Headcount Growth"
            action={
              <span className="rounded bg-tertiary-container/10 px-2 py-1 text-[10px] text-tertiary-container">
                +{formatPercent(HEADCOUNT_TREND, 1)}
              </span>
            }
            className="flex h-64 flex-col"
            bodyClassName="flex flex-1 flex-col"
          >
            <BarChart
              data={HEADCOUNT}
              max={1500}
              axisLabels={["1500", "1000", "500", "0"]}
            />
          </BentoCard>

          <BentoCard
            title="Payroll Status"
            subtitle="This month"
            action={
              <Link
                href="/admin/dashboard"
                className="flex items-center text-[10px] text-primary-container hover:underline"
              >
                View Details
                <Icon name="arrow_forward" className="ml-1 text-sm" />
              </Link>
            }
            className="flex h-64 flex-col"
            bodyClassName="flex flex-1 flex-col justify-between"
          >
            <div className="flex flex-col items-center">
              <p className="font-card-stat text-card-stat tabular-nums text-on-surface">
                {formatMoneyCompact(PAYROLL.totalDisbursed)}
              </p>
              <p className="text-[10px] text-outline">Total Disbursed</p>
            </div>

            <StackedBar
              segments={[
                { label: "Processed", value: PAYROLL.processed, color: "var(--color-blue)" },
                { label: "Pending", value: PAYROLL.pending, color: "var(--color-amber-main)" },
                { label: "On Hold", value: PAYROLL.onHold, color: "var(--color-chart-track)" },
              ]}
            />
          </BentoCard>
        </div>

        <BentoCard
          title="Branch Performance"
          action={
            <Link
              href="/admin/branches"
              className="flex items-center gap-2 rounded border border-outline-variant/40 px-3 py-1.5 text-[10px] text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <Icon name="filter_list" className="text-sm" />
              Filter
            </Link>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                    Branch
                  </th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                    Manager
                  </th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                    Employees
                  </th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                    Attendance&nbsp;%
                  </th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                    Payroll KES
                  </th>
                </tr>
              </thead>

              <tbody className="font-body-md text-body-md">
                {BRANCH_PERFORMANCE.map((branch) => {
                  const healthy = branch.attendance >= ATTENDANCE_WARNING_THRESHOLD;

                  return (
                    <tr key={branch.id} className="group transition-colors">
                      <td className="py-3 pl-2">
                        <Link
                          href={`/admin/branches/${branch.id}`}
                          className="flex items-center gap-2"
                        >
                          <span className="flex size-6 items-center justify-center rounded bg-primary-container/10 text-primary-container">
                            <Icon name="location_city" className="text-sm" />
                          </span>
                          <span className="font-medium text-on-surface group-hover:text-primary-container">
                            {branch.name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 text-on-surface-variant">{branch.manager}</td>
                      <td className="py-3 tabular-nums text-on-surface-variant">
                        {formatNumber(branch.employees)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              healthy
                                ? "font-medium text-tertiary-container"
                                : "font-medium text-amber-main"
                            }
                          >
                            {formatPercent(branch.attendance)}
                          </span>
                          <span className="hidden h-1 w-12 overflow-hidden rounded-full bg-surface-container sm:block">
                            <span
                              className="block h-full"
                              style={{
                                width: `${branch.attendance}%`,
                                backgroundColor: healthy
                                  ? "var(--color-green-main)"
                                  : "var(--color-amber-main)",
                              }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-right font-medium tabular-nums text-on-surface">
                        {formatMoneyCompact(branch.payroll, { showCurrency: false })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* ──────────────────────────────── right column ─────────────────── */}
      <div className="flex flex-col gap-gutter md:col-span-4">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-[11px] text-on-surface shadow-sm transition-colors hover:bg-surface-container"
          >
            This Month
            <Icon name="expand_more" className="text-sm" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-[11px] font-medium text-on-primary shadow-sm transition-colors hover:bg-navy/90"
          >
            <Icon name="download" className="text-sm" />
            Download
          </button>
        </div>

        <SegmentStrip
          segments={[
            { label: "Present", value: formatNumber(ATTENDANCE_TODAY.present) },
            { label: "Late", value: formatNumber(ATTENDANCE_TODAY.late), tone: "warning" },
            { label: "Absent", value: formatNumber(ATTENDANCE_TODAY.absent), tone: "error" },
          ]}
        />

        <AlertSpotlight
          message="2 branches haven't synced biometrics today."
          href="/admin/devices"
        />

        <BentoCard
          title="Awaiting Approval"
          action={
            <Link
              href="/admin/dashboard"
              className="text-[10px] text-primary-container hover:underline"
            >
              View All
            </Link>
          }
          className="flex-1"
        >
          <ApprovalList items={APPROVALS} />
        </BentoCard>

        <BentoCard title="Workforce Split">
          <DonutChart segments={WORKFORCE} />
        </BentoCard>
      </div>
    </div>
  );
}
