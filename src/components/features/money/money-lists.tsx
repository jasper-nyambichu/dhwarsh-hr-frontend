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

/** Advances, as cards on phones and a table from tablet width up. */
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
            <p className="mt-1 text-xs text-outline">
              {advance.status === "PENDING" ? "Requested" : "Dated"} {when(advance.advanceDate)}
              {advance.status === "OUTSTANDING" || advance.status === "PARTIALLY_RECOVERED"
                ? ` · still owed ${formatKes(advance.outstandingBalance)}`
                : ""}
            </p>
            {advance.status === "REJECTED" && advance.rejectionReason ? (
              <p className="mt-2 rounded-lg bg-error/10 p-2 text-xs text-error">Reason: {advance.rejectionReason}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="data-table w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr>
              <th className={`${TH} pl-2`}>Date</th>
              <th className={TH}>Purpose</th>
              <th className={`${TH} text-right`}>Amount</th>
              <th className={`${TH} text-right`}>Still owed</th>
              <th className={`${TH} pl-4 pr-2`}>Status</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {advances.map((advance) => (
              <tr key={advance.id} className="border-b border-outline-variant/20 align-top last:border-0">
                <td className="py-3 pl-2 text-on-surface-variant">{when(advance.advanceDate)}</td>
                <td className="py-3">{advance.purpose ?? "—"}</td>
                <td className="py-3 text-right font-semibold tabular-nums">{formatKes(advance.amount)}</td>
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