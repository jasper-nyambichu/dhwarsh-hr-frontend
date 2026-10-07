import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requireAnyPermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { StatCard } from "@/components/shared/stat-card";
import { Icon } from "@/components/ui/icon";
import { getAgents } from "@/lib/api/agent";
import { getAttendanceDevices, getAttendanceSummary } from "@/lib/api/attendance";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/format";
import type { AttendanceDeviceItem, BranchResponse } from "@/types";

/**
 * Admin dashboard. Serves SUPER_ADMIN and ADMIN — both own /admin.
 *
 * Everything here is a real read: branch directory, the attendance summary for
 * today, the agent list, the terminal fleet, and a per-branch employee count.
 *
 * Five widgets the placeholder carried are not here, because nothing in the
 * schema or the API can answer them:
 *
 *   · **Headcount Growth** — a seven-month series. Nothing records headcount
 *     over time; `employees` holds only the current row, so a trend line would
 *     have to be invented wholesale.
 *   · **Payroll Status** (disbursed / processed / pending on hold) — needs the
 *     payroll-run list, which the backend does not expose yet.
 *   · **Awaiting Approval** — the approval queues are scoped per role
 *     (`/leave/pending/manager` and friends); there is no company-wide pending
 *     queue to render for an administrator.
 *   · **Workforce Split** — the donut needs `employment_type`, which the
 *     `by-branch` list does not return. Only the single-employee read carries
 *     it, so a company-wide split would be one request per employee.
 *   · **Payroll KES** per branch — no per-branch payroll total exists.
 *
 * Each returns with the aggregate endpoint that supplies it. Until then an
 * empty slot is honest and a fabricated one is not — the figures above were
 * realistic enough to be believed, which is exactly what made them dangerous on
 * a screen an administrator uses to decide things.
 */

/** A terminal that has not synced in this long reads as not reporting. */
const DEVICE_STALE_MINUTES = 60;

function isDeviceStale(device: AttendanceDeviceItem): boolean {
  if (device.status !== "ACTIVE") return false;
  if (!device.lastSyncAt) return true;

  const ageMs = Date.now() - new Date(device.lastSyncAt).getTime();
  return ageMs > DEVICE_STALE_MINUTES * 60_000;
}

export default async function AdminDashboardPage() {
  // ADMIN and SUPER_ADMIN both hold these; anyone else is bounced to their own
  // namespace before a single figure renders.
  await requireAnyPermission(["company:read", "branch:read"]);

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
  const [summaryResult, agentsResult, devicesResult] = await Promise.allSettled([
    getAttendanceSummary(),
    getAgents(),
    getAttendanceDevices(),
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

  /** Attendance rate for one branch, from the summary's per-branch roll-up. */
  const rateFor = (branchId: number): number | null => {
    const row = summary?.branches.find((b) => b.branchId === branchId);
    return row ? row.attendanceRatePercent : null;
  };

  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
      {/* ───────────────────────────────── left column ─────────────────── */}
      <div className="flex flex-col gap-gutter md:col-span-8">
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-3">
          <StatCard
            label="Total Employees"
            value={formatNumber(totalEmployees)}
            icon="group"
            badgeIcon="badge"
          />
          <StatCard
            label="Active Branches"
            value={formatNumber(activeBranches)}
            icon="corporate_fare"
            badgeIcon="storefront"
          />
          <StatCard
            label="Labour Agents"
            value={agents === null ? "—" : formatNumber(agents.length)}
            icon="engineering"
            badgeIcon="handshake"
          />
        </div>

        <BentoCard
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
                    const count = headcount.get(branch.id);
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
                          {count === null || count === undefined
                            ? "—"
                            : formatNumber(count)}
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
      </div>

      {/* ──────────────────────────────── right column ─────────────────── */}
      <div className="flex flex-col gap-gutter md:col-span-4">
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

        {staleDevices.length > 0 ? (
          <AlertSpotlight
            message={`${formatNumber(staleDevices.length)} ${
              staleDevices.length === 1 ? "terminal has" : "terminals have"
            } not synced in the last hour.`}
            href="/admin/devices"
          />
        ) : null}

        <BentoCard title="Attendance Today">
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

        <BentoCard title="Device Fleet">
          {devices ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-card-stat text-card-stat tabular-nums text-on-surface">
                  {formatNumber(summary?.devicesOnline ?? 0)}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  of {formatNumber(devices.length)} reporting
                </span>
              </div>

              {staleDevices.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2 border-t border-outline-variant/40 pt-3">
                  {staleDevices.slice(0, 4).map((device) => (
                    <li
                      key={device.id}
                      className="flex items-center justify-between gap-3 text-[11px]"
                    >
                      <span className="min-w-0 truncate font-mono text-on-surface-variant">
                        {device.deviceSerial}
                      </span>
                      <span className="shrink-0 text-error">
                        {device.lastSyncAt
                          ? formatRelativeTime(device.lastSyncAt)
                          : "never"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[11px] text-on-surface-variant">
                  Every active terminal has synced recently.
                </p>
              )}

              <Link
                href="/admin/devices"
                className="mt-4 flex items-center gap-1 text-[11px] font-medium text-primary-container hover:underline"
              >
                Manage devices
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </>
          ) : (
            <p className="py-4 text-center font-body-md text-body-md text-outline">
              The device fleet could not be read.
            </p>
          )}
        </BentoCard>

        <BentoCard title="Labour Agents">
          <div className="flex items-baseline gap-2">
            <span className="font-card-stat text-card-stat tabular-nums text-on-surface">
              {agents === null ? "—" : formatNumber(agents.length)}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              registered suppliers
            </span>
          </div>
          {agents && agents.length > 0 ? (
            <p className="mt-3 text-[11px] text-on-surface-variant">
              {formatNumber(
                agents.reduce((sum, a) => sum + (a.employeeCount ?? 0), 0),
              )}{" "}
              staff deployed across them.
            </p>
          ) : null}
          <Link
            href="/admin/agents"
            className="mt-4 flex items-center gap-1 text-[11px] font-medium text-primary-container hover:underline"
          >
            Agent directory
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </BentoCard>
      </div>
    </div>
  );
}
