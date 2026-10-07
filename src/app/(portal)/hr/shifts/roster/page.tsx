import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getDepartmentsByBranch } from "@/lib/api/department";
import { getEmployeesByBranch } from "@/lib/api/employee";
import {
  getShiftAssignmentsForBranch,
  getShifts,
} from "@/lib/api/shift";
import { formatNumber } from "@/lib/format";
import { buildHref, first, parseId } from "@/lib/search-params";
import type {
  BranchResponse,
  DepartmentResponse,
  EmployeeSummaryResponse,
  ShiftAssignmentResponse,
  ShiftResponse,
} from "@/types";

import { AssignShiftForm } from "./_components/assign-shift-form";

/**
 * The roster — who is on which shift in one branch.
 *
 * Assignments are stored against a *target*, and `ShiftAssignmentRequest` lets
 * that target be an employee, a department or a whole branch. `ShiftAssignmentResponse`
 * mirrors that: three nullable id columns, only one of which is set. The table
 * below therefore resolves whichever one is present rather than assuming a row
 * means a person.
 *
 * Scope is a required choice, not decoration: `GET /shifts/assignments/branch/{id}`
 * is per-branch and there is no company-wide assignment list, so the screen picks
 * a branch before it can read anything.
 */
export default async function ShiftRosterPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string | string[] }>;
}) {
  await requirePermission("shift:read");

  const params = await searchParams;
  const requestedBranchId = parseId(first(params.branchId));

  let branches: BranchResponse[];

  try {
    branches = await getBranches();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Shift Roster"
        description="Who is rostered onto which shift, branch by branch."
        subject="The branch list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  if (branches.length === 0) {
    return (
      <>
        <PageHeader
          title="Shift Roster"
          description="Who is rostered onto which shift, branch by branch."
        />
        <BentoCard title="No branches">
          <EmptyState
            symbol="account_tree"
            title="No branches to roster"
            description="A shift assignment is always scoped to a branch, so there is nothing to show until a branch exists."
          />
        </BentoCard>
      </>
    );
  }

  const activeBranch =
    branches.find((branch) => branch.id === requestedBranchId) ?? branches[0];

  // Everything the screen needs about the active branch, read together. The
  // assignment list is the one that matters; the other two exist to resolve its
  // ids into names, so a failure there degrades the labels, not the page.
  const [shiftsResult, assignmentsResult, departmentsResult, employeesResult] =
    await Promise.allSettled([
      getShifts(),
      getShiftAssignmentsForBranch(activeBranch.id),
      getDepartmentsByBranch(activeBranch.id),
      getEmployeesByBranch(activeBranch.id),
    ]);

  if (
    assignmentsResult.status === "rejected" &&
    assignmentsResult.reason instanceof ApiError &&
    assignmentsResult.reason.isUnauthorized
  ) {
    throw assignmentsResult.reason;
  }

  if (assignmentsResult.status === "rejected") {
    return (
      <DataUnavailable
        title="Shift Roster"
        description="Who is rostered onto which shift, branch by branch."
        subject={`The roster for ${activeBranch.name}`}
        reason={
          assignmentsResult.reason instanceof ApiError
            ? assignmentsResult.reason.message
            : undefined
        }
      />
    );
  }

  const assignments = assignmentsResult.value;
  const shifts = shiftsResult.status === "fulfilled" ? shiftsResult.value : [];
  const departments =
    departmentsResult.status === "fulfilled" ? departmentsResult.value : [];
  const employees =
    employeesResult.status === "fulfilled" ? employeesResult.value : [];

  const shiftNames = new Map(shifts.map((shift) => [shift.id, shift.name]));
  const departmentNames = new Map(
    departments.map((department) => [department.id, department.name]),
  );
  const employeeNames = new Map(
    employees.map((employee) => [employee.id, employee.fullName]),
  );

  return (
    <>
      <PageHeader
        title="Shift Roster"
        description="Who is rostered onto which shift, branch by branch."
        actions={
          <Link
            href="/hr/shifts"
            className="font-body-md text-body-md font-semibold text-primary hover:underline"
          >
            Back to shifts
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {branches.map((branch) => {
          const active = branch.id === activeBranch.id;

          return (
            <Link
              key={branch.id}
              href={buildHref("/hr/shifts/roster", { branchId: branch.id })}
              className={`rounded-full border px-3 py-1.5 font-body-md text-[12px] transition-colors ${
                active
                  ? "border-primary-container bg-primary-container/10 font-semibold text-primary"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {branch.name}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="calendar_view_week" className="text-[20px] text-primary" />
                {activeBranch.name}
              </span>
            }
            action={
              <span className="font-body-md text-[11px] text-outline">
                {formatNumber(assignments.length)}{" "}
                {assignments.length === 1 ? "assignment" : "assignments"}
              </span>
            }
          >
            {assignments.length === 0 ? (
              <EmptyState
                symbol="calendar_view_week"
                title="Nothing rostered yet"
                description="No shift has been assigned to this branch, its departments or its employees."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-md text-body-md">
                  <thead>
                    <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                      <th className="pb-3 pr-4">Shift</th>
                      <th className="pb-3 pr-4">Assigned To</th>
                      <th className="pb-3">Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => {
                      const target = describeTarget(
                        assignment,
                        { employeeNames, departmentNames },
                        activeBranch,
                      );

                      return (
                        <tr
                          key={assignment.id}
                          className="border-b border-outline-variant/25 last:border-0"
                        >
                          <td className="py-3 pr-4 font-semibold text-on-surface">
                            {assignment.shiftName ??
                              shiftNames.get(assignment.shiftId) ??
                              `Shift #${assignment.shiftId}`}
                          </td>
                          <td className="py-3 pr-4 text-on-surface-variant">
                            {target.name}
                          </td>
                          <td className="py-3">
                            <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                              {target.scope}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        <div className="lg:col-span-4">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="assignment_ind" className="text-[20px] text-primary" />
                Assign a Shift
              </span>
            }
          >
            {shifts.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                There are no shifts to assign yet.{" "}
                <Link
                  href="/hr/shifts"
                  className="font-semibold text-primary hover:underline"
                >
                  Create one first
                </Link>
                .
              </p>
            ) : (
              <AssignShiftForm
                shifts={shifts}
                departments={departments}
                employees={employees}
                branchId={activeBranch.id}
                branchName={activeBranch.name}
              />
            )}
          </BentoCard>
        </div>
      </div>
    </>
  );
}

/**
 * Which of the three target columns this row carries, and what to call it.
 *
 * A row should have exactly one; the employee branch is checked first because
 * that is the most specific assignment, but a row with more than one set is
 * reported as ambiguous rather than silently picking one.
 */
function describeTarget(
  assignment: ShiftAssignmentResponse,
  lookups: {
    employeeNames: Map<number, string>;
    departmentNames: Map<number, string>;
  },
  branch: BranchResponse,
): { name: string; scope: string } {
  const set = [
    assignment.employeeId !== null ? "employee" : null,
    assignment.departmentId !== null ? "department" : null,
    assignment.branchId !== null ? "branch" : null,
  ].filter((value): value is string => value !== null);

  if (set.length !== 1) {
    return {
      name: set.length === 0 ? "No target set" : set.join(" + "),
      scope: set.length === 0 ? "Unassigned" : "Ambiguous",
    };
  }

  if (assignment.employeeId !== null) {
    return {
      name:
        lookups.employeeNames.get(assignment.employeeId) ??
        `Employee #${assignment.employeeId}`,
      scope: "Employee",
    };
  }

  if (assignment.departmentId !== null) {
    return {
      name:
        lookups.departmentNames.get(assignment.departmentId) ??
        `Department #${assignment.departmentId}`,
      scope: "Department",
    };
  }

  return {
    name:
      assignment.branchId === branch.id
        ? branch.name
        : `Branch #${assignment.branchId}`,
    scope: "Whole branch",
  };
}
