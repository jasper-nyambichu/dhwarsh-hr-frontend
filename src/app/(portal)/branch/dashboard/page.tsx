import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { RequestList } from "@/components/features/staff/request-list";
import { LiveAttendanceBoard } from "@/components/features/attendance/live-attendance-board";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getAttendanceActivity, getAttendanceSummary } from "@/lib/api/attendance";
import { getMyBranch } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { getMyBranchOffDays } from "@/lib/api/off-day";
import { getMyStaffRequests } from "@/lib/api/staff";
import { formatDateRange, formatNumber } from "@/lib/format";
import { groupByEmployee, monthLabel, monthRange, parseMonth } from "@/lib/off-days";

const CARD_LINK =
  "flex rounded-card transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/**
 * Branch Manager dashboard — today's attendance for their own branch (the backend scopes it), their
 * employees, this month's off list, and the employees waiting on an Admin. Each card opens its page.
 * Those last figures are optional: if one fails, the rest of the page still loads.
 */
export default async function BranchDashboardPage() {
  await requirePermission("attendance:read:branch");

  let core: {
    branch: Awaited<ReturnType<typeof getMyBranch>>;
    summary: Awaited<ReturnType<typeof getAttendanceSummary>>;
    activity: Awaited<ReturnType<typeof getAttendanceActivity>>;
  };
  try {
    const [branch, summary, activity] = await Promise.all([getMyBranch(), getAttendanceSummary({}), getAttendanceActivity({})]);
    core = { branch, summary, activity };
  } catch (error) {
    return (
      <DataUnavailable
        title="Dashboard"
        subject="Your branch dashboard"
        reason={error instanceof ApiError ? error.message : "Your account may not be assigned to a branch yet — ask an Admin."}
      />
    );
  }

  const month = parseMonth(undefined);
  const [employeesResult, offDaysResult, requestsResult] = await Promise.allSettled([
    getEmployeesByBranch(core.branch.id),
    getMyBranchOffDays(monthRange(month)),
    getMyStaffRequests(),
  ]);
  const employees = employeesResult.status === "fulfilled" ? employeesResult.value : [];
  const offList = offDaysResult.status === "fulfilled" ? groupByEmployee(offDaysResult.value, month) : null;
  const requests = requestsResult.status === "fulfilled" ? requestsResult.value : [];

  const activeEmployees = employees.filter((person) => person.employmentStatus === "ACTIVE").length;
  const pendingRequests = requests.filter((request) => request.status === "PENDING").length;

  return (
    <>
      <PageHeader title={core.branch.name} description="Your branch today." />

      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/branch/employees" className={CARD_LINK}>
          <MetricCard className="w-full" label="Employees" value={formatNumber(activeEmployees)} icon="group" tone="primary" hint="Active employees" />
        </Link>
        <Link href="/branch/attendance" className={CARD_LINK}>
          <MetricCard className="w-full" label="Attendance" value={formatNumber(core.summary.currentlyIn)} icon="schedule" tone="primary" hint="On site now" />
        </Link>
        <Link href="/branch/off-days" className={CARD_LINK}>
          <MetricCard className="w-full" label="Off List This Month" value={offList === null ? "—" : formatNumber(offList.length)} icon="event_busy" tone="primary" hint="Employees with days off" />
        </Link>
        <Link href="/branch/approvals" className={CARD_LINK}>
          <MetricCard className="w-full" label="Awaiting Admin" value={formatNumber(pendingRequests)} icon="pending_actions" tone="primary" hint="Employees you added" />
        </Link>
      </div>

      <div className="mt-gutter">
        <LiveAttendanceBoard
          initialSnapshot={{ summary: core.summary, activity: core.activity, fetchedAt: core.summary.generatedAt }}
          recordsHref="/branch/attendance"
        />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <BentoCard
          title="Off List This Month"
          subtitle={monthLabel(month)}
          action={<Link href="/branch/off-days" className="text-[10px] font-semibold text-primary hover:underline">Open</Link>}
        >
          {offList === null ? (
            <p className="py-2 text-sm text-on-surface-variant">The off list could not be read.</p>
          ) : offList.length === 0 ? (
            <EmptyState symbol="event_available" title="Nobody is off this month" description="Days an agent gives your employees off appear here." />
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant/20">
              {offList.slice(0, 6).map((group) => (
                <li key={group.employeeId} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium text-on-surface">{group.employeeName}</span>
                    <span className="block text-xs text-on-surface-variant">
                      {group.offDays.map((offDay) => formatDateRange(offDay.startDate, offDay.endDate)).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-on-surface">
                    {group.totalDays} day{group.totalDays === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        <BentoCard
          title="Approvals"
          action={<Link href="/branch/approvals" className="text-[10px] font-semibold text-primary hover:underline">Open</Link>}
        >
          <RequestList requests={requests.slice(0, 4)} />
        </BentoCard>
      </div>
    </>
  );
}
