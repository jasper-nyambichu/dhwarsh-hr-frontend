"use client";

import { useActionState, useState } from "react";

import {
  approveEmployeeRequestAction,
  rejectEmployeeRequestAction,
} from "@/app/actions/employee-request";
import { Icon } from "@/components/ui/icon";
import { refreshNotifications } from "@/lib/notification-events";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";
import type { EmployeeCreationRequestResponse } from "@/types/employee-request";

const INITIAL: ActionState<EmployeeCreationRequestResponse> = { status: "idle" };

/**
 * Approve / reject controls for a pending employee creation request.
 * Client Component — uses useActionState for both forms.
 */
export function RequestReviewPanel({
  requestId,
  fullName,
}: {
  requestId: number;
  fullName: string;
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveEmployeeRequestAction,
    INITIAL,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectEmployeeRequestAction,
    INITIAL,
  );

  const [showReject, setShowReject] = useState(false);

  // Fire the bell refresh after a successful decision.
  if (approveState.status === "success" || rejectState.status === "success") {
    refreshNotifications();
  }

  const busy = approvePending || rejectPending;

  return (
    <div className="flex flex-col gap-3">
      {/* Approve */}
      <form action={approveAction}>
        <input type="hidden" name="id" value={requestId} />
        <button
          type="submit"
          disabled={busy}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary px-4 py-2.5 font-body-md text-body-md font-semibold text-on-tertiary transition-opacity",
            busy && "opacity-50",
          )}
        >
          <Icon name="check_circle" className="text-[18px]" />
          {approvePending ? "Approving…" : `Approve — create ${fullName}`}
        </button>
        {approveState.status === "error" && (
          <p className="mt-1.5 text-[11px] text-error">{approveState.message}</p>
        )}
      </form>

      {/* Reject toggle */}
      {!showReject ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setShowReject(true)}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-error/40 px-4 py-2.5 font-body-md text-body-md font-semibold text-error transition-colors hover:bg-error-container/30",
            busy && "opacity-50",
          )}
        >
          <Icon name="cancel" className="text-[18px]" />
          Reject request
        </button>
      ) : (
        <form action={rejectAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={requestId} />
          <label className="font-table-header text-table-header uppercase text-outline">
            Reason for rejection
          </label>
          <textarea
            name="reason"
            rows={3}
            required
            maxLength={500}
            placeholder="Explain why this request is being rejected…"
            className="w-full resize-none rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-error/40"
          />
          {rejectState.status === "error" && (
            <p className="text-[11px] text-error">
              {rejectState.fieldErrors?.reason?.[0] ?? rejectState.message}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowReject(false)}
              className="flex-1 rounded-xl border border-outline-variant/40 px-4 py-2 font-body-md text-body-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectPending}
              className={cn(
                "flex-1 rounded-xl bg-error px-4 py-2 font-body-md text-body-md font-semibold text-on-error transition-opacity",
                rejectPending && "opacity-50",
              )}
            >
              {rejectPending ? "Rejecting…" : "Confirm rejection"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
