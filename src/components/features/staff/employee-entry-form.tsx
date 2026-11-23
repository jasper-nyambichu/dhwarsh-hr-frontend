"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { addEmployeeAction, requestEmployeeAction, updateEmployeeAction } from "@/app/actions/staff";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, SelectField, TextField } from "@/components/shared/form-field";
import type { ActionState, EmployeeResponse } from "@/types";

type Option = { id: number; name: string };

const ACTIONS = { direct: addEmployeeAction, request: requestEmployeeAction, edit: updateEmployeeAction } as const;

const CONFIRM = {
  direct: { title: "Add this employee?", message: "They will be added to the branch you chose.", confirmLabel: "Add employee", icon: "person_add" },
  request: { title: "Submit for approval?", message: "The employee is only created once this is approved.", confirmLabel: "Submit", icon: "send" },
  edit: { title: "Save these changes?", message: "The employee's record is updated straight away.", confirmLabel: "Save changes", icon: "save" },
} as const;

const SUBMIT = { direct: "Add Employee", request: "Submit for Approval", edit: "Save Changes" } as const;

/**
 * Add or edit an employee. `direct` (Admin) creates them at once; `request` (Branch Manager, Agent)
 * sends them to an Admin for approval; `edit` (Admin) changes an existing employee's details.
 * A locked branch (Branch Manager, and every edit) or locked agent (Agent) is shown but cannot be
 * changed — the backend enforces the same rule.
 *
 * On an edit the backend replaces the whole record, so every field is filled in from `employee`, and the
 * few this form does not show (marital status, employment type) travel as hidden inputs: nothing is lost.
 */
/** The stored name as first name (first word) and last name (the rest), for editing. */
function splitName(name: string | null | undefined): { first: string; last: string } {
  const [first = "", ...rest] = (name ?? "").trim().split(/\s+/);
  return { first, last: rest.join(" ") };
}

