import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BranchEmployeesTable } from "@/components/features/employee/branch-directory";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getMyBranchEmployees } from "@/lib/api/employee";

/** Everyone at this login's own branch. The full record stays closed to the Back Office, so names are not links. */
export default async function BackOfficeEmployeesPage() {
  const session = await requirePermission("employee:read");

  if (!session.branchId) {
    return (
      <DataUnavailable
        title="Employees"
        subject="Your employees"
        reason="This account isn't assigned to a branch yet. Ask your administrator."
      />
    );
  }

  let employees: Awaited<ReturnType<typeof getMyBranchEmployees>>;
  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    [employees, branches] = await Promise.all([getMyBranchEmployees(), getBranches()]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Employees"
        subject="Your employees"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const branchName = branches.find((branch) => branch.id === session.branchId)?.name;

  return (
    <>
      <PageHeader
        title="Employees"
        description={branchName ? `Employees of ${branchName}.` : "Employees of your branch."}
      />
      <BranchEmployeesTable
        employees={employees}
        emptyDescription="An Admin adds employees to this branch."
        showSalary={false}
      />
    </>
  );
}
