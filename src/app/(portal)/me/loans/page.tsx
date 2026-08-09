//src/app/(portal)/employee/loans/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoneyCompact, formatPercent } from "@/lib/format";

/**
 * Employee loans overview: active loan progress + history.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Loan`. "Eligible Loan Amount"
 * should come from a salary-band eligibility endpoint rather than being
 * hardcoded.
 * ─────────────────────────────────────────────────────────────────────────
 */

type LoanStatus = "ACTIVE" | "COMPLETED";

type LoanHistoryRow = {
  id: number;
  type: string;
  amount: number;
  dateIssued: string;
  termMonths: number;
  status: LoanStatus;
};

type ActiveLoan = {
  id: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  paidInstallments: number;
  totalInstallments: number;
  nextDueDate: string;
  nextDueAmount: number;
};

const ACTIVE_LOAN: ActiveLoan = {
  id: "L-2023-089",
  type: "Personal Loan",
  totalAmount: 15000,
  paidAmount: 9750,
  paidInstallments: 13,
  totalInstallments: 20,
  nextDueDate: "Oct 15, 2023",
  nextDueAmount: 750,
};

const ELIGIBLE_AMOUNT = 25000;
const TOTAL_BORROWED = 42000;
const PREVIOUS_LOAN_COUNT = 3;

const LOAN_HISTORY: readonly LoanHistoryRow[] = [
  { id: 1, type: "Personal Loan", amount: 15000, dateIssued: "Jan 10, 2023", termMonths: 24, status: "ACTIVE" },
  { id: 2, type: "Vehicle Loan", amount: 20000, dateIssued: "Mar 15, 2021", termMonths: 36, status: "COMPLETED" },
  { id: 3, type: "Emergency Advance", amount: 7000, dateIssued: "Nov 05, 2019", termMonths: 12, status: "COMPLETED" },
];

const STATUS_BADGE: Record<LoanStatus, string> = {
  ACTIVE: "bg-primary-container/10 text-primary-container",
  COMPLETED: "bg-accent-green/10 text-accent-green",
};

