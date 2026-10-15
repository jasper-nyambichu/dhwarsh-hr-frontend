"use client";

import { useActionState } from "react";

import { recoverAdvanceAction } from "@/app/actions/agent-advance";
import { BentoCard } from "@/components/shared/bento-card";
import type { ActionState } from "@/types";

/** Record a direct repayment (e.g. the agent paid cash). Normal recovery needs no action — payroll does it. */
export function RecoverAdvanceForm({ advanceId, outstanding }: { advanceId: number; outstanding: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(recoverAdvanceAction, { status: "idle" });

  return (
    <BentoCard title="Record Direct Repayment">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="advanceId" value={advanceId} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-secondary">Amount recovered (KES)</span>
          <input
            type="number"
            name="amount"
            min="0.01"
            max={outstanding}
            step="0.01"
            required
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <p className="text-xs text-on-surface-variant">Use this only when the agent repaid outside payroll. It cannot exceed the outstanding balance.</p>

        {state.status === "error" ? (
          <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
            {state.message}
          </div>
        ) : null}
        {state.status === "success" ? (
          <div role="status" className="rounded-lg border border-tertiary-container/30 bg-tertiary-container/5 p-3 text-sm text-tertiary-container">
            Repayment recorded.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Record Repayment"}
        </button>
      </form>
    </BentoCard>
  );
}