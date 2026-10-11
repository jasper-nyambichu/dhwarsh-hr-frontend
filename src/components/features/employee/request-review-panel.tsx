"use client";

import { useActionState, useState } from "react";

import {
  approveEmployeeRequestAction,
  rejectEmployeeRequestAction,
} from "@/app/actions/employee-request";
import { Button, SubmitButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useActionToast } from "@/hooks/use-action-toast";
import { refreshNotifications } from "@/lib/notification-events";
import type { ActionState } from "@/types";
import type { EmployeeCreationRequestResponse } from "@/types/employee-request";

type RequestState = ActionState<EmployeeCreationRequestResponse>;

/**
 * Approve / reject for one pending request.
 *
 * Approving is the consequential one — it creates the employee — so it is a
 * single, clearly labelled button and the page above it has already shown every
 * value. Rejecting asks for a reason first, because HR reads that text next to
 * the rejected request and a blank one tells them nothing.
 *
 * On success the Server Action revalidates this route, so the page re-renders
 * with the request no longer PENDING and this panel disappears.
 */
export function RequestReviewPanel({
  requestId,
  fullName,
}: {
  requestId: number;
  fullName: string;
}) {
  const [rejecting, setRejecting] = useState(false);

  // A decision clears this request's notification for every admin, so the bell
  // is told to re-fetch the moment the action returns. It is done here, in the
  // action wrapper, rather than in an effect: once the request is decided the
  // page re-renders without this panel, and an effect on an unmounting
  // component may never run.
  const [approveState, approveAction] = useActionState<RequestState, FormData>(
    async (previous, formData) => {
      const result = await approveEmployeeRequestAction(previous, formData);
      if (result.status === "success") refreshNotifications();
      return result;
    },
    { status: "idle" },
  );
  const [rejectState, rejectAction] = useActionState<RequestState, FormData>(
    async (previous, formData) => {
      const result = await rejectEmployeeRequestAction(previous, formData);
      if (result.status === "success") refreshNotifications();
      return result;
    },
    { status: "idle" },
  );

  useActionToast(approveState, {
    success: () => `${fullName} approved — employee created`,
  });
  useActionToast(rejectState, { success: `${fullName}'s request rejected` });

  const reasonError =
    rejectState.status === "error" ? rejectState.fieldErrors?.reason?.[0] : undefined;

  return (
    <div className="flex flex-col gap-3">
      {approveState.status === "error" ? (
        <p
          role="alert"
          className="rounded-lg border border-error/40 bg-error/5 px-3 py-2 font-body-md text-body-md text-error"
        >
          {approveState.message}
        </p>
      ) : null}

      <form action={approveAction}>
        <input type="hidden" name="id" value={requestId} />
        <SubmitButton
          variant="primary"
          size="lg"
          block
          icon="check"
          loadingText="Creating employee…"
        >
          Approve &amp; create employee
        </SubmitButton>
      </form>

      {rejecting ? (
        <form action={rejectAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={requestId} />

          <label
            htmlFor="reject-reason"
            className="text-xs font-semibold text-on-surface"
          >
            Reason for rejecting <span className="text-error">*</span>
          </label>
          <textarea
            id="reject-reason"
            name="reason"
            rows={3}
            maxLength={500}
            required
            autoFocus
            placeholder="e.g. KRA PIN is missing — please add it and resubmit."
            aria-invalid={reasonError ? true : undefined}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {reasonError ? (
            <p className="text-[11px] text-error">{reasonError}</p>
          ) : rejectState.status === "error" ? (
            <p role="alert" className="text-[11px] text-error">
              {rejectState.message}
            </p>
          ) : (
            <p className="text-[10px] text-outline">
              HR sees this next to the rejected request.
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => setRejecting(false)}
            >
              Back
            </Button>
            <SubmitButton
              variant="danger"
              size="md"
              className="flex-1"
              icon="close"
              loadingText="Rejecting…"
            >
              Confirm reject
            </SubmitButton>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="lg"
          block
          onClick={() => setRejecting(true)}
        >
          <Icon name="close" className="text-[18px]" />
          Reject…
        </Button>
      )}
    </div>
  );
}