import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getAgents } from "@/lib/api/agent";
import { getBranches } from "@/lib/api/branch";
import { getDepartmentsByBranch } from "@/lib/api/department";
import { getEmployee } from "@/lib/api/employee";
import type { AgentResponse, BranchResponse, DepartmentResponse } from "@/types";

import { EmployeeForm } from "../../_components/employee-form";

/**
 * Edit Employee.
 *
 * `PUT /employees/{id}` takes the same `EmployeeRequest` as create, so this
 * page reuses the create form rather than maintaining a second, drifting copy
 * of the field list. The one difference is the hidden `id` field.
 *
 * `employeeNumber` is shown but not editable — it is generated once at creation
 * and the request DTO has no field for it.
 */
export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("employee:write");

  const { id } = await params;
  const employeeId = Number(id);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    notFound();
  }

  let employee;
  let branches: BranchResponse[];

  try {
    [employee, branches] = await Promise.all([
      getEmployee(employeeId),
      getBranches(),
    ]);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isNotFound) notFound();

      if (error.isForbidden) {
        return (
          <DataUnavailable
            title="Edit Employee"
            description="Update employee records and compliance data."
            subject="This employee's record"
            reason="Your role is not permitted to read /branches yet, so the branch and department fields cannot be filled. See docs/backend-patches/HR_MANAGER_READ_ACCESS.md."
          />
        );
      }
    }

    throw error;
  }

  const [agentsResult, departmentResults] = await Promise.all([
    getAgents().catch(() => [] as AgentResponse[]),
    Promise.allSettled(branches.map((branch) => getDepartmentsByBranch(branch.id))),
  ]);

  const departmentsByBranch: Record<number, DepartmentResponse[]> = {};

  branches.forEach((branch, index) => {
    const result = departmentResults[index];

    departmentsByBranch[branch.id] =
      result?.status === "fulfilled" ? result.value : [];
  });

  // The employee's own department may not be in the list if their branch read
  // failed or they were moved since; the form's select falls back to "None"
  // rather than silently submitting a department from another branch.
  return (
    <>
      <PageHeader
        title={`Edit ${employee.fullName}`}
        description={`Employee ${employee.employeeNumber} — update records and compliance data.`}
      />

      <EmployeeForm
        mode="edit"
        initial={employee}
        options={{ branches, departmentsByBranch, agents: agentsResult }}
      />
    </>
  );
}
