import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AgentPaymentForm } from "@/components/features/settings/agent-payment-form";
import { PayModelForm } from "@/components/features/settings/pay-model-form";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getPaySettings } from "@/lib/api/pay-settings";
import { getAgentPayments } from "@/lib/api/settlement";
import { formatDateRange, formatMoney, formatNumber } from "@/lib/format";
import { first, parseDate } from "@/lib/search-params";
import type { AgentSettlementResponse } from "@/types/agent-portal";
import type { PaySettingsResponse } from "@/types/pay-model";

/** What a fresh install starts with. */
const DEFAULTS: PaySettingsResponse = {
  id: 0,
  vatRate: 16,
  defaultWorkingHoursPerDay: 8,
  overtimeMultiplier: 1.5,
  weekendDays: "SATURDAY,SUNDAY",
  payrollPeriod: "MONTHLY",
  dailyRate: 1000,
  shifMode: "PERCENT",
  shifValue: 2.75,
  nssfMode: "PERCENT",
  nssfValue: 6,
  applyHousingLevy: false,
  applyPaye: false,
  applyNita: false,
  deductionCeilingPercent: 66.67,
};

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && (error as { status: unknown }).status === 404;
}

/** The Admin's pay rates, the payment formula they feed, and each agent's calculated payments. */
export default async function PaySettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("settings:manage");

  // Coming back from locking a branch's days keeps the period that was being checked.
  const params = await searchParams;
  const periodStart = parseDate(first(params.periodStart));
  const periodEnd = parseDate(first(params.periodEnd));

  let settings: PaySettingsResponse;
  let notSetUp = false;

  try {
    settings = await getPaySettings();
  } catch (error) {
    if (!isNotFound(error)) {
      return (
        <DataUnavailable
          title="Pay rates"
          subject="The pay settings"
          reason={error instanceof ApiError ? error.message : undefined}
        />
      );
    }
    settings = DEFAULTS;
    notSetUp = true;
  }

  let payments: AgentSettlementResponse[] | null = null;
  try {
    payments = await getAgentPayments();
  } catch {
    payments = null;
  }

  return (
    <>
      <PageHeader
        title="Pay rates"
        description="The agent is paid from these rates and the days the Back Office locks, then pays their own employees."
      />

      {notSetUp ? (
        <p className="mb-4 rounded-card bg-surface-container-low p-3 text-sm text-on-surface-variant" role="status">
          Settings have not been saved yet, so the usual starting values are shown. Saving creates them.
        </p>
      ) : null}

      <PayModelForm initial={settings} />

      <div className="mt-gutter flex flex-col gap-gutter">
        <div id="calculate" className="scroll-mt-24">
          <AgentPaymentForm initialStart={periodStart} initialEnd={periodEnd} />
        </div>

        <BentoCard
          title="Agent payments"
          subtitle="Newest period first"
          action={
            <Link href="/admin/money-requests" className="text-[10px] text-primary-container hover:underline">
              Money Requests
            </Link>
          }
        >
          {payments === null ? (
            <p className="py-4 text-center font-body-md text-body-md text-outline">Agent payments could not be read.</p>
          ) : payments.length === 0 ? (
            <EmptyState symbol="payments" title="No agent payments yet" description="Calculate a period above and each agent's amount appears here." />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr>
                    {["Agent", "Period", "Staff", "Days pay", "PAYE + NSSF + NITA", "Agent fee", "VAT", "Loans + Damages", "Advances", "To agent"].map((label, index) => (
                      <th
                        key={label}
                        className={`pb-3 font-table-header text-table-header uppercase text-outline ${index === 0 ? "pl-2" : ""} ${index === 9 ? "pr-2" : ""} ${index > 1 ? "text-right" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-3 pl-2 font-semibold">{payment.agentName ?? `Agent #${payment.agentId}`}</td>
                      <td className="py-3 text-on-surface-variant">{formatDateRange(payment.periodStart, payment.periodEnd)}</td>
                      <td className="py-3 text-right tabular-nums">{formatNumber(payment.employeeCount)}</td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(payment.daysPay, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(payment.payeTotal + payment.nssfTotal + payment.nitaTotal, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(payment.agentFee, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(payment.vatAmount, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums text-error">({formatMoney(payment.loanTotal + payment.damageTotal, { showCurrency: false })})</td>
                      <td className="py-3 text-right tabular-nums text-error">({formatMoney(payment.advanceRecovered, { showCurrency: false })})</td>
                      <td className="py-3 pr-2 text-right font-semibold tabular-nums">{formatMoney(payment.amountPayable, { showCurrency: false })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </>
  );
}
