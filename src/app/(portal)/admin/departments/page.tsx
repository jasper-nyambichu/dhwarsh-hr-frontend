import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getBranches } from "@/lib/api/branch";
import { getDepartments } from "@/lib/api/department";
import { formatNumber } from "@/lib/format";
import type { BranchResponse, DepartmentResponse } from "@/types";

import { DeleteDepartmentButton } from "./_components/delete-department-button";

/** Departments across every branch, filtered by `?branch=`. From `GET /departments`. */
export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const session = await requirePermission("department:write");
  const canDelete = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
  const canWrite = hasPermission(session.role, "department:write");
  const { branch: branchParam } = await searchParams;

  let departments: DepartmentResponse[];
  let branches: BranchResponse[];
  try {
    [departments, branches] = await Promise.all([getDepartments(), getBranches()]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Departments"
        description="Teams and units across your branches."
        subject="The department list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const branchFilter = Number(branchParam);
  const rows = Number.isInteger(branchFilter) && branchFilter > 0
    ? departments.filter((department) => department.branchId === branchFilter)
    : departments;
  const sorted = [...rows].sort(
    (a, b) => (a.branchName ?? "").localeCompare(b.branchName ?? "") || a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader
        title="Departments"
        description="Teams and units across your branches."
        pill={<CountPill label={`${formatNumber(departments.length)} total`} />}
        actions={
          canWrite ? (
            <Link
              href="/admin/departments/new"
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
            >
              <Icon name="add" className="text-[18px]" />
              Add Department
            </Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/departments"
          className={`rounded-full px-3 py-1.5 font-body-md text-[11px] font-semibold transition-colors ${
            !branchParam ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          All branches
        </Link>
        {branches.map((branch) => (
          <Link
            key={branch.id}
            href={`/admin/departments?branch=${branch.id}`}
            className={`rounded-full px-3 py-1.5 font-body-md text-[11px] font-semibold transition-colors ${
              branchParam === String(branch.id)
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {branch.name}
          </Link>
        ))}
      </div>

      <BentoCard title="Departments" subtitle={`${formatNumber(sorted.length)} shown`}>
        {sorted.length === 0 ? (
          <EmptyState
            symbol="account_tree"
            title="No departments yet"
            description={
              branches.length === 0
                ? "Add a branch first — every department belongs to one."
                : "Add the first department. HR can then assign employees to it."
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Department</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Branch</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Head</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {sorted.map((department) => (
                  <tr key={department.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-3 pl-2 font-semibold text-primary">
                      <Link href={`/admin/departments/${department.id}`}>{department.name}</Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">{department.branchName ?? "—"}</td>
                    <td className="py-3 text-on-surface-variant">
                      {department.headOfDepartmentName ?? <span className="text-amber-main">No head</span>}
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex items-start justify-end gap-3">
                        <Link
                          href={`/admin/departments/${department.id}`}
                          aria-label={`Edit ${department.name}`}
                          className="inline-flex text-on-surface-variant hover:text-primary"
                        >
                          <Icon name="edit" className="text-[18px]" />
                        </Link>
                        {canDelete ? <DeleteDepartmentButton id={department.id} name={department.name} /> : null}
                      </div>
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