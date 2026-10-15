"use client";

import { useActionState } from "react";

import { recordAdvanceAction } from "@/app/actions/agent-advance";
import { BentoCard } from "@/components/shared/bento-card";
import { Icon } from "@/components/ui/icon";
import type { ActionState } from "@/types";

const INPUT =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary";

export function RecordAdvanceForm({
  today,
  agents,
}: {
  today: string;
  agents: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(recordAdvanceAction, { status: "idle" });

  const fieldError = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-2xl flex-col gap-gutter">
      <BentoCard title="Advance details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold text-secondary">Agent</span>
            <select name="agentId" required defaultValue="" className={INPUT}>
              <option value="" disabled>Select an agent…</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            {fieldError("agentId") ? <span className="text-xs text-error">{fieldError("agentId")}</span> : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-secondary">Amount (KES)</span>
            <input type="number" name="amount" min="0.01" step="0.01" required placeholder="e.g. 150000" className={INPUT} />
            {fieldError("amount") ? <span className="text-xs text-error">{fieldError("amount")}</span> : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-secondary">Date paid</span>
            <input type="date" name="advanceDate" defaultValue={today} required className={INPUT} />
            {fieldError("advanceDate") ? <span className="text-xs text-error">{fieldError("advanceDate")}</span> : null}
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold text-secondary">Purpose (optional)</span>
            <textarea name="purpose" rows={3} className={`${INPUT} resize-none`} placeholder="What the advance was for" />
          </label>
        </div>
      </BentoCard>

      {state.status === "error" ? (
        <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">
          {state.message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="check" className="text-[18px]" />
          {pending ? "Recording…" : "Record Advance"}
        </button>
      </div>
    </form>
  );
}