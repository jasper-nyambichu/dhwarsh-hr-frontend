"use client";

import { useActionState } from "react";

import { unlockDaysWorkedAction } from "@/app/actions/days-worked";
import { FormMessage } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/** Admin only: reopen a locked period so it can be corrected and locked again. */
export function DaysWorkedUnlockForm({
  branchId,
  periodStart,
  periodEnd,
}: {
  branchId: number;
  periodStart: string;
  periodEnd: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(unlockDaysWorkedAction, {
    status: "idle",
  });

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Unlock this period? The Back Office will be able to change the days and lock them again.")) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-2 sm:items-end"
    >
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="periodStart" value={periodStart} />
      <input type="hidden" name="periodEnd" value={periodEnd} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Unlocking…" : "Unlock period"}
      </button>
      <div aria-live="polite">
        <FormMessage state={state} successText="Period unlocked." />
      </div>
    </form>
  );
}