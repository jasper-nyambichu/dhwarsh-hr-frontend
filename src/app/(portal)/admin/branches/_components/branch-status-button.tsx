"use client";

import { useActionState } from "react";

import { setBranchStatusAction } from "@/app/actions/branch";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/** Admin: switch a branch between active and inactive. */
export function BranchStatusButton({ id, status }: { id: number; status: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(setBranchStatusAction, {
    status: "idle",
  });
  const activating = status !== "ACTIVE";

  return (
    <BentoCard title={activating ? "Branch is inactive" : "Deactivate branch"}>
      <p className="mb-3 text-sm text-on-surface-variant">
        {activating
          ? "An inactive branch can't receive new departments. Reactivate it to use it again."
          : "A branch can only be deactivated once it has no active employees."}
      </p>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!activating && !window.confirm("Deactivate this branch?")) event.preventDefault();
        }}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value={activating ? "ACTIVE" : "INACTIVE"} />
        <FormMessage state={state} successText={activating ? "Branch activated." : "Branch deactivated."} />
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg px-4 py-2 font-body-md text-body-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            activating
              ? "bg-primary text-on-primary hover:bg-primary-container"
              : "border border-error text-error hover:bg-error/5"
          }`}
        >
          {pending ? "Working…" : activating ? "Activate Branch" : "Deactivate Branch"}
        </button>
      </form>
    </BentoCard>
  );
}