"use client";

import { useActionState } from "react";

import { ConfirmForm } from "@/components/shared/confirm-form";
import { Icon } from "@/components/ui/icon";
import type { ActionState } from "@/types";

/**
 * Delete something after asking first. The server's refusal, such as a branch that still has
 * employees, shows underneath. `compact` is the icon for a table row or list; otherwise a full button.
 */
export function ConfirmDeleteButton({
  action,
  id,
  name,
  title,
  confirmText,
  label = "Delete",
  compact = false,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  id: number;
  name: string;
  /** The pop-up's question, e.g. "Delete this employee?". */
  title: string;
  confirmText: string;
  label?: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, { status: "idle" });

  return (
    <ConfirmForm
      action={formAction}
      confirm={{ title, message: confirmText, subject: name, confirmLabel: label, danger: true }}
      className={compact ? "inline-flex shrink-0 flex-col items-end" : "flex flex-col gap-2"}
    >
      <input type="hidden" name="id" value={id} />
      {compact ? (
        <button
          type="submit"
          disabled={pending}
          aria-label={`${label} ${name}`}
          title={`${label} ${name}`}
          className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error/5 hover:text-error disabled:opacity-50"
        >
          <Icon name="delete" className="text-[18px]" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-error px-4 py-2 font-body-md text-body-md font-semibold text-on-error transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="delete" className="text-[18px]" />
          {pending ? "Deleting…" : label}
        </button>
      )}
      {state.status === "error" ? (
        <span role="alert" className={compact ? "mt-1 max-w-[220px] text-right text-[11px] text-error" : "text-sm text-error"}>
          {state.message}
        </span>
      ) : null}
    </ConfirmForm>
  );
}
