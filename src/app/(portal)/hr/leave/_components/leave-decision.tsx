"use client";

import { useActionState, useState } from "react";

import { decideLeaveAction } from "@/app/actions/leave";
import { Button } from "@/components/ui/button";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionState, LeaveRequestResponse } from "@/types";

/**
 * Approve / reject, one row at a time.
 *
 * Both outcomes go through the same endpoint — `approve-by-hr` with
 * `approved: false` is the rejection. The form only reveals the reason box once
 * the user has chosen to reject, because the backend does not require a reason
 * and a permanently-visible optional field invites people to leave it blank.
 *
 * The reason is required *here* even though the API allows it to be omitted: a
 * rejection with no reason leaves the employee with a status change and no
 * explanation, and there is nowhere else in the product they would find one.
 */
export function LeaveDecision({
  request,
}: {
  request: LeaveRequestResponse;
}) {
  const [state, formAction] = useActionState<ActionState<LeaveRequestResponse>, FormData>(
    decideLeaveAction,
    { status: "idle" },
  );

  const [rejecting, setRejecting] = useState(false);

  useActionToast(state, {
    success:
      state.status === "success"
        ? `${request.employeeName ?? "Request"} ${state.data.status === "APPROVED" ? "approved" : "rejected"}`
        : undefined,
  });

  if (state.status === "success") {
    return (
      <span className="font-body-md text-[11px] font-semibold text-tertiary">
        {state.data.status === "APPROVED" ? "Approved" : "Rejected"}
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="leaveRequestId" value={request.id} />
      <input
        type="hidden"
        name="decision"
        value={rejecting ? "reject" : "approve"}
      />

      {state.status === "error" ? (
        <p role="alert" className="text-right text-[11px] text-error">
          {state.message}
        </p>
      ) : null}

      {rejecting ? (
        <>
          <textarea
            name="rejectionReason"
            rows={2}
            required
            placeholder="Why is this being rejected?"
            className="w-56 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-[12px] text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="danger">
              Confirm rejection
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRejecting(false)}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="primary" icon="check">
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRejecting(true)}
          >
            Reject
          </Button>
        </div>
      )}
    </form>
  );
}
