"use client";

import { useActionState } from "react";

import { deactivateAgentAction } from "@/app/actions/agent";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { withToast } from "@/hooks/use-action-toast";
import type { ActionState } from "@/types";

/** Admin: marks an agent inactive and ends their sign-in. The button goes on success, so the toast is its only feedback. */
export function DeactivateAgentButton({ id, name }: { id: number; name: string }) {
  const [, formAction, pending] = useActionState<ActionState, FormData>(
    withToast(deactivateAgentAction, `${name} deactivated.`),
    { status: "idle" },
  );

  return (
    <ConfirmForm
      action={formAction}
      confirm={{
        title: "Deactivate this agent?",
        message: "They will be marked inactive and will no longer be able to sign in to the Agent Portal.",
        subject: name,
        confirmLabel: "Deactivate",
        icon: "block",
        danger: true,
      }}
      className="flex-1"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-error px-4 py-2 text-center font-bold text-body-md text-error transition-colors hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Deactivating…" : "Deactivate"}
      </button>
    </ConfirmForm>
  );
}
