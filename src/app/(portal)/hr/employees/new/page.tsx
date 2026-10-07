import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getAgents } from "@/lib/api/agent";
import { getBranches } from "@/lib/api/branch";
import { getDepartmentsByBranch } from "@/lib/api/department";
import type { AgentResponse, BranchResponse, DepartmentResponse } from "@/types";

import { EmployeeForm } from "../_components/employee-form";

/**
 * Add Employee.
 *
 * The form posts to `POST /employees` through a Server Action. Everything this
 * page reads is only there to populate the dropdowns: branches (required),
 * departments per branch (filtered by branch, and the backend rejects a
 * mismatch), and agents (optional).
 *
 * HR_MANAGER is authorised for `POST /employees` — that is not in question.
 * What it needs *as well* is read access to `/branches` and `/agents`, because
 * a create call is useless if the form cannot offer a branch to choose. Those
 * two reads are granted by `docs/backend-patches/HR_MANAGER_READ_ACCESS.md`;
 * until that is applied the branch read comes back 403 and this page says so
 * rather than rendering an empty dropdown that looks like an empty company.
 */
export default async function NewEmployeePage() {
  await requirePermission("employee:write");

  let branches: BranchResponse[];

  try {
    branches = await getBranches();
  } catch (error) {
    if (error instanceof ApiError && error.isForbidden) {
      return (
        <DataUnavailable
          title="Add Employee"
          description="Create a new employee record."
          subject="The branch list"
          reason="Your role is not permitted to read /branches yet, so there is no branch to file the employee under. This is a backend permission that has been identified and is waiting to be applied — see docs/backend-patches/HR_MANAGER_READ_ACCESS.md."
        />
      );
    }

    return (
      <DataUnavailable
        title="Add Employee"
        description="Create a new employee record."
        subject="The branch list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  // Agents are optional on the form (a direct employee has none) and the
  // department read is one call per branch. Both are allowed to fail without
  // blocking the page: a missing department list narrows the user's choices,
  // whereas a missing branch list makes the form impossible.
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

  return (
    <>
      <PageHeader
        title="Add Employee"
        description="Create a new employee record."
      />

      <EmployeeForm
        mode="create"
        options={{ branches, departmentsByBranch, agents: agentsResult }}
      />
    </>
  );
}
