import { MoneyStatusChip } from "@/components/features/money/money-status-chip";
import { formatDate } from "@/lib/format";
import { formatKes } from "@/lib/money-format";
import type { AdvanceItem, EmployeePaymentItem, LoanItem } from "@/types/money-flow";

const TH = "pb-3 font-table-header text-table-header uppercase text-outline";

function when(value: string | null): string {
  return value ? formatDate(value.slice(0, 10)) : "—";
}

/** Loans, as cards on phones and a table from tablet width up. */
export function LoanList({ loans }: { loans: LoanItem[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {loans.map((loan) => (
          <li key={loan.id} className="rounded-lg border border-outline-variant/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate font-semibold text-on-surface">{loan.employeeName ?? `Employee #${loan.employeeId}`}</p>
              <MoneyStatusChip status={loan.status} />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-outline">Loan</dt>
                <dd className="font-semibold tabular-nums text-on-surface">{formatKes(loan.principalAmount)}</dd>
              </div>
              <div>
                <dt className="text-outline">Monthly instalment</dt>
                <dd className="font-semibold tabular-nums text-on-surface">{formatKes(loan.installmentAmount)}</dd>
              </div>
              <div>
                <dt className="text-outline">Interest</dt>
                <dd className="text-on-surface">{loan.interestRate === null ? "Set on approval" : `${loan.interestRate}%`}</dd>
              </div>
              <div>
                <dt className="text-outline">Still to repay</dt>
                <dd className="tabular-nums text-on-surface">{formatKes(loan.outstandingBalance)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-outline">Requested {when(loan.requestDate)}</p>
          </li>
        ))}
      </ul>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="data-table w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr>
              <th className={`${TH} pl-2`}>Employee</th>
              <th className={`${TH} text-right`}>Loan</th>
              <th className={`${TH} text-right`}>Instalment</th>
              <th className={`${TH} text-right`}>Interest</th>
              <th className={`${TH} text-right`}>Still to repay</th>
              <th className={`${TH} pl-4`}>Requested</th>
              <th className={`${TH} pr-2`}>Status</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {loans.map((loan) => (
              <tr key={loan.id} className="border-b border-outline-variant/20 last:border-0">
                <td className="py-3 pl-2 font-semibold">{loan.employeeName ?? `Employee #${loan.employeeId}`}</td>
                <td className="py-3 text-right tabular-nums">{formatKes(loan.principalAmount)}</td>
                <td className="py-3 text-right tabular-nums">{formatKes(loan.installmentAmount)}</td>
                <td className="py-3 text-right text-on-surface-variant">
                  {loan.interestRate === null ? "Set on approval" : `${loan.interestRate}%`}
                </td>
                <td className="py-3 text-right tabular-nums">{formatKes(loan.outstandingBalance)}</td>
                <td className="py-3 pl-4 text-on-surface-variant">{when(loan.requestDate)}</td>
                <td className="py-3 pr-2">
                  <MoneyStatusChip status={loan.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** When an advance was approved: the decision date, or for one the Admin gave directly, the day it was given. */
function approvedOn(advance: AdvanceItem): string | null {
  if (advance.status === "PENDING" || advance.status === "REJECTED") return null;
  return advance.decidedAt ?? (advance.requestedByAgent ? null : advance.advanceDate);
}

/** How much of an advance has been taken back from agent payments so far. */
function recovered(advance: AdvanceItem): number {
  return advance.status === "PENDING" || advance.status === "REJECTED" ? 0 : Math.max(advance.amount - advance.outstandingBalance, 0);
}

/**
 * Advances, as cards on phones and a table from tablet width up: the date each was asked for, the date it was
 * approved, and what has been taken back from payments (with a minus) and is still owed.
 */
export function AdvanceList({ advances }: { advances: AdvanceItem[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {advances.map((advance) => (
          <li key={advance.id} className="rounded-lg border border-outline-variant/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-bold tabular-nums text-on-surface">{formatKes(advance.amount)}</p>
              <MoneyStatusChip status={advance.status} />
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">{advance.purpose ?? "—"}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-outline">Asked</dt>
              <dd className="text-right text-on-surface">{when(advance.advanceDate)}</dd>
              <dt className="text-outline">Approved</dt>
              <dd className="text-right text-on-surface">{approvedOn(advance) ? when(approvedOn(advance)!) : "—"}</dd>
              <dt className="text-outline">Taken back</dt>
              <dd className="text-right tabular-nums text-error">{recovered(advance) > 0 ? `− ${formatKes(recovered(advance))}` : "—"}</dd>
              <dt className="text-outline">Still owed</dt>
              <dd className="text-right tabular-nums text-on-surface">
                {advance.status === "PENDING" || advance.status === "REJECTED" ? "—" : formatKes(advance.outstandingBalance)}
              </dd>
            </dl>
            {advance.status === "REJECTED" && advance.rejectionReason ? (
              <p className="mt-2 rounded-lg bg-error/10 p-2 text-xs text-error">Reason: {advance.rejectionReason}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="data-table w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr>
              <th className={`${TH} pl-2`}>Asked</th>
              <th className={TH}>Approved</th>
              <th className={TH}>Purpose</th>
              <th className={`${TH} text-right`}>Amount</th>
              <th className={`${TH} text-right`}>Taken back</th>
              <th className={`${TH} text-right`}>Still owed</th>
              <th className={`${TH} pl-4 pr-2`}>Status</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {advances.map((advance) => (
              <tr key={advance.id} className="border-b border-outline-variant/20 align-top last:border-0">
                <td className="py-3 pl-2 text-on-surface-variant">{when(advance.advanceDate)}</td>
                <td className="py-3 text-on-surface-variant">{approvedOn(advance) ? when(approvedOn(advance)!) : "—"}</td>
                <td className="py-3">{advance.purpose ?? "—"}</td>
                <td className="py-3 text-right font-semibold tabular-nums">{formatKes(advance.amount)}</td>
                <td className="py-3 text-right tabular-nums text-error">{recovered(advance) > 0 ? `− ${formatKes(recovered(advance))}` : "—"}</td>
                <td className="py-3 text-right tabular-nums text-on-surface-variant">
                  {advance.status === "PENDING" || advance.status === "REJECTED" ? "—" : formatKes(advance.outstandingBalance)}
                </td>
                <td className="py-3 pl-4 pr-2">
                  <MoneyStatusChip status={advance.status} />
                  {advance.status === "REJECTED" && advance.rejectionReason ? (
                    <span className="mt-1 block max-w-xs text-xs text-error">Reason: {advance.rejectionReason}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** The M-Pesa payments an agent has recorded. */
export function EmployeePaymentList({ payments }: { payments: EmployeePaymentItem[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {payments.map((payment) => (
          <li key={payment.id} className="rounded-lg border border-outline-variant/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate font-semibold text-on-surface">
                {payment.employeeName ?? `Employee #${payment.employeeId}`}
              </p>
              <p className="shrink-0 font-bold tabular-nums text-on-surface">{formatKes(payment.amount)}</p>
            </div>
            <p className="mt-1 font-mono text-xs text-on-surface-variant">{payment.mpesaCode}</p>
            <p className="mt-1 text-xs text-outline">
              Paid {when(payment.paidOn)} · from request #{payment.paymentRequestId}
            </p>
            {payment.note ? <p className="mt-1 text-xs text-on-surface-variant">{payment.note}</p> : null}
          </li>
        ))}
      </ul>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="data-table w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr>
              <th className={`${TH} pl-2`}>Employee</th>
              <th className={`${TH} text-right`}>Amount</th>
              <th className={`${TH} pl-4`}>M-Pesa code</th>
              <th className={TH}>Paid on</th>
              <th className={`${TH} pr-2`}>Request</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-outline-variant/20 last:border-0">
                <td className="py-3 pl-2">
                  <span className="block font-semibold">{payment.employeeName ?? `Employee #${payment.employeeId}`}</span>
                  <span className="block font-mono text-[11px] text-outline">{payment.employeeNumber ?? ""}</span>
                </td>
                <td className="py-3 text-right font-semibold tabular-nums">{formatKes(payment.amount)}</td>
                <td className="py-3 pl-4 font-mono text-sm">{payment.mpesaCode}</td>
                <td className="py-3 text-on-surface-variant">{when(payment.paidOn)}</td>
                <td className="py-3 pr-2 text-on-surface-variant">#{payment.paymentRequestId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}