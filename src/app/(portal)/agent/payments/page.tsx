import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import {
  CancelPaymentRequestButton,
  PaymentRecordForm,
  PaymentRequestForm,
} from "@/components/features/money/agent-forms";
import { MoneyStatusChip } from "@/components/features/money/money-status-chip";
import { EmployeePaymentList } from "@/components/features/money/money-lists";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAgentEmployees, getMyEmployeePayments, getMyPaymentRequests } from "@/lib/api/agent-money";
import { formatDate } from "@/lib/format";
import { formatKes } from "@/lib/money-format";

/**
 * The agent's money flow: ask for money, see where each request stands, and — once the Accounts Office
 * has released it — record every M-Pesa payment made to an employee.
 */
export default async function AgentPaymentsPage() {
  const session = await requirePermission("paymentrequest:request");

  if (!session.agentId) {
    return <DataUnavailable title="Payments" subject="Your payments" reason="Your account is not linked to an agent." />;
  }

  let requests: Awaited<ReturnType<typeof getMyPaymentRequests>>;
  let payments: Awaited<ReturnType<typeof getMyEmployeePayments>>;
  let employees: Awaited<ReturnType<typeof getAgentEmployees>>;
  try {
    [requests, payments, employees] = await Promise.all([
      getMyPaymentRequests(),
      getMyEmployeePayments(),
      getAgentEmployees(session.agentId),
    ]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Payments"
        subject="Your payments"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const activeEmployees = employees.filter((employee) => employee.employmentStatus === "ACTIVE");

  // Payments can only be recorded against released money that is not fully paid out yet.
  const payable = requests
    .filter((request) => request.status === "RELEASED" && request.remaining > 0)
    .map((request) => ({
      id: request.id,
      label: `#${request.id} · ${request.purpose.slice(0, 40)} · ${formatKes(request.remaining)} left`,
      remaining: request.remaining,
    }));

  return (
    <>
      <PageHeader
        title="Payments"
        description="Ask for money to pay your employees. When the Accounts Office releases it, record each M-Pesa payment here."
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <PaymentRequestForm />

        {payable.length > 0 ? (
          <PaymentRecordForm requests={payable} employees={activeEmployees} />
        ) : (
          <BentoCard title="Record an M-Pesa payment" subtitle="Available once money has been released to you.">
            <EmptyState
              symbol="lock_clock"
              title="Nothing to pay out yet"
              description="When the Accounts Office releases a request, you can record the payments you make from it here."
            />
          </BentoCard>
        )}
      </div>

      <div className="mt-6 grid gap-6">
        <BentoCard title="Your requests" subtitle={`${requests.length} in total`}>
          {requests.length === 0 ? (
            <EmptyState
              symbol="request_quote"
              title="No requests yet"
              description="A request for money appears here, with each step: approved, released, and paid out."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {requests.map((request) => {
                const paidPercent = request.amount > 0 ? Math.min(100, Math.round((request.paidTotal / request.amount) * 100)) : 0;
                return (
                  <li key={request.id} className="rounded-lg border border-outline-variant/50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-lg font-bold tabular-nums text-on-surface">{formatKes(request.amount)}</p>
                        <p className="text-sm text-on-surface-variant">{request.purpose}</p>
                        <p className="mt-1 text-xs text-outline">
                          Requested {formatDate(request.requestedAt.slice(0, 10))} · #{request.id}
                        </p>
                      </div>
                      <MoneyStatusChip status={request.status} awaitingRelease />
                    </div>

                    {request.status === "REJECTED" && request.rejectionReason ? (
                      <p className="mt-3 rounded-lg bg-error/10 p-2 text-xs text-error">Reason: {request.rejectionReason}</p>
                    ) : null}

                    {request.status === "RELEASED" ? (
                      <div className="mt-3">
                        <div
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={paidPercent}
                          aria-label="Paid out so far"
                          className="h-2 w-full overflow-hidden rounded-full bg-surface-container-low"
                        >
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${paidPercent}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Paid {formatKes(request.paidTotal)} of {formatKes(request.amount)} · {request.paymentCount} payment
                          {request.paymentCount === 1 ? "" : "s"} · {formatKes(request.remaining)} left
                          {request.releaseReference ? ` · reference ${request.releaseReference}` : ""}
                        </p>
                      </div>
                    ) : null}

                    {request.status === "PENDING" ? (
                      <div className="mt-3 sm:max-w-xs">
                        <CancelPaymentRequestButton paymentRequestId={request.id} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </BentoCard>

        <BentoCard title="M-Pesa payments you recorded" subtitle={`${payments.length} in total`}>
          {payments.length === 0 ? (
            <EmptyState
              symbol="phone_android"
              title="No payments recorded"
              description="Each payment you record against released money shows here with its M-Pesa code."
            />
          ) : (
            <EmployeePaymentList payments={payments} />
          )}
        </BentoCard>
      </div>
    </>
  );
}