"use client";

import { useActionState } from "react";

import { deleteDepartmentAction } from "@/app/actions/department";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { Icon } from "@/components/ui/icon";
import type { ActionState } from "@/types";

/** Delete a department. The backend refuses while employees are still assigned, and says so. */
export function DeleteDepartmentButton({ id, name }: { id: number; name: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(deleteDepartmentAction, {
    status: "idle",
  });

  return (
    <ConfirmForm
      action={formAction}
      confirm={{
        title: "Delete this department?",
        message: "This is refused while employees are still assigned to it.",
        subject: name,
        confirmLabel: "Delete",
        danger: true,
      }}
      className="inline-flex flex-col items-end"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Delete ${name}`}
        className="inline-flex text-on-surface-variant transition-colors hover:text-error disabled:opacity-50"
      >
        <Icon name="delete" className="text-[18px]" />
      </button>
      {state.status === "error" ? (
        <span role="alert" className="mt-1 max-w-[220px] text-right text-[11px] text-error">{state.message}</span>
      ) : null}
    </ConfirmForm>
  );
}