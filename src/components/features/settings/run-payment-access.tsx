"use client";

import { useActionState } from "react";

import { setRunPaymentsAction } from "@/app/actions/user";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ActionState } from "@/types";

function ManagerRow({ manager }: { manager: RunPaymentManager }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(setRunPaymentsAction, { status: "idle" });
  const allowed = manager.canRunPayments;

  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 break-all font-mono text-sm text-on-surface">
          {manager.username}
          <StatusBadge status={allowed ? "ALLOWED" : "NOT_ALLOWED"} />
        </p>
        <p className="break-words text-xs text-on-surface-variant">{manager.branchName ?? "No branch"}</p>
      </div>
      <ConfirmForm
        action={formAction}
        confirm={allowed
          ? { title: "Take back this permission?", message: "They will no longer be able to run agent payments. They are notified.", subject: manager.username, confirmLabel: "Take back", icon: "block", danger: true }
          : { title: "Allow this manager?", message: "They can run the calculation for every agent and branch while you are away. They are notified. You still release the money.", subject: manager.username, confirmLabel: "Allow", icon: "verified_user" }}
        className="flex shrink-0 flex-col gap-1 sm:items-end"
      >
        <input type="hidden" name="userId" value={manager.id} />
        <input type="hidden" name="allowed" value={allowed ? "false" : "true"} />
        <button
          type="submit"
          disabled={pending}
          className={allowed
            ? "min-h-11 rounded-lg border border-error px-4 text-sm font-semibold text-error transition-colors hover:bg-error/5 disabled:opacity-60"
            : "min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"}
        >
          {pending ? "Saving…" : allowed ? "Take Back" : "Allow"}
        </button>
        {state.status === "error" ? <span role="alert" className="max-w-56 text-xs text-error sm:text-right">{state.message}</span> : null}
      </ConfirmForm>
    </li>
  );
}

export type RunPaymentManager = { id: number; username: string; branchName: string | null; canRunPayments: boolean };

/** Admin: which Branch Managers may run the agent payment calculation while the Admin is away. */
export function RunPaymentAccess({ managers }: { managers: RunPaymentManager[] }) {
  return (
    <BentoCard title="Who else can run this" subtitle="Allow a Branch Manager to run the calculation while you are away. Take it back at any time.">
      {managers.length === 0 ? (
        <p className="py-2 text-sm text-on-surface-variant">No Branch Manager logins yet. Set them under Users.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-outline-variant/20">
          {managers.map((manager) => <ManagerRow key={manager.id} manager={manager} />)}
        </ul>
      )}
    </BentoCard>
  );
}
