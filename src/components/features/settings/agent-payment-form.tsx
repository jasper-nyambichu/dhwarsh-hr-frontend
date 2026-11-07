"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { calculateAgentPaymentsAction, checkAgentPaymentPeriodAction } from "@/app/actions/pay-settings";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { DateInput } from "@/components/shared/date-input";
import { CONTROL, FormMessage, LABEL } from "@/components/shared/form-field";
import { Icon } from "@/components/ui/icon";
import { formatDateRange, formatNumber } from "@/lib/format";
import { buildHref } from "@/lib/search-params";
import type { ActionState } from "@/types";
import type { AgentPaymentReadiness } from "@/types/agent-portal";

/** Which period a check belongs to, so a slow answer for old dates is never shown for new ones. */
type Check = { period: string; result: ActionState<AgentPaymentReadiness> };

/**
 * Starts the calculation for a period. It moves real balances (loans, damages, advances) and a period
 * can only be paid once, so it asks first. As soon as both dates are chosen it shows the days each
 * branch has worked, counted from attendance. Nothing needs locking first.
 */
export function AgentPaymentForm({ initialStart = "", initialEnd = "" }: { initialStart?: string; initialEnd?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(calculateAgentPaymentsAction, {
    status: "idle",
  });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const [periodStart, setPeriodStart] = useState(initialStart);
  const [periodEnd, setPeriodEnd] = useState(initialEnd);
  const [check, setCheck] = useState<Check | null>(null);
  const [lastState, setLastState] = useState(state);

  // A successful run clears the dates, ready for the next period.
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "success") {
      setPeriodStart("");
      setPeriodEnd("");
      setCheck(null);
    }
  }

  const period = periodStart && periodEnd && periodEnd >= periodStart ? `${periodStart}/${periodEnd}` : null;

  useEffect(() => {
    if (!period) return;
    let current = true;
    const [start, end] = period.split("/");
    checkAgentPaymentPeriodAction(start, end).then(
      (result) => {
        if (current) setCheck({ period, result });
      },
      () => {
        if (current) setCheck({ period, result: { status: "error", message: "Could not check this period. Try again." } });
      },
    );
    return () => {
      current = false;
    };
  }, [period]);

  const checked = period && check?.period === period ? check.result : null;
  const readiness = checked?.status === "success" ? checked.data : null;
  const blocked = readiness !== null && !readiness.ready;

  function chooseStart(next: string) {
    setPeriodStart(next);
    if (periodEnd && next > periodEnd) setPeriodEnd("");
  }

  return (
    <BentoCard
      title="Calculate agent payments"
      subtitle="Choose the period. Days worked are counted from attendance, so you can calculate at any time. Each agent's amount then waits under Money Requests for you to release."
    >
      <ConfirmForm
        action={formAction}
        confirm={{
          title: "Calculate agent payments?",
          message: "Loans, damages and advances will be deducted, and this period cannot be paid again.",
          subject: period ? formatDateRange(periodStart, periodEnd) : undefined,
          confirmLabel: "Calculate",
          icon: "calculate",
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="payment-start">Starting date<span className="ml-0.5 text-error">*</span></label>
            <DateInput id="payment-start" name="periodStart" required value={periodStart} onChange={chooseStart} className={CONTROL} />
            {errors.periodStart?.[0] ? <p className="mt-1 text-xs text-error">{errors.periodStart[0]}</p> : null}
          </div>
          <div>
            <label className={LABEL} htmlFor="payment-end">Final date<span className="ml-0.5 text-error">*</span></label>
            <DateInput id="payment-end" name="periodEnd" required value={periodEnd} onChange={setPeriodEnd} min={periodStart || undefined} className={CONTROL} />
            {errors.periodEnd?.[0] ? <p className="mt-1 text-xs text-error">{errors.periodEnd[0]}</p> : null}
          </div>
        </div>

        {period && !checked ? (
          <p role="status" className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Icon name="progress_activity" className="animate-spin text-[18px]" />
            Checking this period…
          </p>
        ) : null}

        {checked?.status === "error" ? (
          <p role="alert" className="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">{checked.message}</p>
        ) : null}

        {readiness ? <PeriodChecklist readiness={readiness} /> : null}

        <div aria-live="polite">
          <FormMessage state={state} successText="Agent payments calculated. Release them under Money Requests." />
        </div>

        <button
          type="submit"
          disabled={pending || blocked}
          className="min-h-11 w-full rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
        >
          {pending ? "Calculating…" : "Calculate payments"}
        </button>
      </ConfirmForm>
    </BentoCard>
  );
}

function PeriodChecklist({ readiness }: { readiness: AgentPaymentReadiness }) {
  const { periodStart, periodEnd, branches, alreadyPaidAgents, ready } = readiness;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-variant/40 p-3" role="status">
      <p className="flex items-center gap-2 text-sm font-semibold text-on-surface">
        <Icon name={ready ? "check_circle" : "error"} filled className={ready ? "text-[20px] text-tertiary" : "text-[20px] text-error"} />
        {ready ? "Ready to calculate" : "Cannot calculate this period"}
      </p>

      {alreadyPaidAgents.length > 0 ? (
        <p className="rounded-lg bg-error/5 p-2 text-sm text-error">
          Already paid for part of this period: {alreadyPaidAgents.join(", ")}. Choose different dates.
        </p>
      ) : null}

      {branches.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No active agent has active employees to pay.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-outline-variant/30">
          {branches.map((branch) => (
            <li key={branch.branchId} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
              <span className="flex min-w-0 items-center gap-2">
                <Icon name="location_city" className="text-[18px] text-primary-container" />
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium text-on-surface">{branch.branchName}</span>
                  <span className="block text-xs text-on-surface-variant">
                    {formatNumber(branch.employeeCount)} employees · {formatNumber(branch.daysWorked)} days worked
                  </span>
                </span>
              </span>
              <Link
                href={buildHref("/admin/days-worked", { branchId: branch.branchId, start: periodStart, end: periodEnd, returnTo: "payments" })}
                className="flex min-h-9 items-center gap-1 rounded-lg border border-outline-variant px-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low"
              >
                Review days
                <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
