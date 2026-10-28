import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { ReleaseForm } from "@/components/features/money/decision-forms";
import { MoneyStatusChip } from "@/components/features/money/money-status-chip";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getPaymentRequests } from "@/lib/api/agent-money";
import { formatDate } from "@/lib/format";
import { formatKes } from "@/lib/money-format";

function day(value: string | null): string {
  return value ? formatDate(value.slice(0, 10)) : "—";
}

/** The Accounts Office releases the money for payment requests the Administrator has approved. */
export default async function FinanceReleasesPage() {
  await requirePermission("paymentrequest:release");

  let requests: Awaited<ReturnType<typeof getPaymentRequests>>;
  try {
    requests = await getPaymentRequests();
  } catch (error) {
    return (
      <DataUnavailable
        title="Releases"
        subject="The payment requests"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const toRelease = requests.filter((request) => request.status === "APPROVED");
  const released = requests.filter((request) => request.status === "RELEASED").slice(0, 10);
  const awaitingTotal = toRelease.reduce((sum, request) => sum + request.amount, 0);

  return (
    <>
      <PageHeader
        title="Releases"
        description="Send the money for requests the Administrator approved, then record how you sent it. The agent is told straight away."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-xl">
        <div className="rounded-card bg-surface-container-lowest p-4 shadow-ambient-1">
          <p className="text-xs text-outline">Waiting to be released</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-on-surface">{formatKes(awaitingTotal)}</p>
        </div>
        <div className="rounded-card bg-surface-container-lowest p-4 shadow-ambient-1">
          <p className="text-xs text-outline">Requests to release</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-on-surface">{toRelease.length}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <BentoCard title="To release" subtitle="Approved by the Administrator">
          {toRelease.length === 0 ? (
            <EmptyState symbol="task_alt" title="Nothing to release" description="Approved payment requests appear here for you to release." />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {toRelease.map((request) => (
                <li key={request.id} className="flex flex-col gap-3 rounded-lg border border-outline-variant/50 p-4">
                  <div>
                    <p className="text-xs text-outline">{request.agentName ?? `Agent #${request.agentId}`} · #{request.id}</p>
                    <p className="text-xl font-bold tabular-nums text-on-surface">{formatKes(request.amount)}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{request.purpose}</p>
                    <p className="mt-1 text-xs text-outline">
                      Approved {day(request.decidedAt)} by {request.decidedByName ?? "the Administrator"}
                    </p>
                  </div>
                  <ReleaseForm paymentRequestId={request.id} />
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        {released.length > 0 ? (
          <BentoCard title="Recently released" subtitle="Latest 10, with how much the agent has paid out so far">
            <ul className="flex flex-col gap-3">
              {released.map((request) => {
                const paidPercent = request.amount > 0 ? Math.min(100, Math.round((request.paidTotal / request.amount) * 100)) : 0;
                return (
                  <li key={request.id} className="rounded-lg border border-outline-variant/50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {request.agentName ?? `Agent #${request.agentId}`} · {formatKes(request.amount)}
                        </p>
                        <p className="truncate text-xs text-on-surface-variant">{request.purpose}</p>
                      </div>
                      <MoneyStatusChip status={request.status} />
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={paidPercent}
                      aria-label="Paid out by the agent"
                      className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-low"
                    >
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${paidPercent}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Paid out {formatKes(request.paidTotal)} · {formatKes(request.remaining)} left · released {day(request.releasedAt)}
                      {request.releaseReference ? ` · ref ${request.releaseReference}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          </BentoCard>
        ) : null}
      </div>
    </>
  );
}