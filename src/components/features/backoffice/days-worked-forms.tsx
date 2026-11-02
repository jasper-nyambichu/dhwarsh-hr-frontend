"use client";

import { useActionState } from "react";

import { lockDaysWorkedAction, unlockDaysWorkedAction } from "@/app/actions/days-worked";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/** Admin: lock the period, so the agent payment calculation can use these figures. */
export function DaysWorkedLockForm({
  branchId,
  periodStart,
  periodEnd,
}: {
  branchId: number;
  periodStart: string;
  periodEnd: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(lockDaysWorkedAction, {
    status: "idle",
  });

  return (
    <ConfirmForm
      action={formAction}
      confirm={{
        title: "Lock these days?",
        message: "Agent payments will use these figures. Only an Admin can unlock them, and not once agents have been paid.",
        confirmLabel: "Lock",
        icon: "lock",
      }}
      className="flex flex-col gap-2 sm:items-end"
    >
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="periodStart" value={periodStart} />
      <input type="hidden" name="periodEnd" value={periodEnd} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Locking…" : "Lock days"}
      </button>
      <div aria-live="polite">
        <FormMessage state={state} successText="Days locked." />
      </div>
    </ConfirmForm>
  );
}

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
    <ConfirmForm
      action={formAction}
      confirm={{
        title: "Unlock this period?",
        message: "The Back Office will be able to change the days and lock them again.",
        confirmLabel: "Unlock",
        icon: "lock_open",
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
    </ConfirmForm>
  );
}