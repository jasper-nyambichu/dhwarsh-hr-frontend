import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeeEntryForm } from "@/components/features/staff/employee-entry-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getDepartments } from "@/lib/api/department";
import { getEmployee } from "@/lib/api/employee";
import { getAgentOptions } from "@/lib/api/staff";

/** Admin edits an employee's details. The branch is changed from the employee's page (Move to another branch). */
export default async function AdminEditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("employee:write");

  const { id } = await params;
  const employeeId = Number(id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) notFound();

  let data: {
    employee: Awaited<ReturnType<typeof getEmployee>>;
    departments: Awaited<ReturnType<typeof getDepartments>>;
    agents: Awaited<ReturnType<typeof getAgentOptions>>;
  };
  try {
    const [employee, departments, agents] = await Promise.all([getEmployee(employeeId), getDepartments(), getAgentOptions()]);
    data = { employee, departments, agents };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Edit Employee" subject="This employee" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const { employee } = data;
  const backHref = `/admin/employees/${employee.id}`;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href={backHref} aria-label="Back to the employee" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            Edit {employee.fullName}
          </span>
        }
        description={`${employee.employeeNumber} · ${employee.branchName ?? "Branch"}`}
      />
      <EmployeeEntryForm
        mode="edit"
        employee={employee}
        branches={[]}
        lockedBranch={{ id: employee.branchId, name: employee.branchName ?? `Branch #${employee.branchId}` }}
        departments={data.departments.map((department) => ({ id: department.id, name: department.name }))}
        agents={data.agents}
        today={format(new Date(), "yyyy-MM-dd")}
        cancelHref={backHref}
      />
    </>
  );
}
