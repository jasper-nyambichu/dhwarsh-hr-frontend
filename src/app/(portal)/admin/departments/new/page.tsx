import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";

import { DepartmentForm } from "../_components/department-form";

/** Add a company-wide department. */
export default async function NewDepartmentPage() {
  await requirePermission("department:write");

  let people: { id: number; name: string }[];
  try {
    const branches = await getBranches();
    const results = await Promise.allSettled(branches.map((branch) => getEmployeesByBranch(branch.id)));
    people = results
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .filter((employee) => employee.employmentStatus === "ACTIVE")
      .map((employee) => ({ id: employee.id, name: `${employee.fullName} (${employee.employeeNumber})` }));
  } catch (error) {
    return <DataUnavailable title="Add Department" subject="The employee list" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader title="Add Department" description="Create a department every branch can use." />
      <DepartmentForm mode="create" people={people} />
    </>
  );
}