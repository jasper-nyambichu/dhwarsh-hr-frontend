import Link from "next/link";
import type { ReactNode } from "react";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber } from "@/lib/format";
import type { BranchResponse, EmployeeSummaryResponse } from "@/types";

/**
 * Employee directory.
 *
 * There is **no `GET /employees`** on the backend, so this is assembled branch
 * by branch — one read per branch, concurrently. That is a real shape of the
 * API rather than a shortcut here, and it has two consequences worth knowing:
 *
 *  - The table cannot be sorted or paginated server-side, because it is not one
 *    result set. Filtering happens after the merge, over the whole company.
 *  - The rows are `EmployeeSummaryResponse`, which is deliberately thin: name,
 *    number, branch, position, status. No salary and no statutory identifiers
 *    appear in any list — only `GET /employees/{id}` returns those.
 *
 * A branch whose read fails contributes no rows rather than failing the page,
 * so one bad branch does not hide every other branch's staff.
 */
export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; q?: string }>;
}) {
  await requirePermission("employee:read");

  const { branch: branchFilter, q } = await searchParams;

  let branches: BranchResponse[];

  try {
    branches = await getBranches();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Employees"
        description="Every employee across the company's branches."
        subject="The branch list"
        reason={
          error instanceof ApiError && error.isForbidden
            ? "Your role is not permitted to read /branches yet, and the directory is assembled branch by branch. See docs/backend-patches/HR_MANAGER_READ_ACCESS.md."
            : error instanceof ApiError
              ? error.message
              : undefined
        }
      />
    );
  }

  const visibleBranches = branchFilter
    ? branches.filter((b) => String(b.id) === branchFilter)
    : branches;

  const results = await Promise.allSettled(
    visibleBranches.map((branch) => getEmployeesByBranch(branch.id)),
  );

  // An all-branches failure is a backend problem worth reporting; a single
  // branch's failure inside a working company is not.
  const everyReadFailed =
    results.length > 0 && results.every((r) => r.status === "rejected");

  if (everyReadFailed) {
    const first = results[0];

    return (
      <DataUnavailable
        title="Employees"
        description="Every employee across the company's branches."
        subject="The employee list"
        reason={
          first.status === "rejected" && first.reason instanceof ApiError
            ? first.reason.message
            : undefined
        }
      />
    );
  }

  const employees: EmployeeSummaryResponse[] = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const failedBranchCount = results.filter((r) => r.status === "rejected").length;

  const search = q?.trim().toLowerCase() ?? "";
  const filtered = search
    ? employees.filter(
        (e) =>
          e.fullName.toLowerCase().includes(search) ||
          e.employeeNumber.toLowerCase().includes(search) ||
          (e.position ?? "").toLowerCase().includes(search),
      )
    : employees;

  return (
    <>
      <PageHeader
        title="Employees"
        description="Every employee across the company's branches."
        actions={
          <Link
            href="/hr/employees/new"
            className={buttonVariants({ className: "w-fit" })}
          >
            <Icon name="person_add" className="text-[18px]" />
            Add Employee
          </Link>
        }
      />

      {failedBranchCount > 0 ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-amber-main/40 bg-amber-main/5 px-4 py-3 font-body-md text-body-md text-on-surface-variant"
        >
          {formatNumber(failedBranchCount)}{" "}
          {failedBranchCount === 1 ? "branch" : "branches"} could not be read, so
          the total below is incomplete.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterLink href="/hr/employees" active={!branchFilter}>
          All branches
        </FilterLink>
        {branches.map((branch) => (
          <FilterLink
            key={branch.id}
            href={`/hr/employees?branch=${branch.id}`}
            active={branchFilter === String(branch.id)}
          >
            {branch.name}
          </FilterLink>
        ))}
      </div>

      <form className="mb-4 flex gap-2" action="/hr/employees">
        {branchFilter ? (
          <input type="hidden" name="branch" value={branchFilter} />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, number or job title"
          className="w-full max-w-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
        />
        <Button type="submit" variant="secondary" size="md">
          Search
        </Button>
      </form>

      <BentoCard
        title="Directory"
        action={
          <span className="font-body-md text-[11px] text-outline">
            {formatNumber(filtered.length)}{" "}
            {filtered.length === 1 ? "employee" : "employees"}
          </span>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            symbol="group_off"
            title={search ? "Nobody matches that search" : "No employees yet"}
            description={
              search
                ? "Try a different name, employee number or job title."
                : "Add the first employee to see them here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Number</th>
                  <th className="pb-3 pr-4">Branch</th>
                  <th className="pb-3 pr-4">Position</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-outline-variant/25 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/hr/employees/${employee.id}`}
                        className="font-semibold text-on-surface hover:text-primary"
                      >
                        {employee.fullName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[12px] text-on-surface-variant">
                      {employee.employeeNumber}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {employee.branchName ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {employee.position ?? "—"}
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={employee.employmentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 font-body-md text-[11px] font-semibold transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
      }`}
    >
      {children}
    </Link>
  );
}
