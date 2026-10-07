"use client";

import { useActionState, useState } from "react";

import { terminateEmployeeAction } from "@/app/actions/employee";
import { BentoCard } from "@/components/shared/bento-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionState } from "@/types";

/**
 * Terminate, behind a confirmation.
 *
 * This is the only way employment status changes, and it does not reverse:
 * `PUT /employees/{id}/terminate` sets the status to TERMINATED and there is no
 * endpoint that brings an employee back. The employee row is not deleted — it
 * stays, with its history, which is why the button says "terminate" rather than
 * "delete".
 *
 * The confirm step is a second click in place rather than `window.confirm`,
 * because a native dialog cannot say what is actually about to happen.
 */
export function TerminateEmployee({
  employeeId,
  employeeName,
}: {
  employeeId: number;
  employeeName: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    terminateEmployeeAction,
    { status: "idle" },
  );

  const [confirming, setConfirming] = useState(false);

  useActionToast(state, { success: `${employeeName} terminated` });

  return (
    <BentoCard
      title={
        <span className="flex items-center gap-2">
          <Icon name="warning" className="text-[20px] text-error" />
          Terminate
        </span>
      }
      className="border border-error/30"
    >
      {!confirming ? (
        <>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Marks this employee as terminated. Their record and history stay;
            they simply stop appearing as active staff.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            icon="block"
            onClick={() => setConfirming(true)}
          >
            Terminate employee
          </Button>
        </>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="id" value={employeeId} />

          <p className="font-body-md text-body-md font-semibold text-on-surface">
            Terminate {employeeName}?
          </p>
          <p className="mt-1 text-[11px] text-on-surface-variant">
            This cannot be undone — the API has no way to reinstate an employee.
          </p>

          {state.status === "error" ? (
            <p role="alert" className="mt-3 text-[11px] text-error">
              {state.message}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" variant="danger" icon="check">
              Yes, terminate
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </BentoCard>
  );
}
