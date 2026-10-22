import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { RequestList } from "@/components/features/staff/request-list";
import { LiveAttendanceBoard } from "@/components/features/attendance/live-attendance-board";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getAttendanceActivity, getAttendanceSummary } from "@/lib/api/attendance";
import { getMyBranch } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { getPendingManagerApprovals } from "@/lib/api/leave";
import { getMyStaffRequests } from "@/lib/api/staff";
import { formatDate, formatNumber } from "@/lib/format";

/**
 * Branch Manager dashboard — today's attendance for their own branch (the backend scopes it), the
 * size of the team, leave waiting on them, and the employees they have submitted for approval.
 * The leave and request figures are optional: if one fails, the rest of the page still loads.
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

  const [teamResult, leaveResult, requestsResult] = await Promise.allSettled([
    getEmployeesByBranch(core.branch.id),
    getPendingManagerApprovals(),
    getMyStaffRequests(),
  ]);
  const team = teamResult.status === "fulfilled" ? teamResult.value : [];
  const leave = leaveResult.status === "fulfilled" ? leaveResult.value : [];
  const requests = requestsResult.status === "fulfilled" ? requestsResult.value : [];

  const activeTeam = team.filter((person) => person.employmentStatus === "ACTIVE").length;
  const pendingRequests = requests.filter((request) => request.status === "PENDING").length;

  return (
    <>
      <PageHeader title={core.branch.name} description="Your branch today." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <MetricCard label="Team" value={formatNumber(activeTeam)} icon="group" tone="primary" hint="Active employees" />
        <MetricCard label="On Site Now" value={formatNumber(core.summary.currentlyIn)} icon="login" tone="primary" />
        <MetricCard label="Leave To Decide" value={formatNumber(leave.length)} icon="event_available" tone={leave.length > 0 ? "error" : "primary"} />
        <MetricCard label="Awaiting Admin" value={formatNumber(pendingRequests)} icon="pending_actions" tone="primary" hint="Employees you submitted" />
      </div>

      <div className="mt-gutter">
        <LiveAttendanceBoard
          initialSnapshot={{ summary: core.summary, activity: core.activity, fetchedAt: core.summary.generatedAt }}
          recordsHref="/branch/attendance"
        />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <BentoCard
          title="Leave Awaiting You"
          action={<Link href="/branch/approvals" className="text-[10px] font-semibold text-primary hover:underline">Open</Link>}
        >
          {leave.length === 0 ? (
            <p className="py-2 text-sm text-on-surface-variant">Nothing is waiting for your decision.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant/20">
              {leave.slice(0, 5).map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm font-medium text-on-surface">{request.employeeName ?? `Employee #${request.employeeId}`}</span>
                  <span className="text-xs text-on-surface-variant">{request.leaveTypeName ?? "Leave"} · {formatDate(request.startDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        <BentoCard
          title="My Employee Requests"
          action={<Link href="/branch/requests" className="text-[10px] font-semibold text-primary hover:underline">Open</Link>}
        >
          <RequestList requests={requests.slice(0, 4)} />
        </BentoCard>
      </div>
    </>
  );
}