import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";

import { DepartmentForm } from "../_components/department-form";

/** Add a department. Only active branches are offered. */
export default async function NewDepartmentPage() {
  await requirePermission("department:write");

  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    branches = (await getBranches()).filter((branch) => branch.status === "ACTIVE");
  } catch (error) {
    return (
      <DataUnavailable
        title="Add Department"
        subject="The branch list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  if (branches.length === 0) {
    return (
      <>
        <PageHeader title="Add Department" />
        <EmptyState symbol="location_off" title="No active branch" description="Create a branch first — every department belongs to one." />
      </>
    );
  }

  const results = await Promise.allSettled(branches.map((branch) => getEmployeesByBranch(branch.id)));
  const headsByBranch: Record<number, { id: number; name: string }[]> = {};
  branches.forEach((branch, index) => {
    const result = results[index];
    headsByBranch[branch.id] =
      result?.status === "fulfilled"
        ? result.value
            .filter((employee) => employee.employmentStatus === "ACTIVE")
            .map((employee) => ({ id: employee.id, name: `${employee.fullName} (${employee.employeeNumber})` }))
        : [];
  });

  return (
    <>
      <PageHeader title="Add Department" description="Create a team or unit inside a branch." />
      <DepartmentForm
        mode="create"
        branches={branches.map((branch) => ({ id: branch.id, name: branch.name }))}
        headsByBranch={headsByBranch}
      />
    </>
  );
}