import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import {
  AdvanceDecisionBar,
  LoanDecisionBar,
  PaymentDecisionBar,
} from "@/components/features/money/decision-forms";
import { AdvanceList, LoanList } from "@/components/features/money/money-lists";
import { MoneyStatusChip } from "@/components/features/money/money-status-chip";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAdvances, getLoans, getPaymentRequests } from "@/lib/api/agent-money";
import { formatDate } from "@/lib/format";
import { formatKes } from "@/lib/money-format";
import { first } from "@/lib/search-params";

const TABS = [
  { key: "payments", label: "Payments" },
  { key: "advances", label: "Advances" },
  { key: "loans", label: "Loans" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function asTab(value: string | undefined): TabKey {
  return TABS.find((tab) => tab.key === value)?.key ?? "payments";
}

function day(value: string | null): string {
  return value ? formatDate(value.slice(0, 10)) : "—";
}

/** Everything agents have asked the Administrator to decide: payment requests, advances and loans. */
export default async function MoneyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("paymentrequest:approve");

  const params = await searchParams;
  const tab = asTab(first(params.tab));

  let payments: Awaited<ReturnType<typeof getPaymentRequests>>;
  let advances: Awaited<ReturnType<typeof getAdvances>>;
  let loans: Awaited<ReturnType<typeof getLoans>>;
  try {
    [payments, advances, loans] = await Promise.all([getPaymentRequests(), getAdvances(), getLoans()]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Money requests"
        subject="The requests"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const pendingPayments = payments.filter((request) => request.status === "PENDING");
  const decidedPayments = payments.filter((request) => request.status !== "PENDING").slice(0, 8);

  // Only advances an agent asked for need a decision; the Payroll Officer's own entries are already approved.
  const pendingAdvances = advances.filter((advance) => advance.status === "PENDING");
  const decidedAdvances = advances.filter((advance) => advance.requestedByAgent && advance.status !== "PENDING").slice(0, 8);

  const pendingLoans = loans.filter((loan) => loan.status === "PENDING");
  const decidedLoans = loans.filter((loan) => loan.status !== "PENDING").slice(0, 8);

  const counts: Record<TabKey, number> = {
    payments: pendingPayments.length,
    advances: pendingAdvances.length,
    loans: pendingLoans.length,
  };

  return (
    <>
      <PageHeader
        title="Money requests"
        description="Decide the payments, advances and loans your agents have asked for. Agents are told as soon as you decide."
      />

      <nav aria-label="Request type" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <Link
              key={item.key}
              href={`/admin/money-requests?tab=${item.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
                active
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {item.label}
              {counts[item.key] > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active ? "bg-on-primary/20 text-on-primary" : "bg-error/10 text-error"
                  }`}
                >
                  {counts[item.key]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {tab === "payments" ? (
        <div className="grid gap-6">
          <BentoCard title="Waiting for your decision" subtitle={`${pendingPayments.length} payment request(s)`}>
            {pendingPayments.length === 0 ? (
              <EmptyState symbol="task_alt" title="All caught up" description="No payment requests are waiting for you." />
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {pendingPayments.map((request) => (
                  <li key={request.id} className="flex flex-col gap-3 rounded-lg border border-outline-variant/50 p-4">
                    <div>
                      <p className="text-xs text-outline">{request.agentName ?? `Agent #${request.agentId}`}</p>
                      <p className="text-xl font-bold tabular-nums text-on-surface">{formatKes(request.amount)}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{request.purpose}</p>
                      <p className="mt-1 text-xs text-outline">
                        Requested {day(request.requestedAt)} by {request.requestedByName ?? "the agent"}
                      </p>
                    </div>
                    <PaymentDecisionBar paymentRequestId={request.id} />
                  </li>
                ))}
              </ul>
            )}
          </BentoCard>

          {decidedPayments.length > 0 ? (
            <BentoCard title="Recently decided" subtitle="Latest 8">
              <ul className="flex flex-col gap-2">
                {decidedPayments.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 py-2 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-on-surface">
                        {request.agentName ?? `Agent #${request.agentId}`} · {formatKes(request.amount)}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">{request.purpose}</p>
                    </div>
                    <MoneyStatusChip status={request.status} awaitingRelease />
                  </li>
                ))}
              </ul>
            </BentoCard>
          ) : null}
        </div>
      ) : null}

      {tab === "advances" ? (
        <div className="grid gap-6">
          <BentoCard title="Waiting for your decision" subtitle={`${pendingAdvances.length} advance request(s)`}>
            {pendingAdvances.length === 0 ? (
              <EmptyState symbol="task_alt" title="All caught up" description="No advance requests are waiting for you." />
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {pendingAdvances.map((advance) => (
                  <li key={advance.id} className="flex flex-col gap-3 rounded-lg border border-outline-variant/50 p-4">
                    <div>
                      <p className="text-xs text-outline">{advance.agentName ?? `Agent #${advance.agentId}`}</p>
                      <p className="text-xl font-bold tabular-nums text-on-surface">{formatKes(advance.amount)}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{advance.purpose ?? "—"}</p>
                      <p className="mt-1 text-xs text-outline">Requested {day(advance.advanceDate)}</p>
                    </div>
                    <AdvanceDecisionBar advanceId={advance.id} />
                  </li>
                ))}
              </ul>
            )}
          </BentoCard>

          {decidedAdvances.length > 0 ? (
            <BentoCard title="Recently decided" subtitle="Latest 8 requested by agents">
              <AdvanceList advances={decidedAdvances} />
            </BentoCard>
          ) : null}
        </div>
      ) : null}

      {tab === "loans" ? (
        <div className="grid gap-6">
          <BentoCard title="Waiting for your decision" subtitle={`${pendingLoans.length} loan request(s)`}>
            {pendingLoans.length === 0 ? (
              <EmptyState symbol="task_alt" title="All caught up" description="No loan requests are waiting for you." />
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {pendingLoans.map((loan) => (
                  <li key={loan.id} className="flex flex-col gap-3 rounded-lg border border-outline-variant/50 p-4">
                    <div>
                      <p className="text-xs text-outline">{loan.employeeName ?? `Employee #${loan.employeeId}`}</p>
                      <p className="text-xl font-bold tabular-nums text-on-surface">{formatKes(loan.principalAmount)}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Repaying {formatKes(loan.installmentAmount)} a month · requested {day(loan.requestDate)}
                      </p>
                    </div>
                    <LoanDecisionBar loanId={loan.id} />
                  </li>
                ))}
              </ul>
            )}
          </BentoCard>

          {decidedLoans.length > 0 ? (
            <BentoCard title="Recently decided" subtitle="Latest 8">
              <LoanList loans={decidedLoans} />
            </BentoCard>
          ) : null}
        </div>
      ) : null}
    </>
  );
}