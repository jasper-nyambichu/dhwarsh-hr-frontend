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

/** The Accounts Office edits an employee's details, with the same form as the Admin. */
export default async function AccountsEditEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePermission("employee:maintain");

  const employeeId = Number((await params).employeeId);
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
  const backHref = `/accounts/employees/${employee.id}`;

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
