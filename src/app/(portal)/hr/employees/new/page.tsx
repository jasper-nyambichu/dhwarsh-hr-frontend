import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requireRole } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getAgents } from "@/lib/api/agent";
import { getBranches } from "@/lib/api/branch";
import { getDepartmentsByBranch } from "@/lib/api/department";
import type { AgentResponse, BranchResponse, DepartmentResponse } from "@/types";

import { EmployeeForm } from "../_components/employee-form";

/**
 * Add Employee — submits a request, it does not create the employee.
 *
 * The form posts to `POST /employee-requests` through a Server Action. An
 * Admin approves the request and approval is what creates the employee, so
 * HR_MANAGER can no longer call `POST /employees` (and the page is HR-only).
 *
 * Everything this page reads is only there to populate the dropdowns: branches
 * (required), departments per branch (filtered by branch, and the backend
 * rejects a mismatch), and agents (optional).
 *
 * HR_MANAGER also needs read access to `GET /branches` and `GET /agents`,
 * because a request is useless if the form cannot offer a branch to choose.
 * Until the backend grants those two reads, the branch call comes back 403 and
 * this page says so rather than rendering an empty dropdown that looks like an
 * empty company.
 */
export default async function NewEmployeePage() {
  await requireRole(["HR_MANAGER"]);

  let branches: BranchResponse[];

  try {
    branches = await getBranches();
  } catch (error) {
    if (error instanceof ApiError && error.isForbidden) {
      return (
        <DataUnavailable
          title="Add Employee"
          description="Request a new employee record."
          subject="The branch list"
          reason="Your role is not permitted to read /branches yet, so there is no branch to file the employee under. The backend needs to allow HR_MANAGER on GET /branches (and GET /agents) — see docs/backend-patches/HR_MANAGER_READ_ACCESS.md."
        />
      );
    }

    return (
      <DataUnavailable
        title="Add Employee"
        description="Request a new employee record."
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
        description="Fill in the employee's details and send them to an admin for approval."
        actions={
          <Link
            href="/hr/employees/requests"
            className={buttonVariants({ variant: "outline", className: "w-fit" })}
          >
            <Icon name="pending_actions" className="text-[18px]" />
            My requests
          </Link>
        }
      />

      <EmployeeForm
        mode="request"
        options={{ branches, departmentsByBranch, agents: agentsResult }}
      />
    </>
  );
}