"use client";

import { useActionState, useState } from "react";

import { assignShiftAction } from "@/app/actions/shift";
import { Button } from "@/components/ui/button";
import { useActionToast } from "@/hooks/use-action-toast";
import type {
  ActionState,
  DepartmentResponse,
  EmployeeSummaryResponse,
  ShiftAssignmentResponse,
  ShiftResponse,
} from "@/types";

/**
 * Assign a shift to an employee, a department or a branch.
 *
 * `ShiftAssignmentRequest` carries three nullable target fields, exactly one of
 * which should be set. Rather than three selects — where two of them are always
 * being left blank — this uses one grouped select whose value encodes both the
 * kind of target and its id ("employee:12"), split into the three real fields
 * on submit. The payload is unchanged; only the input is.
 *
 * The backend accepts all three as null and would store an assignment to
 * nobody, so the action refuses that case.
 */
export function AssignShiftForm({
  shifts,
  departments,
  employees,
  branchId,
  branchName,
}: {
  shifts: ShiftResponse[];
  departments: DepartmentResponse[];
  employees: EmployeeSummaryResponse[];
  branchId: number;
  branchName: string;
}) {
  const [state, formAction] = useActionState<
    ActionState<ShiftAssignmentResponse>,
    FormData
  >(assignShiftAction, { status: "idle" });

  useActionToast(state, { success: "Shift assigned" });

  const [target, setTarget] = useState("");
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  const [kind, id] = target.split(":");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" ? (
        <p role="alert" className="text-[11px] text-error">
          {state.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="assignment-shift"
          className="mb-1 block font-table-header text-table-header uppercase text-outline"
        >
          Shift
        </label>
        <select
          id="assignment-shift"
          name="shiftId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
        >
          <option value="" disabled>
            Select shift
          </option>
          {shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>
              {shift.name}
            </option>
          ))}
        </select>
        {errors?.shiftId?.[0] ? (
          <p className="mt-1 text-[11px] text-error">{errors.shiftId[0]}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="assignment-target"
          className="mb-1 block font-table-header text-table-header uppercase text-outline"
        >
          Assign To
        </label>
        <select
          id="assignment-target"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          required
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
        >
          <option value="" disabled>
            Choose a target
          </option>
          <option value={`branch:${branchId}`}>
            Whole branch — {branchName}
          </option>
          <optgroup label="Departments">
            {departments.map((department) => (
              <option key={department.id} value={`department:${department.id}`}>
                {department.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Employees">
            {employees.map((employee) => (
              <option key={employee.id} value={`employee:${employee.id}`}>
                {employee.fullName}
              </option>
            ))}
          </optgroup>
        </select>
        {errors?.employeeId?.[0] ? (
          <p className="mt-1 text-[11px] text-error">{errors.employeeId[0]}</p>
        ) : null}
      </div>

      {/* Exactly one of the three is populated; the other two stay absent so the
          request carries nulls for them, which is what the DTO expects. */}
      <input
        type="hidden"
        name="employeeId"
        value={kind === "employee" ? id : ""}
      />
      <input
        type="hidden"
        name="departmentId"
        value={kind === "department" ? id : ""}
      />
      <input type="hidden" name="branchId" value={kind === "branch" ? id : ""} />

      <Button type="submit" icon="assignment_ind" className="w-fit">
        Assign shift
      </Button>
    </form>
  );
}