export default async function EmployeeLoansPage() {
  await requirePermission("loan:read:self");

  const paidPercent = Math.round((ACTIVE_LOAN.paidAmount / ACTIVE_LOAN.totalAmount) * 100);
  const remainingAmount = ACTIVE_LOAN.totalAmount - ACTIVE_LOAN.paidAmount;
  const remainingInstallments = ACTIVE_LOAN.totalInstallments - ACTIVE_LOAN.paidInstallments;

  return (
    <>
      <PageHeader
        title="Loans Overview"
        description="Manage and track your company loans."
        actions={
          <Link
            href="/me/loans/new"
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-[#081f33]"
          >
            <Icon name="add" className="text-sm" />
            Request Loan
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── active loan ───────────────── */}
        <div className="group relative col-span-12 flex flex-col overflow-hidden rounded-2xl bg-white p-card-padding shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)] lg:col-span-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary-fixed-dim/20 blur-3xl transition-colors group-hover:bg-primary-fixed-dim/30" />
          <div className="relative z-10 mb-6 flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-2 font-page-title text-on-surface">
                Active {ACTIVE_LOAN.type}
                <span className="rounded bg-primary-container px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                  Active
                </span>
              </h3>
              <p className="mt-1 font-body-md text-on-surface-variant">Loan ID: #{ACTIVE_LOAN.id}</p>
            </div>
            <div className="text-right">
              <p className="mb-1 font-label-rail uppercase text-on-surface-variant">Total Amount</p>
              <p className="font-card-stat text-primary">{formatMoneyCompact(ACTIVE_LOAN.totalAmount)}</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center py-4">
            <div className="mb-2 flex justify-between font-body-md">
              <span className="font-semibold text-on-surface">Repayment Progress</span>
              <span className="font-bold text-primary">{formatPercent(paidPercent)}</span>
            </div>
            <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-primary" style={{ width: `${paidPercent}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-on-surface-variant">
              <span>
                {formatMoneyCompact(ACTIVE_LOAN.paidAmount)} Paid ({ACTIVE_LOAN.paidInstallments} instalments)
              </span>
              <span>
                {formatMoneyCompact(remainingAmount)} Remaining ({remainingInstallments} instalments)
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex items-center justify-between border-t border-outline-variant/30 pt-4">
            <div>
              <p className="mb-1 text-xs text-on-surface-variant">Next Payment Due</p>
              <p className="font-semibold text-on-surface">
                {ACTIVE_LOAN.nextDueDate} • {formatMoneyCompact(ACTIVE_LOAN.nextDueAmount)}
              </p>
            </div>
            <button className="rounded-lg bg-[#E6F0F8] px-4 py-2 text-sm font-medium text-[#1C6EB4] transition-colors hover:bg-[#cce0f0]">
              Make Early Payment
            </button>
          </div>
        </div>

        {/* ────────────────────────────── side stats ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <div className="rounded-2xl bg-white p-card-padding shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <div className="mb-4 flex items-start justify-between">
              <p className="font-label-rail uppercase text-on-surface-variant">Eligible Loan Amount</p>
              <div className="flex size-8 items-center justify-center rounded bg-[#E6F0F8] text-[#1C6EB4]">
                <Icon name="account_balance_wallet" className="text-lg" />
              </div>
            </div>
            <p className="mb-1 font-card-stat text-on-surface">{formatMoneyCompact(ELIGIBLE_AMOUNT)}</p>
            <p className="flex items-center gap-1 text-xs text-accent-green">
              <Icon name="check_circle" className="text-[14px]" />
              Based on current salary band
            </p>
          </div>

          <div className="flex-1 rounded-2xl bg-white p-card-padding shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <div className="mb-4 flex items-start justify-between">
              <p className="font-label-rail uppercase text-on-surface-variant">Total Borrowed</p>
              <div className="flex size-8 items-center justify-center rounded bg-surface-container-high text-outline">
                <Icon name="history" className="text-lg" />
              </div>
            </div>
            <p className="mb-1 font-card-stat text-on-surface">{formatMoneyCompact(TOTAL_BORROWED)}</p>
            <p className="text-xs text-on-surface-variant">Across {PREVIOUS_LOAN_COUNT} previous loans</p>
          </div>
        </div>

        {/* ─────────────────────────────── history table ─────────────── */}
        <div className="col-span-12">
          <BentoCard
            title="Loan History"
            flush
            action={
              <button className="flex items-center gap-1 text-sm font-medium text-[#1C6EB4] transition-colors hover:text-primary">
                <Icon name="download" className="text-sm" />
                Export
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/50 bg-surface-bright/50">
                    <th className="p-4 pl-6 font-table-header uppercase text-on-surface-variant">Loan Type</th>
                    <th className="p-4 font-table-header uppercase text-on-surface-variant">Amount</th>
                    <th className="p-4 font-table-header uppercase text-on-surface-variant">Date Issued</th>
                    <th className="p-4 font-table-header uppercase text-on-surface-variant">Term</th>
                    <th className="p-4 font-table-header uppercase text-on-surface-variant">Status</th>
                    <th className="p-4 pr-6 text-right font-table-header uppercase text-on-surface-variant">Action</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-surface">
                  {LOAN_HISTORY.map((loan) => (
                    <tr key={loan.id} className="group border-b border-outline-variant/30 transition-colors last:border-0 hover:bg-surface/50">
                      <td className="p-4 pl-6 font-medium">{loan.type}</td>
                      <td className="p-4">{formatMoneyCompact(loan.amount)}</td>
                      <td className="p-4 text-on-surface-variant">{loan.dateIssued}</td>
                      <td className="p-4 text-on-surface-variant">{loan.termMonths} Months</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[loan.status]}`}>
                          <span className="size-1.5 rounded-full bg-current" />
                          {loan.status === "ACTIVE" ? "Active" : "Completed"}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button className="text-sm font-medium text-[#1C6EB4] opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}