"use client";

import { useActionState, useState } from "react";

import { linkUserEmployeeAction } from "@/app/actions/user";
import { FormMessage, SelectField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/**
 * Links a Branch Manager or Back Office login to the employee record of the person behind it. They may also
 * work and clock in as an employee, so the branch PC then marks them ("Branch Manager") in its lists and lets
 * them sign in there with the fingerprint they clock in with, instead of typing the password.
 */
export function LinkEmployeeForm({
  userId,
  roleTitle,
  linkedEmployeeId,
  employees,
}: {
  userId: number;
  /** "Branch Manager" or "Back Office". */
  roleTitle: string;
  linkedEmployeeId: number | null;
  /** Active employees of this branch. Null when they could not be read. */
  employees: { id: number; name: string; number: string | null }[] | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(linkUserEmployeeAction, { status: "idle" });
  const [selected, setSelected] = useState(linkedEmployeeId === null ? "" : String(linkedEmployeeId));
  const linked = employees?.find((person) => person.id === linkedEmployeeId) ?? null;
  const unchanged = selected === (linkedEmployeeId === null ? "" : String(linkedEmployeeId));

  return (
    <div className="mt-4 border-t border-outline-variant/40 pt-4">
      <p className="text-sm font-semibold text-on-surface">Fingerprint sign-in</p>
      <p className="mt-0.5 text-xs text-on-surface-variant">
        {linked
          ? `Linked to ${linked.name}. On this branch's PC they sign in with their fingerprint and show as the ${roleTitle}.`
          : `Choose the employee record of this ${roleTitle}. They can then sign in on the branch PC with their fingerprint, and show as the ${roleTitle} in its lists.`}
      </p>

      {employees === null ? (
        <p className="mt-3 text-sm text-on-surface-variant">This branch&apos;s employees could not be read.</p>
      ) : (
        <form action={formAction} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="userId" value={userId} />
          <SelectField
            label="Employee record"
            name={`employeeId-${userId}`}
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="">Not linked</option>
            {employees.map((person) => (
              <option key={person.id} value={person.id}>
                {person.number ? `${person.name} (${person.number})` : person.name}
              </option>
            ))}
          </SelectField>
          <FormMessage state={state} successText={selected === "" ? "Unlinked." : "Linked. The branch PC picks this up within a few minutes."} />
          <button
            type="submit"
            disabled={pending || unchanged}
            className="min-h-11 rounded-lg border border-primary px-6 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
          >
            {pending ? "Saving…" : selected === "" && linkedEmployeeId !== null ? "Unlink" : "Save link"}
          </button>
        </form>
      )}
    </div>
  );
}
