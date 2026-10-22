"use client";

import { useActionState } from "react";

import { decideLeaveByManagerAction, decideLeaveFinalAction } from "@/app/actions/leave";
import type { ActionState, LeaveRequestResponse } from "@/types";

/**
 * Approve or reject one leave request. `manager` is the Branch Manager's first stage (approving
 * passes it to the Admin); `final` is the Admin's decision. Rejecting needs a reason.
 */
export function LeaveDecisionForm({
  leaveRequestId,
  stage,
}: {
  leaveRequestId: number;
  stage: "manager" | "final";
}) {
  const [state, formAction, pending] = useActionState<ActionState<LeaveRequestResponse>, FormData>(
    stage === "manager" ? decideLeaveByManagerAction : decideLeaveFinalAction,
    { status: "idle" },
  );
  const reasonError = state.status === "error" ? state.fieldErrors?.rejectionReason?.[0] : undefined;

  if (state.status === "success") {
    return (
      <span className="text-xs font-medium text-tertiary-container">
        {state.data.status === "REJECTED" ? "Rejected" : stage === "manager" ? "Passed to Admin" : "Approved"}
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="leaveRequestId" value={leaveRequestId} />
      <input
        type="text"
        name="rejectionReason"
        placeholder="Reason (needed to reject)"
        aria-label="Reason for rejecting"
        className="w-52 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {reasonError ? <span className="text-[11px] text-error">{reasonError}</span> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="rounded-lg border border-error px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/5 disabled:opacity-60"
        >
          Reject
        </button>
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {stage === "manager" ? "Approve" : "Give Final Approval"}
        </button>
      </div>
      {state.status === "error" && !reasonError ? <span role="alert" className="max-w-52 text-right text-[11px] text-error">{state.message}</span> : null}
    </form>
  );
}