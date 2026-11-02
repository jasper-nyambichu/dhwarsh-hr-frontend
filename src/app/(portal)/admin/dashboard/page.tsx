import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requireAnyPermission } from "@/app/lib/dal";
import { QuickAccessGroups, type QuickAccessItem } from "@/components/features/dashboard/quick-access";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { StatCard } from "@/components/shared/stat-card";
import { Icon } from "@/components/ui/icon";
import { format } from "date-fns";
import { navigationFor } from "@/config/navigation";
import { getAgents } from "@/lib/api/agent";
import { getAdvances, getLoans, getPaymentRequests } from "@/lib/api/agent-money";
import { getAttendanceDevices, getAttendanceSummary } from "@/lib/api/attendance";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { getEmployeeRequests } from "@/lib/api/employee-request";
import { getOffDays } from "@/lib/api/off-day";
import { formatNumber, formatPercent } from "@/lib/format";
import type { AttendanceDeviceItem, BranchResponse } from "@/types";

/**
 * Admin dashboard. Serves SUPER_ADMIN and ADMIN — both own /admin.
 *
 * Everything here is a real read: branch directory, the attendance summary for
 * today, the agent list, the terminal fleet, a per-branch employee count, and
 * everything waiting on an administrator's decision.
 *
 * Laid out top to bottom by how urgent it is: anything needing attention, the
 * headline cards (awaiting approval, clocked in, employees, branches, off days),
 * then a card for every place on the sidebar under a heading, then branch
 * performance beside today's attendance. The cards come from the navigation
 * itself, so a new sidebar item appears here without a second list.
 *
 * Three widgets the placeholder carried are not here, because nothing in the
 * schema or the API can answer them:
 *
 *   · **Headcount Growth** — a seven-month series. Nothing records headcount
 *     over time; `employees` holds only the current row, so a trend line would
 *     have to be invented wholesale.
 *   · **Awaiting Approval** — the approval queues are scoped per role
 *     (`/leave/pending/manager` and friends); there is no company-wide pending
 *     queue to render for an administrator.
 *   · **Workforce Split** — employment type is no longer collected.
 *
 * Each returns with the aggregate endpoint that supplies it. Until then an
 * empty slot is honest and a fabricated one is not — the figures above were
 * realistic enough to be believed, which is exactly what made them dangerous on
 * a screen an administrator uses to decide things.
 */

/** A terminal that has not synced in this long reads as not reporting. */
const DEVICE_STALE_MINUTES = 60;

/** Which heading each sidebar item sits under. Anything not listed goes under "More". */
const QUICK_ACCESS_GROUPS: readonly { title: string; hrefs: readonly string[] }[] = [
  { title: "People", hrefs: ["/admin/employees/new", "/admin/employees", "/admin/employee-requests", "/admin/off-days", "/admin/attendance", "/admin/days-worked"] },
  { title: "Money", hrefs: ["/admin/money-requests", "/admin/pay-settings", "/admin/payslips"] },
  { title: "Organisation", hrefs: ["/admin/branches", "/admin/departments", "/admin/agents"] },
  { title: "System", hrefs: ["/admin/users", "/admin/devices", "/admin/audit", "/admin/settings"] },
];

const CARD_LINK =
  "flex rounded-card transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

function isDeviceStale(device: AttendanceDeviceItem): boolean {
  if (device.status !== "ACTIVE") return false;
  if (!device.lastSyncAt) return true;

  const ageMs = Date.now() - new Date(device.lastSyncAt).getTime();
  return ageMs > DEVICE_STALE_MINUTES * 60_000;
}