export function EmployeeEntryForm({
  mode,
  branches,
  departments,
  agents,
  lockedBranch,
  lockedAgent,
  agentRequired = false,
  employee,
  today,
  cancelHref,
}: {
  mode: "direct" | "request" | "edit";
  branches: Option[];
  departments: Option[];
  agents: Option[];
  lockedBranch?: Option;
  lockedAgent?: Option;
  /** Everyone a Branch Manager adds is paid through an agent, so the choice cannot be left empty. */
  agentRequired?: boolean;
  /** The employee being edited (`edit` only). */
  employee?: EmployeeResponse;
  today: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(ACTIONS[mode], { status: "idle" });

  // React empties a form after each submit. When the save is refused, put back what was typed, so only the field
  // that was wrong needs correcting.
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef<FormData | null>(null);
  const submit = (formData: FormData) => {
    submitted.current = formData;
    formAction(formData);
  };
  useEffect(() => {
    const form = formRef.current;
    const data = submitted.current;
    if (state.status !== "error" || !form || !data) return;
    for (const [name, value] of data.entries()) {
      if (typeof value !== "string") continue;
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        if (field.type !== "hidden" && field.type !== "file") field.value = value;
      }
    }
  }, [state]);
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const editing = mode === "edit" && employee !== undefined;
  // What a field starts with: the employee's current value when editing, empty otherwise.
  const v = (value: string | number | null | undefined) => (editing && value !== null && value !== undefined ? String(value) : "");

  return (
    <ConfirmForm ref={formRef} action={submit} confirm={CONFIRM[mode]} className="mx-auto flex w-full max-w-3xl flex-col gap-gutter">
      {editing ? (
        <>
          <input type="hidden" name="employeeId" value={employee.id} />
          <input type="hidden" name="maritalStatus" value={v(employee.maritalStatus)} />
          <input type="hidden" name="employmentType" value={v(employee.employmentType)} />
          <input type="hidden" name="originalMpesaNumber" value={v(employee.bankAccountNumber)} />
          <input type="hidden" name="originalBankName" value={v(employee.bankName)} />
          {/* Lets the server refuse this save if someone else changed the employee after this page opened. */}
          <input type="hidden" name="version" value={v(employee.version)} />
        </>
      ) : null}

      <BentoCard title="Personal details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* First and last name only (one word each), saved together as the employee's name. */}
          <TextField
            label="First name"
            name="firstName"
            required
            maxLength={40}
            autoComplete="off"
            defaultValue={splitName(employee?.fullName).first}
            error={errors?.firstName?.[0]}
          />
          <TextField
            label="Last name"
            name="lastName"
            required
            maxLength={40}
            autoComplete="off"
            defaultValue={splitName(employee?.fullName).last}
            error={errors?.lastName?.[0]}
            hint="One name each, e.g. John and Kamau."
          />
          <TextField label="National ID" name="nationalId" defaultValue={v(employee?.nationalId)} error={errors?.nationalId?.[0]} />
          <SelectField label="Gender" name="gender" defaultValue={v(employee?.gender)}>
            <option value="">Not stated</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            {/* A value saved some other way stays selectable instead of being lost on save. */}
            {editing && employee.gender && !["Male", "Female", "Other"].includes(employee.gender) ? (
              <option value={employee.gender}>{employee.gender}</option>
            ) : null}
          </SelectField>
          {editing ? <TextField label="Date of birth" name="dateOfBirth" type="date" defaultValue={v(employee.dateOfBirth)} /> : null}
          <TextField label="Phone" name="phone" type="tel" defaultValue={v(employee?.phone)} />
          <TextField className="sm:col-span-2" label="Email" name="email" type="email" defaultValue={v(employee?.email)} error={errors?.email?.[0]} />
          {editing ? <TextField className="sm:col-span-2" label="Address" name="address" defaultValue={v(employee.address)} /> : null}
        </div>
      </BentoCard>

      <BentoCard title="Placement">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lockedBranch ? (
            <div>
              <input type="hidden" name="branchId" value={lockedBranch.id} />
              <TextField
                label="Branch"
                name="branchLabel"
                value={lockedBranch.name}
                readOnly
                disabled
                hint={editing ? "To change the branch, use Move to another branch on the employee's page." : "Staff are added to your own branch."}
              />
            </div>
          ) : (
            <SelectField label="Branch" name="branchId" required defaultValue="" error={errors?.branchId?.[0]}>
              <option value="" disabled>Select a branch…</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </SelectField>
          )}

          <SelectField label="Department" name="departmentId" defaultValue={v(employee?.departmentId)} hint="The same departments apply in every branch.">
            <option value="">{editing ? "No department" : "Assign later"}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
            {editing && employee.departmentId !== null && !departments.some((department) => department.id === employee.departmentId) ? (
              <option value={employee.departmentId}>{employee.departmentName ?? `Department #${employee.departmentId}`}</option>
            ) : null}
          </SelectField>

          {lockedAgent ? (
            <div>
              <input type="hidden" name="agentId" value={lockedAgent.id} />
              <TextField label="Agent" name="agentLabel" value={lockedAgent.name} readOnly disabled hint="Staff you add belong to your agency." />
            </div>
          ) : (
            <SelectField
              label="Agent"
              name="agentId"
              required={agentRequired}
              defaultValue={v(employee?.agentId)}
              error={errors?.agentId?.[0]}
              hint={agentRequired
                ? "They are paid through this agent, using the payment formula."
                : mode === "request" ? "If you choose an agent, they are notified." : "Leave empty for staff paid directly by the company."}
            >
              {agentRequired ? <option value="" disabled>Select an agent…</option> : <option value="">No agent — paid directly</option>}
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
              {editing && employee.agentId !== null && !agents.some((agent) => agent.id === employee.agentId) ? (
                <option value={employee.agentId}>{employee.agentName ?? `Agent #${employee.agentId}`}</option>
              ) : null}
            </SelectField>
          )}

          {editing ? <TextField label="Position" name="position" defaultValue={v(employee.position)} /> : null}
          <TextField label="Date hired" name="dateHired" type="date" defaultValue={editing ? v(employee.dateHired) : today} />
        </div>
      </BentoCard>

      <BentoCard title="Statutory details" subtitle={editing ? undefined : "Optional. Add them now or later."}>
        <div className={`grid grid-cols-1 gap-4 ${editing ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          <TextField label="SHIF number" name="shifNumber" maxLength={20} defaultValue={v(employee?.shifNumber)} error={errors?.shifNumber?.[0]} />
          <TextField label="NSSF number" name="nssfNumber" maxLength={20} defaultValue={v(employee?.nssfNumber)} error={errors?.nssfNumber?.[0]} />
          <TextField label="KRA PIN" name="kraPin" maxLength={20} defaultValue={v(employee?.kraPin)} error={errors?.kraPin?.[0]} />
          {editing ? <TextField label="NITA number" name="nitaNumber" maxLength={20} defaultValue={v(employee.nitaNumber)} error={errors?.nitaNumber?.[0]} /> : null}
        </div>
      </BentoCard>

      <BentoCard title="Payment & emergency contact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {mode !== "request" ? (
            <TextField
              className="sm:col-span-2"
              label="Basic salary (KES)"
              name="basicSalary"
              type="number"
              min="0"
              step="0.01"
              defaultValue={v(employee?.basicSalary)}
              error={errors?.basicSalary?.[0]}
              hint="Optional, and for reference only: pay is worked out from days worked."
            />
          ) : null}
          <TextField
            className="sm:col-span-2"
            label="M-Pesa number"
            name="mpesaNumber"
            type="tel"
            placeholder="0712 345 678"
            defaultValue={v(employee?.bankAccountNumber)}
            error={errors?.mpesaNumber?.[0]}
            hint="Salaries are paid to this number."
          />
          <TextField label="Emergency contact name" name="emergencyContactName" defaultValue={v(employee?.emergencyContactName)} />
          <TextField label="Emergency contact phone" name="emergencyContactPhone" type="tel" defaultValue={v(employee?.emergencyContactPhone)} />
        </div>
      </BentoCard>

      {mode === "request" ? (
        <p className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          This employee is added only after an Admin reviews and approves these details. You will be notified of the outcome.
        </p>
      ) : null}

      <FormMessage state={state} />

      <div className="flex justify-end gap-3">
        <Link href={cancelHref} className="rounded-lg border border-outline-variant px-5 py-2.5 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : SUBMIT[mode]}
        </button>
      </div>
    </ConfirmForm>
  );
}
