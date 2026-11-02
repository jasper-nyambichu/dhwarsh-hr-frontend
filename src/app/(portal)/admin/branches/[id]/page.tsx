import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { getCurrentUser, requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getBranch } from "@/lib/api/branch";
import { getDevicesByBranch } from "@/lib/api/biometric";
import { getDepartmentsByBranch } from "@/lib/api/department";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber, formatRelativeTime, initials } from "@/lib/format";
import type {
  BiometricDeviceResponse,
  BranchResponse,
  DepartmentResponse,
  EmployeeSummaryResponse,
} from "@/types";

/**
 * Branch detail.
 *
 * Four concurrent reads, all of which exist today: the branch, its employees,
 * its departments, and its terminals. That is enough to make all three stat
 * tiles real counts rather than the literals the placeholder carried.
 *
 * Two things the placeholder showed have no source and are gone: the manager's
 * **email** (`BranchResponse` carries `managerName` only — the address would
 * need a join the endpoint does not do) and **"Manager since"** (`branches` has
 * no such column). A department's **staff count** is gone for the same reason:
 * `DepartmentResponse` has no employee count, and `EmployeeSummaryResponse`
 * carries no `departmentId` to count against. The fix for that last one is a
 * field on the response, not a client-side guess.
 */

/** A terminal that has not synced in this long reads as offline. */
const DEVICE_STALE_MINUTES = 60;

