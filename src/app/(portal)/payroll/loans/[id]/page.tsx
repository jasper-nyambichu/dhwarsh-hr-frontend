import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";
import type { Loan } from "@/types";

/**
 * Loan detail — repayment schedule.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Loan`, plus a synthetic
 * instalment schedule the detail view needs (not on the DTO — the backend
 * would need to expose `LoanRepayment[]` per loan, or compute this
 * client-side from principal/installmentAmount/duration). Swap for
 * `await api.get<Loan>(`/loans/${id}`)` when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

const LOAN: Loan & { durationMonths: number; startLabel: string; endLabel: string } = {
  id: 1,
  employeeId: 1,
  employeeName: "Amina Yusuf",
  principalAmount: 150_000,
  interestRate: 0,
  installmentAmount: 12_500,
  outstandingBalance: 85_000,
  requestDate: null,
  approvalDate: null,
  status: "ACTIVE",
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
  durationMonths: 12,
  startLabel: "Jan 2023",
  endLabel: "Dec 2023",
};

type ScheduleRow = { instalment: number; dueDate: string; amount: number; paid: number | null; balance: number; status: "PAID" | "CURRENT" | "PENDING" };

const SCHEDULE: readonly ScheduleRow[] = [
  { instalment: 7, dueDate: "Jul 01, 2023", amount: 12_500, paid: 12_500, balance: 62_500, status: "PAID" },
  { instalment: 8, dueDate: "Aug 01, 2023", amount: 12_500, paid: 12_500, balance: 50_000, status: "CURRENT" },
  { instalment: 9, dueDate: "Sep 01, 2023", amount: 12_500, paid: null, balance: 37_500, status: "PENDING" },
  { instalment: 10, dueDate: "Oct 01, 2023", amount: 12_500, paid: null, balance: 25_000, status: "PENDING" },
  { instalment: 11, dueDate: "Nov 01, 2023", amount: 12_500, paid: null, balance: 12_500, status: "PENDING" },
  { instalment: 12, dueDate: "Dec 01, 2023", amount: 12_500, paid: null, balance: 0, status: "PENDING" },
];

const PAID_COUNT = 8;

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("loan:read");
  const { id } = await params;
  const loan = LOAN; // TODO: fetch by `id` once the endpoint exists

  const pct = Math.round((PAID_COUNT / loan.durationMonths) * 1000) / 10;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link href="/payroll/loans" className="text-on-surface-variant hover:text-primary">
              <Icon name="arrow_back_ios_new" />
            </Link>
            <span>
              <span className="block">{loan.employeeName}</span>
              <span className="block text-sm font-medium text-on-surface-variant">Loan Detail</span>
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard title={null}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Repayment Progress</h2>
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed">
                {loan.status.charAt(0) + loan.status.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="mb-2 flex items-end justify-between">
              <span className="font-body-md text-sm font-medium text-on-surface-variant">
                {PAID_COUNT} of {loan.durationMonths} instalments paid
              </span>
              <span className="font-bold text-primary">{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div className="h-full rounded-full bg-primary-container" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-body-md text-xs text-outline">
              <span>Start: {loan.startLabel}</span>
              <span>End: {loan.endLabel}</span>
            </div>
          </BentoCard>

          <BentoCard title="Repayment Schedule">
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="py-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Instalment #</th>
                    <th className="py-3 font-table-header text-table-header uppercase text-on-surface-variant">Due Date</th>
                    <th className="py-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Amount (KES)</th>
                    <th className="py-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Paid (KES)</th>
                    <th className="py-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Balance (KES)</th>
                    <th className="py-3 pr-2 text-center font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {SCHEDULE.map((row) => (
                    <tr key={row.instalment} className={row.status === "CURRENT" ? "bg-surface-bright" : undefined}>
                      <td className={`py-3 pl-2 font-medium ${row.status === "CURRENT" ? "font-bold text-primary" : row.status === "PENDING" ? "text-on-surface-variant" : ""}`}>
                        Instalment {row.instalment}
                      </td>
                      <td className={`py-3 ${row.status === "CURRENT" ? "font-medium text-primary" : "text-on-surface-variant"}`}>{row.dueDate}</td>
                      <td className={`py-3 text-right font-medium tabular-nums ${row.status === "CURRENT" ? "font-bold text-primary" : "text-on-surface-variant"}`}>
                        {formatMoney(row.amount, { showCurrency: false })}
                      </td>
                      <td className="py-3 text-right tabular-nums text-tertiary">
                        {row.paid !== null ? formatMoney(row.paid, { showCurrency: false }) : <span className="text-outline">-</span>}
                      </td>
                      <td className={`py-3 text-right tabular-nums ${row.status === "CURRENT" ? "font-bold text-primary" : "text-on-surface-variant"}`}>
                        {formatMoney(row.balance, { showCurrency: false })}
                      </td>
                      <td className="py-3 pr-2 text-center">
                        {row.status === "PENDING" ? (
                          <span className="inline-flex rounded bg-surface-container px-2 py-1 text-[10px] font-semibold text-on-surface-variant">
                            PENDING
                          </span>
                        ) : (
                          <span
                            className={
                              row.status === "CURRENT"
                                ? "inline-flex size-6 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-sm ring-2 ring-surface-container-lowest"
                                : "inline-flex size-6 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed"
                            }
                          >
                            <Icon name="check" className="text-[14px]" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title={null} className="relative overflow-hidden">
            <p className="mb-1 font-body-md text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Outstanding Balance
            </p>
            <h3 className="mb-4 font-card-stat text-card-stat text-primary-container">
              {formatMoney(loan.outstandingBalance)}
            </h3>
            <p className="flex items-center gap-2 text-sm text-tertiary">
              <Icon name="arrow_downward" className="text-[16px]" />
              On track to clear by {loan.endLabel}
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg bg-on-primary-fixed-variant py-2 text-sm font-bold text-surface-container-lowest transition-colors hover:bg-primary"
              >
                Settle Early
              </button>
              <button
                type="button"
                className="flex-none rounded-lg bg-blue-soft p-2 text-primary-container transition-colors hover:bg-secondary-fixed"
              >
                <Icon name="more_horiz" />
              </button>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="description" className="text-[20px] text-primary-container" />
                Loan Terms
              </span>
            }
          >
            <ul className="flex flex-col gap-4">
              <li className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <span className="text-on-surface-variant">Principal Amount</span>
                <span className="font-semibold text-on-surface">{formatMoney(loan.principalAmount)}</span>
              </li>
              <li className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <span className="text-on-surface-variant">Interest Rate</span>
                <span className="rounded bg-tertiary-fixed/30 px-2 py-0.5 text-xs font-semibold text-tertiary">
                  {loan.interestRate === 0 ? "0% - Interest Free" : `${loan.interestRate}%`}
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <span className="text-on-surface-variant">Monthly Deduction</span>
                <span className="font-semibold text-on-surface">{formatMoney(loan.installmentAmount)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-on-surface-variant">Duration</span>
                <span className="font-semibold text-on-surface">{loan.durationMonths} Months</span>
              </li>
            </ul>
          </BentoCard>

          <BentoCard title={null} className="border border-secondary-fixed bg-surface-bright">
            <div className="flex items-start gap-3">
              <Icon name="info" className="mt-0.5 text-primary" />
              <div>
                <h4 className="mb-1 text-sm font-semibold text-on-surface">Deduction Policy</h4>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Monthly deductions are automatically processed during payroll execution on the 28th of every month.
                </p>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}