"use client";

import { useActionState } from "react";

import { cancelDamageAction } from "@/app/actions/damage";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { withToast } from "@/hooks/use-action-toast";
import type { ActionState } from "@/types";

/** Admin: cancel one damage that has not been deducted. It asks first, because it cannot be brought back. */
export function CancelDamageButton({ id, amount, description }: { id: number; amount: string; description: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(withToast(cancelDamageAction, "Damage cancelled."), { status: "idle" });

  return (
    <ConfirmForm
      action={formAction}
      confirm={{
        title: "Cancel this damage?",
        message: `${amount} will no longer be deducted. A cancelled damage cannot be brought back.`,
        subject: description,
        confirmLabel: "Cancel damage",
        cancelLabel: "Keep damage",
        icon: "cancel",
        danger: true,
      }}
      className="flex shrink-0 flex-col gap-1 sm:items-end"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg border border-error px-4 text-sm font-semibold text-error transition-colors hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Cancelling…" : "Cancel damage"}
      </button>
      {state.status === "error" ? <span role="alert" className="max-w-56 text-xs text-error sm:text-right">{state.message}</span> : null}
    </ConfirmForm>
  );
}
