import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getDepartments } from "@/lib/api/department";
import { formatNumber } from "@/lib/format";

import { DeleteDepartmentButton } from "./_components/delete-department-button";

/** Company-wide departments — one list used by every branch. */
export default async function DepartmentsPage() {
  const session = await requirePermission("department:write");
  const canDelete = session.role === "ADMIN" || session.role === "SUPER_ADMIN";

  let departments: Awaited<ReturnType<typeof getDepartments>>;
  try {
    departments = await getDepartments();
  } catch (error) {
    return (
      <DataUnavailable
        title="Departments"
        description="The departments used across every branch."
        subject="The department list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Departments"
        description="One list of departments, used by every branch and every employee."
        pill={<CountPill label={`${formatNumber(departments.length)} total`} />}
        actions={
          <Link
            href="/admin/departments/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
          >
            <Icon name="add" className="text-[18px]" />
            Add Department
          </Link>
        }
      />

      <BentoCard title="Departments">
        {departments.length === 0 ? (
          <EmptyState symbol="account_tree" title="No departments yet" description="Add the first department. Branch Managers and Agents then assign employees to it." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Department</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Head</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {departments.map((department) => (
                  <tr key={department.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-3 pl-2 font-semibold text-primary">
                      <Link href={`/admin/departments/${department.id}`}>{department.name}</Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">
                      {department.headOfDepartmentName ?? <span className="text-amber-main">No head</span>}
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex items-start justify-end gap-3">
                        <Link href={`/admin/departments/${department.id}`} aria-label={`Edit ${department.name}`} className="inline-flex text-on-surface-variant hover:text-primary">
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