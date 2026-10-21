"use client";

import { useActionState } from "react";

import { terminateStaffAction } from "@/app/actions/staff";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/** Admin only: end an employee's employment. Asks for confirmation first. */
export function TerminateEmployeeButton({ employeeId, name }: { employeeId: number; name: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(terminateStaffAction, {
    status: "idle",
  });

  return (
    <BentoCard title="End employment">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`End ${name}'s employment? This cannot be undone from here.`)) event.preventDefault();
        }}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="employeeId" value={employeeId} />
        <FormMessage state={state} successText="Employment ended." />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-error px-4 py-2 font-body-md text-body-md font-semibold text-error transition-colors hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Working…" : "Terminate Employee"}
        </button>
      </form>
    </BentoCard>
  );
}