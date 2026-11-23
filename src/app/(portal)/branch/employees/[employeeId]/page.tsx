import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeeInfoCards, EmployeeProfileBanner } from "@/components/features/employee/employee-profile";
import { AssignDepartmentForm } from "@/components/features/staff/assign-department-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getDepartments } from "@/lib/api/department";
import { getEmployee } from "@/lib/api/employee";

/** One employee of the branch — the backend refuses anyone from another branch. */
export default async function BranchEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePermission("employee:read:branch");

  const { employeeId: raw } = await params;
  const employeeId = Number(raw);
  if (!Number.isInteger(employeeId) || employeeId <= 0) notFound();

  let employee: Awaited<ReturnType<typeof getEmployee>>;
  let departments: Awaited<ReturnType<typeof getDepartments>>;
  try {
    [employee, departments] = await Promise.all([getEmployee(employeeId), getDepartments()]);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) notFound();
    return <DataUnavailable title="Employee" subject="This employee" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href="/branch/employees" aria-label="Back to employees" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            {employee.fullName}
            <StatusBadge status={employee.employmentStatus} />
          </span>
        }
        description={`${employee.employeeNumber} · ${employee.branchName ?? "Branch"}`}
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* Branch Managers do not see pay, so the salary is left out. */}
        <div className="col-span-12 flex min-w-0 flex-col gap-gutter lg:col-span-8">
          <EmployeeProfileBanner employee={employee} showSalary={false} />
          <EmployeeInfoCards employee={employee} showSalary={false} />
        </div>

        <div className="col-span-12 flex min-w-0 flex-col gap-gutter lg:col-span-4">
          <AssignDepartmentForm
            employeeId={employee.id}
            currentDepartmentId={employee.departmentId}
            departments={departments.map((department) => ({ id: department.id, name: department.name }))}
          />
        </div>
      </div>
    </>
  );
}