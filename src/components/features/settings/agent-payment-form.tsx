"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { calculateAgentPaymentsAction, checkAgentPaymentPeriodAction, previewAgentPaymentsAction } from "@/app/actions/pay-settings";
import { AgentPaymentDetailView } from "@/components/features/settings/agent-payment-detail";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { DateInput } from "@/components/shared/date-input";
import { CONTROL, FormMessage, LABEL } from "@/components/shared/form-field";
import { Icon } from "@/components/ui/icon";
import { formatDateRange, formatMoney, formatNumber } from "@/lib/format";
import { buildHref } from "@/lib/search-params";
import type { ActionState } from "@/types";
import type { AgentPaymentDetail, AgentPaymentReadiness } from "@/types/agent-portal";

/** Which period a check or preview belongs to, so a slow answer for old dates is never shown for new ones. */
type Check = { period: string; result: ActionState<AgentPaymentReadiness> };
type Preview = { period: string; result: ActionState<AgentPaymentDetail[]> };

/**
 * The payroll, in two steps. First Preview: the whole calculation for the period, every agent and every employee,
 * with nothing saved, nothing deducted and nothing an agent can see. Then, once satisfied, Run payroll: a pop-up
 * asks to confirm (or go back and update first). Running moves the loans, damages and advances exactly as
 * previewed, sends each agent their invoice, and the period cannot be paid again.
 */
export function AgentPaymentForm({ initialStart = "", initialEnd = "" }: { initialStart?: string; initialEnd?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(calculateAgentPaymentsAction, {
    status: "idle",
  });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const [periodStart, setPeriodStart] = useState(initialStart);
  const [periodEnd, setPeriodEnd] = useState(initialEnd);
  const [check, setCheck] = useState<Check | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [lastState, setLastState] = useState(state);

  // A successful run clears the dates and the preview, ready for the next period.
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "success") {
      setPeriodStart("");
      setPeriodEnd("");
      setCheck(null);
      setPreview(null);
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
  const shown = period && preview?.period === period ? preview.result : null;
  const previewed = shown?.status === "success" ? shown.data : null;

  function chooseStart(next: string) {
    setPeriodStart(next);
    if (periodEnd && next > periodEnd) setPeriodEnd("");
  }

  async function runPreview() {
    if (!period) return;
    setPreviewing(true);
    const [start, end] = period.split("/");
    try {
      setPreview({ period, result: await previewAgentPaymentsAction(start, end) });
    } catch {
      setPreview({ period, result: { status: "error", message: "The preview could not be made. Try again." } });
    } finally {
      setPreviewing(false);
    }
  }

  const grandTotal = previewed?.reduce((sum, detail) => sum + detail.amountPayable, 0) ?? 0;

  return (
    <BentoCard
      title="Run the payroll"
      subtitle="Choose the period and preview it first: every employee is paid from their own salary for the days paid, and loans, damages and advances come off. Nothing is saved and agents see nothing until you run it."
    >
      <ConfirmForm
        action={formAction}
        confirm={{
          title: "Run the payroll for this period?",
          message:
            "Loans, damages and advances will be deducted exactly as previewed, each agent receives their invoice, and this period cannot be paid again. Go back if anything needs updating first.",
          subject: period ? `${formatDateRange(periodStart, periodEnd)} · ${formatMoney(grandTotal)} to agents` : undefined,
          confirmLabel: "Run payroll",
          cancelLabel: "Go back and update",
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <button data-live=""
            type="button"
            onClick={runPreview}
            disabled={!period || blocked || previewing || pending}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary px-6 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="preview" className="text-[18px]" />
            {previewing ? "Preparing the preview…" : previewed ? "Preview again" : "Preview payroll"}
          </button>
          <button
            type="submit"
            disabled={pending || blocked || !previewed || previewed.length === 0}
            title={previewed ? undefined : "Preview the payroll first"}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="play_arrow" className="text-[18px]" />
            {pending ? "Running…" : "Run payroll"}
          </button>
        </div>
        {!previewed && period && !blocked ? (
          <p className="text-xs text-on-surface-variant">Preview the payroll first; Run payroll opens once you have seen it.</p>
        ) : null}

        <div aria-live="polite">
          <FormMessage state={state} successText="Payroll run. Each agent has their invoice, and their payments wait under Money Requests for you to release." />
        </div>
      </ConfirmForm>

      {shown?.status === "error" ? (
        <p role="alert" className="mt-4 rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">{shown.message}</p>
      ) : null}

      {previewed ? (
        <section aria-labelledby="payroll-preview" className="mt-6 flex flex-col gap-gutter border-t border-outline-variant/40 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-main/10 p-3">
            <p id="payroll-preview" className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <Icon name="visibility" className="text-[18px] text-amber-main" />
              Preview only: nothing has been saved or deducted, and agents cannot see it.
            </p>
            <p className="text-sm text-on-surface">
              {formatNumber(previewed.length)} agent{previewed.length === 1 ? "" : "s"} · <strong>{formatMoney(grandTotal)}</strong> in total
            </p>
          </div>
          {previewed.map((detail) => (
            <div key={detail.agentId} className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-on-surface">{detail.agentName}</h3>
              <AgentPaymentDetailView detail={detail} preview />
            </div>
          ))}
        </section>
      ) : null}
    </BentoCard>
  );
}

function PeriodChecklist({ readiness }: { readiness: AgentPaymentReadiness }) {
  const { periodStart, periodEnd, branches, alreadyPaidAgents, ready } = readiness;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-variant/40 p-3" role="status">
      <p className="flex items-center gap-2 text-sm font-semibold text-on-surface">
        <Icon name={ready ? "check_circle" : "error"} filled className={ready ? "text-[20px] text-tertiary" : "text-[20px] text-error"} />
        {ready ? "Ready to preview" : "This period cannot be paid"}
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
