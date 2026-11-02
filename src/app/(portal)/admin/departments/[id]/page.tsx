import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { getDepartment } from "@/lib/api/department";
import { getEmployeesByDepartment } from "@/lib/api/employee";
import { formatNumber } from "@/lib/format";

import { DepartmentForm } from "../_components/department-form";

/** Edit a department and see who works in it, across every branch. */
export default async function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("department:write");

  const { id } = await params;
  const departmentId = Number(id);
  if (!Number.isInteger(departmentId) || departmentId <= 0) notFound();

  let department: Awaited<ReturnType<typeof getDepartment>>;
  let staff: Awaited<ReturnType<typeof getEmployeesByDepartment>>;
  try {
    const [found, members] = await Promise.all([
      getDepartment(departmentId),
      getEmployeesByDepartment(departmentId),
    ]);
    department = found;
    staff = members;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Department" subject="This department" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader title={department.name} description={`${formatNumber(staff.length)} employee${staff.length === 1 ? "" : "s"} across all branches`} />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-gutter">
        <DepartmentForm mode="edit" initial={department} />

        <BentoCard title="Employees in this department">
          {staff.length === 0 ? (
            <EmptyState symbol="group_off" title="Nobody assigned yet" description="Branch Managers assign employees to departments." />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left font-body-md text-body-md">
                <thead>
                  <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Branch</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((person) => (
                    <tr key={person.id} className="border-b border-outline-variant/25 last:border-0">
                      <td className="py-3">
                        <span className="block font-semibold text-on-surface">{person.fullName}</span>
                        <span className="block font-mono text-[11px] text-outline">{person.employeeNumber}</span>
                      </td>
                      <td className="py-3 text-on-surface-variant">{person.branchName ?? "—"}</td>
                      <td className="py-3 text-right"><StatusBadge status={person.employmentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </>
  );
}