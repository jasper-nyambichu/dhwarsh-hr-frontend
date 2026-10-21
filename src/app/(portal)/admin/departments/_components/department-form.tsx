"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createDepartmentAction, updateDepartmentAction } from "@/app/actions/department";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, SelectField, TextField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";
import type { CompanyDepartment } from "@/types/staff";

/** Add or edit a company-wide department. The head can be any employee. */
export function DepartmentForm({
  mode,
  initial,
  people,
}: {
  mode: "create" | "edit";
  initial?: CompanyDepartment;
  people: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === "create" ? createDepartmentAction : updateDepartmentAction,
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-2xl flex-col gap-gutter">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <BentoCard title="Department details" subtitle="Available to every branch">
        <div className="grid grid-cols-1 gap-4">
          <TextField label="Department name" name="name" required defaultValue={initial?.name} error={errors?.name?.[0]} placeholder="e.g. Finance" />
          <SelectField label="Head of department" name="headOfDepartmentId" defaultValue={initial?.headOfDepartmentId ? String(initial.headOfDepartmentId) : ""} hint="Optional.">
            <option value="">None</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </SelectField>
        </div>
      </BentoCard>

      <FormMessage state={state} successText="Department saved." />

      <div className="flex justify-end gap-3">
        <Link href="/admin/departments" className="rounded-lg border border-outline-variant px-5 py-2.5 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low">
          Back
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Create Department" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}