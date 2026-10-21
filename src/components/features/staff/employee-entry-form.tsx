"use client";

import Link from "next/link";
import { useActionState } from "react";

import { addEmployeeAction, requestEmployeeAction } from "@/app/actions/staff";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, SelectField, TextField } from "@/components/shared/form-field";
import { humanizeEnum } from "@/lib/format";
import { EMPLOYMENT_TYPES, type ActionState } from "@/types";

type Option = { id: number; name: string };

/**
 * Add an employee. `direct` (Admin) creates them at once; `request` (Branch Manager, Agent)
 * sends them to an Admin for approval. A locked branch (Branch Manager) or locked agent (Agent)
 * is shown but cannot be changed — the backend enforces the same rule.
 */
export function EmployeeEntryForm({
  mode,
  branches,
  departments,
  agents,
  lockedBranch,
  lockedAgent,
  today,
  cancelHref,
}: {
  mode: "direct" | "request";
  branches: Option[];
  departments: Option[];
  agents: Option[];
  lockedBranch?: Option;
  lockedAgent?: Option;
  today: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === "direct" ? addEmployeeAction : requestEmployeeAction,
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-3xl flex-col gap-gutter">
      <BentoCard title="Personal details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField className="sm:col-span-2" label="Full name" name="fullName" required error={errors?.fullName?.[0]} />
          <TextField label="National ID" name="nationalId" error={errors?.nationalId?.[0]} />
          <SelectField label="Gender" name="gender" defaultValue="">
            <option value="">Not stated</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </SelectField>
          <TextField label="Date of birth" name="dateOfBirth" type="date" />
          <TextField label="Phone" name="phone" type="tel" />
          <TextField className="sm:col-span-2" label="Email" name="email" type="email" error={errors?.email?.[0]} />
        </div>
      </BentoCard>

      <BentoCard title="Placement">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lockedBranch ? (
            <div>
              <input type="hidden" name="branchId" value={lockedBranch.id} />
              <TextField label="Branch" name="branchLabel" value={lockedBranch.name} readOnly disabled hint="Staff are added to your own branch." />
            </div>
          ) : (
            <SelectField label="Branch" name="branchId" required defaultValue="" error={errors?.branchId?.[0]}>
              <option value="" disabled>Select a branch…</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </SelectField>
          )}

          <SelectField label="Department" name="departmentId" defaultValue="" hint="The same departments apply in every branch.">
            <option value="">Assign later</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
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
              defaultValue=""
              hint={mode === "request" ? "If you choose an agent, they are notified." : "Leave empty for staff paid directly by the company."}
            >
              <option value="">No agent — paid directly</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </SelectField>
          )}

          <TextField label="Position" name="position" />
          <SelectField label="Employment type" name="employmentType" required defaultValue="" error={errors?.employmentType?.[0]}>
            <option value="" disabled>Select…</option>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>{humanizeEnum(type)}</option>
            ))}
          </SelectField>
          <TextField label="Date hired" name="dateHired" type="date" defaultValue={today} />
        </div>
      </BentoCard>

      <BentoCard title="Payment & emergency contact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            className="sm:col-span-2"
            label="M-Pesa number"
            name="mpesaNumber"
            type="tel"
            placeholder="0712 345 678"
            error={errors?.mpesaNumber?.[0]}
            hint="Salaries are paid to this number."
          />
          <TextField label="Emergency contact name" name="emergencyContactName" />
          <TextField label="Emergency contact phone" name="emergencyContactPhone" type="tel" />
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
          {pending ? "Saving…" : mode === "direct" ? "Add Employee" : "Submit for Approval"}
        </button>
      </div>
    </form>
  );
}