// src/components/features/branch/approval-queue.tsx
"use client";

import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/ui/icon";
import { initials as toInitials } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type ApprovalType = "Leave" | "Overtime" | "Advance" | "Loan" | "Expense";

export interface ApprovalRequest {
  id: string;
  employeeName: string;
  avatarUrl?: string;
  /** Overrides the name-derived fallback when there is no photo. */
  initials?: string;
  type: ApprovalType;
  /** Material Symbols ligature summarising the request, e.g. "event". */
  detailIcon: string;
  detailText: string;
  /** Relative submission label, e.g. "Submitted 2 hours ago". */
  submittedAt: string;
  highPriority?: boolean;
}

const TYPE_STYLES: Record<ApprovalType, string> = {
  Leave: "bg-amber-main/10 text-amber-main",
  Overtime: "bg-error/10 text-error",
  Advance: "bg-blue/10 text-blue",
  Loan: "bg-blue/10 text-blue",
  Expense: "bg-green-main/10 text-green-main",
};

export function ApprovalQueue({ requests }: { requests: ApprovalRequest[] }) {
  const [pending, setPending] = useState(requests);

  /**
   * Optimistic removal with an undo affordance.
   *
   * The decision is not persisted yet (no approvals endpoint), so the toast
   * says so rather than claiming the request was approved. Undo restores the
   * row in place — an approval dismissed by a mis-tap should not need a page
   * reload to get back.
   */
  function resolve(request: ApprovalRequest, decision: "approved" | "rejected") {
    const index = pending.findIndex((item) => item.id === request.id);
    setPending((prev) => prev.filter((item) => item.id !== request.id));

    toast.warning(`${request.type} ${decision} — not saved`, {
      description: `${request.employeeName}'s request left your queue, but approvals aren't connected to the backend yet.`,
      action: {
        label: "Undo",
        // Splice back at the original index so the queue keeps its order.
        onClick: () =>
          setPending((prev) => {
            if (prev.some((item) => item.id === request.id)) return prev;
            const next = [...prev];
            next.splice(Math.min(index, next.length), 0, request);
            return next;
          }),
      },
    });
  }

  if (pending.length === 0) {
    return (
      <EmptyState
        title="Queue is clear"
        description="Every request from your branch team has been actioned."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {pending.map((request) => (
        <li
          key={request.id}
          className={cn(
            "flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-ambient-1",
            request.highPriority && "border-l-4 border-error",
          )}
        >
          {request.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatars are remote and unoptimised upstream
            <img
              src={request.avatarUrl}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-xs font-bold text-on-surface-variant"
            >
              {request.initials ?? toInitials(request.employeeName)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-on-surface">{request.employeeName}</p>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                  TYPE_STYLES[request.type],
                )}
              >
                {request.type}
              </span>
              {request.highPriority ? (
                <span className="shrink-0 rounded bg-error/10 px-1.5 py-0.5 text-[10px] font-medium text-error">
                  High priority
                </span>
              ) : null}
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Icon name={request.detailIcon} className="text-[16px]" />
              <span className="min-w-0 truncate">{request.detailText}</span>
            </p>

            {request.submittedAt ? (
              <p className="mt-0.5 text-xs text-outline">{request.submittedAt}</p>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <button
              type="button"
              data-live=""
              onClick={() => resolve(request, "rejected")}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-outline-variant/50 px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low sm:flex-initial sm:py-1.5"
            >
              <Icon name="close" className="text-[18px]" />
              Reject
            </button>
            <button
              type="button"
              data-live=""
              onClick={() => resolve(request, "approved")}
              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:flex-initial sm:py-1.5"
            >
              <Icon name="check" className="text-[18px]" />
              Approve
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