export default async function AdminDashboardPage() {
  // ADMIN and SUPER_ADMIN both hold these; anyone else is bounced to their own
  // namespace before a single figure renders.
  const session = await requireAnyPermission(["company:read", "branch:read"]);

  let branches: BranchResponse[];

  try {
    branches = await getBranches();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Admin Dashboard"
        description="Company-wide overview across branches, staff and attendance."
        subject="The dashboard"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  // Secondary reads are independent of each other and of the branch directory.
  // `allSettled` throughout: one unavailable panel must not blank the page, and
  // an empty slot is a truthful rendering of "could not read this".
  const today = format(new Date(), "yyyy-MM-dd");
  const [summaryResult, agentsResult, devicesResult, employeeRequestsResult, paymentsResult, advancesResult, loansResult, offDaysResult] = await Promise.allSettled([
    getAttendanceSummary(),
    getAgents(),
    getAttendanceDevices(),
    getEmployeeRequests("PENDING"),
    getPaymentRequests(),
    getAdvances(),
    getLoans("PENDING"),
    getOffDays({ from: today, to: today }),
  ]);

  const countResults = await Promise.allSettled(
    branches.map((branch) => getEmployeesByBranch(branch.id)),
  );

  const summary =
    summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const agents =
    agentsResult.status === "fulfilled" ? agentsResult.value : null;
  const devices =
    devicesResult.status === "fulfilled" ? devicesResult.value : null;

  const count = <T,>(result: PromiseSettledResult<T[]>, keep: (row: T) => boolean = () => true): number | null =>
    result.status === "fulfilled" ? result.value.filter(keep).length : null;

  const pendingEmployees = count(employeeRequestsResult);
  const pendingPayments = count(paymentsResult, (request) => request.status === "PENDING");
  const toRelease = count(paymentsResult, (request) => request.status === "APPROVED");
  const pendingAdvances = count(advancesResult, (advance) => advance.status === "PENDING");
  const pendingLoans = count(loansResult);
  const offToday = offDaysResult.status === "fulfilled" ? new Set(offDaysResult.value.map((offDay) => offDay.employeeId)).size : null;
  const pendingMoney = (pendingPayments ?? 0) + (pendingAdvances ?? 0) + (pendingLoans ?? 0);

  // A queue that could not be read must not read as "nothing waiting".
  const unreadQueue = [pendingEmployees, pendingPayments, pendingAdvances, pendingLoans].some((value) => value === null);
  const awaitingTotal = (pendingEmployees ?? 0) + pendingMoney;

  const headcount = new Map<number, number | null>(
    branches.map((branch, index) => {
      const result = countResults[index];
      return [
        branch.id,
        result && result.status === "fulfilled" ? result.value.length : null,
      ];
    }),
  );

  const totalEmployees = [...headcount.values()]
    .filter((value): value is number => value !== null)
    .reduce((sum, value) => sum + value, 0);

  const activeBranches = branches.filter((b) => b.status === "ACTIVE").length;
  const staleDevices = (devices ?? []).filter(isDeviceStale);

  const shown = (value: number | null): string => (value === null ? "—" : formatNumber(value));

  const hints: Record<string, Pick<QuickAccessItem, "hint" | "attention">> = {
    "/admin/employees": { hint: `${formatNumber(totalEmployees)} employees` },
    "/admin/employee-requests": { hint: `${shown(pendingEmployees)} employees to approve`, attention: pendingEmployees ?? 0 },
    "/admin/money-requests": { hint: `${formatNumber(pendingMoney)} to decide · ${shown(toRelease)} to release`, attention: pendingMoney + (toRelease ?? 0) },
    "/admin/off-days": { hint: `${shown(offToday)} off today` },
    "/admin/attendance": { hint: summary ? `${formatNumber(summary.currentlyIn)} clocked in now` : "Live attendance board" },
    "/admin/days-worked": { hint: "Locked by the Back Office" },
    "/admin/branches": { hint: `${formatNumber(activeBranches)} active of ${formatNumber(branches.length)}` },
    "/admin/departments": { hint: "Company-wide departments" },
    "/admin/agents": { hint: agents ? `${formatNumber(agents.length)} agents · ${formatNumber(agents.reduce((sum, a) => sum + (a.employeeCount ?? 0), 0))} staff` : "Agent directory" },
    "/admin/users": { hint: "Accounts and access" },
    "/admin/devices": { hint: devices ? `${formatNumber(summary?.devicesOnline ?? 0)} of ${formatNumber(devices.length)} reporting` : "Biometric terminals", attention: staleDevices.length },
    "/admin/audit": { hint: "Damages, logins and approvals" },
    "/admin/pay-settings": { hint: "Rates and agent payments" },
    "/admin/payslips": { hint: "What each employee is paid" },
    "/admin/settings": { hint: "Company profile and logo" },
  };

  const quickAccess: QuickAccessItem[] = [
    { href: "/admin/employees/new", title: "Add Employee", icon: "person_add", hint: "Register a new employee" },
    ...navigationFor(session.role)
      .filter((item) => item.href !== "/admin/dashboard")
      .map((item) => ({ href: item.href, title: item.title, icon: item.icon, ...(hints[item.href] ?? { hint: `Open ${item.title}` }) })),
  ];

  const inGroup = (href: string) => QUICK_ACCESS_GROUPS.some((group) => group.hrefs.includes(href));
  const quickAccessGroups = [
    ...QUICK_ACCESS_GROUPS.map((group) => ({
      title: group.title,
      items: group.hrefs.flatMap((href) => quickAccess.filter((item) => item.href === href)),
    })),
    { title: "More", items: quickAccess.filter((item) => !inGroup(item.href)) },
  ];

  /** Attendance rate for one branch, from the summary's per-branch roll-up. */
  const rateFor = (branchId: number): number | null => {
    const row = summary?.branches.find((b) => b.branchId === branchId);
    return row ? row.attendanceRatePercent : null;
  };

  return (
    <div className="flex flex-col gap-gutter">
      {staleDevices.length > 0 ? (
        <AlertSpotlight
          message={`${formatNumber(staleDevices.length)} ${
            staleDevices.length === 1 ? "terminal has" : "terminals have"
          } not synced in the last hour.`}
          href="/admin/devices"
        />
      ) : null}

      {/* ─────────────────────────────── headline cards ─────────────────── */}
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-5">
        <Link href="/admin/employee-requests" className={CARD_LINK}>
          <StatCard
            className="w-full"
            label="Awaiting Approval"
            value={formatNumber(awaitingTotal)}
            icon="fact_check"
            badgeIcon="arrow_forward"
            hint={
              unreadQueue
                ? "Some queues could not be read, so this may be low"
                : `${shown(pendingEmployees)} employees · ${formatNumber(pendingMoney)} money`
            }
          />
        </Link>
        <Link href="/admin/attendance" className={CARD_LINK}>
          <StatCard
            className="w-full"
            label="Clocked In Now"
            value={summary ? formatNumber(summary.currentlyIn) : "—"}
            icon="schedule"
            badgeIcon="arrow_forward"
            hint={summary ? `${formatNumber(summary.reported)} of ${formatNumber(summary.expectedEmployees)} reported today` : "Could not be read"}
          />
        </Link>
        <Link href="/admin/employees" className={CARD_LINK}>
          <StatCard
            className="w-full"
            label="Total Employees"
            value={formatNumber(totalEmployees)}
            icon="group"
            badgeIcon="arrow_forward"
            hint="Open the employee list"
          />
        </Link>
        <Link href="/admin/dashboard/branches" className={CARD_LINK}>
          <StatCard
            className="w-full"
            label="Branches"
            value={formatNumber(activeBranches)}
            icon="corporate_fare"
            badgeIcon="arrow_forward"
            hint="Open to see employees by branch"
          />
        </Link>
        <Link href="/admin/off-days/calendar" className={`${CARD_LINK} sm:col-span-2 xl:col-span-1`}>
          <StatCard
            className="w-full"
            label="Off Today"
            value={shown(offToday)}
            icon="calendar_month"
            badgeIcon="arrow_forward"
            hint="Open the month's off days calendar"
          />
        </Link>
      </div>

      <QuickAccessGroups groups={quickAccessGroups} />

      {/* ───────────────────────── performance and attendance ───────────── */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <BentoCard
          className="lg:col-span-8"
          title="Branch Performance"
          subtitle="Headcount and today's attendance rate, per branch"
          action={
            <Link
              href="/admin/branches"
              className="flex items-center gap-2 rounded border border-outline-variant/40 px-3 py-1.5 text-[10px] text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <Icon name="arrow_forward" className="text-sm" />
              All Branches
            </Link>
          }
        >
          {branches.length === 0 ? (
            <EmptyState
              symbol="location_off"
              title="No branches yet"
              description="Branches appear here once they have been created."
            />
          ) : (
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
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">
                      Employees
                    </th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                      Attendance&nbsp;%
                    </th>
                  </tr>
                </thead>

                <tbody className="font-body-md text-body-md">
                  {branches.map((branch) => {
                    const employees = headcount.get(branch.id);
                    const rate = rateFor(branch.id);

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
                        <td className="py-3 text-on-surface-variant">
                          {branch.managerName ?? (
                            <span className="text-amber-main">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 text-right tabular-nums text-on-surface-variant">
                          {employees === null || employees === undefined
                            ? "—"
                            : formatNumber(employees)}
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums text-on-surface-variant">
                          {rate === null ? "—" : formatPercent(rate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>

        <div className="flex flex-col gap-gutter lg:col-span-4">
          {summary ? (
            <SegmentStrip
              segments={[
                { label: "Expected", value: formatNumber(summary.expectedEmployees) },
                { label: "Reported", value: formatNumber(summary.reported) },
                {
                  label: "Not Yet In",
                  value: formatNumber(summary.notYetIn),
                  tone: summary.notYetIn > 0 ? "warning" : "default",
                },
              ]}
            />
          ) : null}

          <BentoCard title="Attendance Today" className="flex-1">
            {summary ? (
              <>
                <p className="font-card-stat text-card-stat tabular-nums text-on-surface">
                  {formatPercent(summary.attendanceRatePercent, 1)}
                </p>
                <p className="mt-1 text-[10px] text-outline">
                  {formatNumber(summary.reported)} of{" "}
                  {formatNumber(summary.expectedEmployees)} employees reported
                </p>
                <div className="mt-4 border-t border-outline-variant/40 pt-3 text-[11px] text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Currently in</span>
                    <span className="tabular-nums">
                      {formatNumber(summary.currentlyIn)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <span>Clocked out</span>
                    <span className="tabular-nums">
                      {formatNumber(summary.clockedOut)}
                    </span>
                  </div>
                </div>
                <Link
                  href="/admin/attendance"
                  className="mt-4 flex items-center gap-1 text-[11px] font-medium text-primary-container hover:underline"
                >
                  Attendance board
                  <Icon name="arrow_forward" className="text-sm" />
                </Link>
              </>
            ) : (
              <p className="py-4 text-center font-body-md text-body-md text-outline">
                Attendance for today could not be read.
              </p>
            )}
          </BentoCard>
        </div>
      </div>

    </div>
  );
}
