import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BranchEmployeesTable } from "@/components/features/employee/branch-directory";
import { EmployeeExportButtons } from "@/components/features/employee/employee-export-buttons";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getMyBranch } from "@/lib/api/branch";
import { getMyBranchEmployees } from "@/lib/api/employee";

/** The employees of the manager's own branch, in the same list as the Admin's, without salary. */
export default async function BranchEmployeesPage() {
  await requirePermission("employee:read:branch");

  let branch: Awaited<ReturnType<typeof getMyBranch>>;
  let employees: Awaited<ReturnType<typeof getMyBranchEmployees>>;
  try {
    [branch, employees] = await Promise.all([getMyBranch(), getMyBranchEmployees()]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Employees"
        subject="Your employees"
        reason={error instanceof ApiError ? error.message : "Your account may not be assigned to a branch yet — ask an Admin."}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Employees"
        description={`Employees of ${branch.name}.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <EmployeeExportButtons />
            <Link href="/branch/employees/new" className="flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-bold text-on-primary transition-opacity hover:opacity-90">
              <Icon name="person_add" className="text-sm" />
              Add Employee
            </Link>
          </div>
        }
      />
      <BranchEmployeesTable
        employees={employees}
        employeeHref={(employeeId) => `/branch/employees/${employeeId}`}
        emptyDescription="Add your first employee. An Admin approves them before they appear here."
        showSalary={false}
      />
    </>
  );
}
