"use client";

import { useActionState, useEffect, useState } from "react";

import { ConfirmForm } from "@/components/shared/confirm-form";
import { Icon } from "@/components/ui/icon";
import type { ActionState } from "@/types";

/** What a bulk delete reports back: who went, and who the server refused and why. */
export type BulkDeleteResult = { deleted: number; refused: { name: string; reason: string }[] };

/**
 * Selecting rows of a list and deleting them together. The tick boxes are plain inputs in the table
 * (`<RowCheckbox>`), tied to this form by `formId`, so the rows can stay server-rendered. Everything here
 * is hidden when printing, and server-generated exports never include it.
 */

function boxes(formId: string): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="ids"][form="${formId}"]`));
}

/** Distinct ids that are ticked (the phone and desktop layouts each carry a box for the same row). */
function selectedIds(formId: string): Set<string> {
  return new Set(boxes(formId).filter((box) => box.checked).map((box) => box.value));
}

export function RowCheckbox({ formId, id, label }: { formId: string; id: number; label: string }) {
  return (
    <input
      type="checkbox"
      name="ids"
      value={id}
      form={formId}
      aria-label={`Select ${label}`}
      // Keep the phone and desktop copies of the same row in step.
      onChange={(event) => {
        for (const box of boxes(formId)) {
          if (box.value === String(id)) box.checked = event.currentTarget.checked;
        }
        document.dispatchEvent(new CustomEvent(`bulk-select:${formId}`));
      }}
      className="size-4 cursor-pointer rounded border-outline-variant text-primary focus:ring-primary/30 print:hidden"
    />
  );
}

export function SelectAllCheckbox({ formId, label = "Select all" }: { formId: string; label?: string }) {
  const [state, setState] = useState<"none" | "some" | "all">("none");

  useEffect(() => {
    const update = () => {
      const all = new Set(boxes(formId).map((box) => box.value));
      const chosen = selectedIds(formId);
      setState(chosen.size === 0 ? "none" : chosen.size === all.size ? "all" : "some");
    };
    document.addEventListener(`bulk-select:${formId}`, update);
    update();
    return () => document.removeEventListener(`bulk-select:${formId}`, update);
  }, [formId]);

  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={state === "all"}
      ref={(element) => {
        if (element) element.indeterminate = state === "some";
      }}
      onChange={(event) => {
        const on = event.currentTarget.checked;
        for (const box of boxes(formId)) box.checked = on;
        document.dispatchEvent(new CustomEvent(`bulk-select:${formId}`));
      }}
      className="size-4 cursor-pointer rounded border-outline-variant text-primary focus:ring-primary/30 print:hidden"
    />
  );
}

/** The bar above the list: how many are ticked, select all, and Delete selected (asks first). */
export function BulkDeleteBar({
  formId,
  action,
  noun,
  plural,
  warning,
}: {
  formId: string;
  action: (previous: ActionState<BulkDeleteResult>, formData: FormData) => Promise<ActionState<BulkDeleteResult>>;
  /** "branch" / "employee". */
  noun: string;
  plural: string;
  /** What deleting means, shown in the confirmation. */
  warning: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState<BulkDeleteResult>, FormData>(action, { status: "idle" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(selectedIds(formId).size);
    document.addEventListener(`bulk-select:${formId}`, update);
    update();
    return () => document.removeEventListener(`bulk-select:${formId}`, update);
  }, [formId]);

  // After a delete the list re-renders without the deleted rows; clear what is still ticked.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "success") setCount(0);
  }
  useEffect(() => {
    if (state.status !== "success") return;
    for (const box of boxes(formId)) box.checked = false;
    document.dispatchEvent(new CustomEvent(`bulk-select:${formId}`));
  }, [state, formId]);

  const label = `${count} ${count === 1 ? noun : plural}`;

  return (
    <div className="mb-3 flex flex-col gap-2 print:hidden">
      <ConfirmForm
        id={formId}
        action={formAction}
        confirm={{
          title: `Delete ${label}?`,
          message: warning,
          confirmLabel: "Delete",
          icon: "delete",
          danger: true,
        }}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2"
      >
        <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
          <SelectAllCheckbox formId={formId} label={`Select all ${plural}`} />
          {count === 0 ? `Select ${plural} to delete` : `${label} selected`}
        </label>
        <button
          type="submit"
          disabled={count === 0 || pending}
          className="flex min-h-10 items-center gap-1.5 rounded-lg bg-error px-4 text-sm font-semibold text-on-error transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="delete" className="text-[18px]" />
          {pending ? "Deleting…" : "Delete selected"}
        </button>
      </ConfirmForm>

      <div aria-live="polite">
        {state.status === "error" ? (
          <p role="alert" className="rounded-lg bg-error/5 px-3 py-2 text-sm text-error">{state.message}</p>
        ) : null}
        {state.status === "success" ? (
          <div className="rounded-lg bg-tertiary-container/10 px-3 py-2 text-sm text-on-surface">
            <p className="font-semibold">
              {state.data.deleted > 0 ? `Deleted ${state.data.deleted} ${state.data.deleted === 1 ? noun : plural}.` : `Nothing was deleted.`}
            </p>
            {state.data.refused.length > 0 ? (
              <ul className="mt-1 list-disc pl-5 text-error">
                {state.data.refused.map((item) => (
                  <li key={item.name}>
                    {item.name}: {item.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