function isDeviceOnline(device: BiometricDeviceResponse): boolean {
  if (device.status !== "ACTIVE") return false;
  if (!device.lastSyncAt) return false;

  const ageMs = Date.now() - new Date(device.lastSyncAt).getTime();
  return ageMs <= DEVICE_STALE_MINUTES * 60_000;
}

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("branch:read");

  const { id } = await params;
  const branchId = Number(id);

  // A non-numeric segment is a bad URL, not a missing record.
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();

  const viewer = await getCurrentUser();

  let branch: BranchResponse;
  let employees: EmployeeSummaryResponse[];
  let departments: DepartmentResponse[];
  let devices: BiometricDeviceResponse[];

  try {
    [branch, employees, departments, devices] = await Promise.all([
      getBranch(branchId),
      getEmployeesByBranch(branchId),
      getDepartmentsByBranch(branchId),
      getDevicesByBranch(branchId),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");
    if (error instanceof ApiError && error.isNotFound) notFound();

    return (
      <DataUnavailable
        title="Branch"
        description="Location detail, roster, departments and terminals."
        subject="This branch"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const onlineDevices = devices.filter(isDeviceOnline).length;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/admin/branches"
              className="flex size-9 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant shadow-ambient-1 transition-colors hover:text-primary"
            >
              <Icon name="arrow_back_ios_new" />
            </Link>
            {branch.name}
            <StatusBadge status={branch.status} />
          </span>
        }
        actions={
          <Link
            href="/admin/branches"
            className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-6 py-2.5 font-body-md text-body-md font-semibold text-white shadow-ambient-1 transition-colors hover:bg-primary"
          >
            <Icon name="list" className="text-[18px]" />
            All Branches
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-3">
            <BentoCard title={null} className="relative overflow-hidden">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface-variant">
                  Employees
                </h3>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">
                  <Icon name="badge" className="text-[18px]" />
                </span>
              </div>
              <div className="font-card-stat text-card-stat text-on-primary-fixed-variant">
                {formatNumber(employees.length)}
              </div>
            </BentoCard>

            <BentoCard title={null}>
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface-variant">
                  Departments
                </h3>
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-soft text-primary-container">
                  <Icon name="corporate_fare" className="text-[18px]" />
                </span>
              </div>
              <div className="font-card-stat text-card-stat text-on-primary-fixed-variant">
                {formatNumber(departments.length)}
              </div>
            </BentoCard>

            <BentoCard title={null}>
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface-variant">
                  Devices
                </h3>
                <span className="flex size-8 items-center justify-center rounded-full bg-tertiary-container/10 text-tertiary-container">
                  <Icon name="fingerprint" className="text-[18px]" />
                </span>
              </div>
              <div className="font-card-stat text-card-stat text-on-primary-fixed-variant">
                {formatNumber(devices.length)}
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant">
                {formatNumber(onlineDevices)} reporting
              </p>
            </BentoCard>
          </div>

          <BentoCard title="Departments">
            {departments.length === 0 ? (
              <EmptyState
                symbol="corporate_fare"
                title="No departments yet"
                description="Departments created under this branch will be listed here."
              />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                        Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {departments.map((dept) => (
                      <tr key={dept.id}>
                        <td className="py-3 pl-2 font-medium text-on-primary-fixed-variant">
                          {dept.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>

          <BentoCard
            title="Employee Roster"
            subtitle={`${formatNumber(employees.length)} employees at this branch`}
          >
            {employees.length === 0 ? (
              <EmptyState
                symbol="group_off"
                title="No employees at this branch"
                description="Staff assigned to this branch will appear here."
              />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                        Employee
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Position
                      </th>
                      <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="py-3 pl-2">
                          <span className="block font-medium text-on-surface">
                            {employee.fullName}
                          </span>
                          <span className="block font-mono text-[10px] text-outline">
                            {employee.employeeNumber}
                          </span>
                        </td>
                        <td className="py-3 text-on-surface-variant">
                          {employee.position ?? "—"}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <StatusBadge status={employee.employmentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Branch Manager">
            {branch.managerName ? (
              <div className="flex flex-col items-center text-center">
                <span
                  aria-hidden
                  className="mb-4 flex size-24 items-center justify-center rounded-full border-4 border-white bg-secondary-container text-2xl font-bold text-primary shadow-ambient-1"
                >
                  {initials(branch.managerName)}
                </span>
                <h2 className="font-page-title text-page-title text-on-primary-fixed-variant">
                  {branch.managerName}
                </h2>
                <p className="mt-2 font-label-rail text-label-rail uppercase tracking-wider text-on-surface-variant">
                  Employee #{branch.managerId}
                </p>
              </div>
            ) : (
              <div className="py-2 text-center">
                <Icon
                  name="person_off"
                  className="text-2xl text-amber-main"
                />
                <p className="mt-2 font-body-md text-body-md text-amber-main">
                  No manager assigned
                </p>
                <p className="mt-1 text-[10px] text-on-surface-variant">
                  Assigning a manager links the branch to a `BRANCH_MANAGER`
                  account for scoped reporting.
                </p>
              </div>
            )}
          </BentoCard>

          <BentoCard title="Contact Details">
            <dl className="flex flex-col gap-3 font-body-md text-body-md">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Code</dt>
                <dd className="font-mono text-[11px] text-on-surface">
                  {branch.code}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Phone</dt>
                <dd className="text-right text-on-surface">
                  {branch.phone ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Email</dt>
                <dd className="min-w-0 break-all text-right text-on-surface">
                  {branch.email ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Address</dt>
                <dd className="text-right text-on-surface">
                  {branch.address ?? "—"}
                </dd>
              </div>
            </dl>
          </BentoCard>

          <BentoCard
            title="Assigned Devices"
            action={
              <span className="rounded-full bg-surface-container px-2 py-1 font-label-rail text-label-rail text-on-surface-variant">
                {devices.length} Total
              </span>
            }
          >
            {devices.length === 0 ? (
              <EmptyState
                symbol="fingerprint"
                title="No terminals registered"
                description="Biometric terminals enrolled to this branch will appear here."
              />
            ) : (
              <ul className="flex flex-col gap-1">
                {devices.map((device) => {
                  const online = isDeviceOnline(device);

                  return (
                    <li key={device.id}>
                      <div
                        className={
                          online
                            ? "flex items-center justify-between rounded-lg border border-transparent p-3"
                            : "flex items-center justify-between rounded-lg border border-error/20 bg-[#fff4f2] p-3"
                        }
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={
                              online
                                ? "flex size-10 items-center justify-center rounded-lg bg-surface-container text-primary"
                                : "flex size-10 items-center justify-center rounded-lg bg-white text-error shadow-sm"
                            }
                          >
                            <Icon name={online ? "dns" : "warning"} />
                          </span>
                          <span>
                            <span
                              className={`block font-body-md text-body-md font-semibold ${
                                online
                                  ? "text-on-primary-fixed-variant"
                                  : "text-error"
                              }`}
                            >
                              {device.deviceSerial}
                            </span>
                            <span className="mt-0.5 block font-label-rail text-label-rail text-on-surface-variant">
                              {device.lastSyncAt
                                ? `Synced ${formatRelativeTime(device.lastSyncAt)}`
                                : "Never synced"}
                            </span>
                          </span>
                        </span>
                        <span
                          className={`size-2.5 rounded-full ${
                            online ? "bg-[#137333]" : "bg-error"
                          }`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Deactivating a terminal is SUPER_ADMIN / ADMIN; the link to the
                fleet screen is shown to anyone who can read the branch. */}
            {viewer.role === "SUPER_ADMIN" || viewer.role === "ADMIN" ? (
              <div className="mt-2 border-t border-outline-variant/50 pt-3">
                <Link
                  href="/admin/devices"
                  className="block w-full py-1 text-center font-body-md text-body-md text-primary-container hover:underline"
                >
                  Manage Devices
                </Link>
              </div>
            ) : null}
          </BentoCard>
        </div>
      </div>
    </>
  );
}
