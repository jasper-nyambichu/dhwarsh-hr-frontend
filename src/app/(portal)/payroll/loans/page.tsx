import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney, initials } from "@/lib/format";
import type { Loan, LoanStatus } from "@/types";

/**
 * Loans list.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Loan`, plus a `startDate`/
 * `endDate` pair the list view needs as a projection (the DTO only has
 * `requestDate`/`approvalDate`). Swap for
 * `await api.get<Paginated<Loan>>("/loans/employee/{id}")` (or the org-wide
 * list endpoint) when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

type LoanRow = Loan & { startDate: string; endDate: string };

const LOANS: readonly LoanRow[] = [
  { id: 1, employeeId: 1, employeeName: "Amina Yusuf", principalAmount: 150_000, interestRate: 0, installmentAmount: 12_500, outstandingBalance: 85_000, requestDate: null, approvalDate: null, status: "ACTIVE", startDate: "2023-01-01", endDate: "2023-12-31", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 2, employeeId: 2, employeeName: "David Omondi", principalAmount: 500_000, interestRate: 0, installmentAmount: 41_666, outstandingBalance: 320_000, requestDate: null, approvalDate: null, status: "ACTIVE", startDate: "2023-03-15", endDate: "2024-03-14", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 3, employeeId: 3, employeeName: "Grace Njoroge", principalAmount: 75_000, interestRate: 0, installmentAmount: 15_000, outstandingBalance: 0, requestDate: null, approvalDate: null, status: "SETTLED", startDate: "2023-02-10", endDate: "2023-07-10", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 4, employeeId: 4, employeeName: "Kevin Mutua", principalAmount: 200_000, interestRate: 0, installmentAmount: 16_666, outstandingBalance: 180_000, requestDate: null, approvalDate: null, status: "ACTIVE", startDate: "2023-10-01", endDate: "2024-09-30", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 5, employeeId: 5, employeeName: "Sarah Wanjiku", principalAmount: 50_000, interestRate: 0, installmentAmount: 10_000, outstandingBalance: 10_000, requestDate: null, approvalDate: null, status: "ACTIVE", startDate: "2023-06-05", endDate: "2023-11-05", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 6, employeeId: 6, employeeName: "Peter Kiprono", principalAmount: 120_000, interestRate: 0, installmentAmount: 20_000, outstandingBalance: 0, requestDate: null, approvalDate: null, status: "SETTLED", startDate: "2023-01-15", endDate: "2023-07-15", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
];

const STATUS_CHIP: Record<LoanStatus, string> = {
  PENDING: "bg-surface-variant text-on-surface-variant",
  APPROVED: "bg-blue-soft text-primary-container",
  REJECTED: "bg-error/10 text-error",
  ACTIVE: "bg-tertiary-fixed text-on-tertiary-fixed",
  SETTLED: "bg-surface-variant text-on-surface-variant",
};

const LARGEST_BALANCES = [
  { id: 2, name: "David Omondi", balance: 320_000, pct: 64 },
  { id: 5000, name: "Emily Davis", balance: 250_000, pct: 83 },
  { id: 4, name: "Kevin Mutua", balance: 180_000, pct: 90 },
  { id: 1, name: "Amina Yusuf", balance: 85_000, pct: 56 },
] as const;

export default async function LoansPage() {
  await requirePermission("loan:read");

  const activeCount = LOANS.filter((l) => l.status === "ACTIVE").length;
  const settledCount = LOANS.filter((l) => l.status === "SETTLED").length;

  return (
    <>
      <PageHeader
        title="Loans"
        description="Manage employee loans and repayment schedules."
        pill={<CountPill label={`${activeCount} Active`} />}
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-body-md text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            <Icon name="add" className="text-sm" />
            New Loan
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 xl:col-span-8">
          <BentoCard
            title="Active Loan Schedules"
            action={
              <button
                type="button"
                className="flex items-center gap-1 font-body-md text-body-md font-semibold text-primary hover:underline"
              >
                <Icon name="download" className="text-sm" />
                Export
              </button>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Principal (KES)</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Balance (KES)</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Monthly (KES)</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Started</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Ends</th>
                    <th className="pb-3 pr-2 text-center font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {LOANS.map((loan) => (
                    <tr key={loan.id} className="group transition-colors">
                      <td className="py-3 pl-2">
                        <a href={`/payroll/loans/${loan.id}`} className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container"
                          >
                            {initials(loan.employeeName ?? "?")}
                          </span>
                          <span className="font-medium text-on-surface group-hover:text-primary-container">
                            {loan.employeeName}
                          </span>
                        </a>
                      </td>
                      <td className="py-3 tabular-nums">{formatMoney(loan.principalAmount, { showCurrency: false })}</td>
                      <td className={`py-3 font-semibold tabular-nums ${loan.outstandingBalance > 0 ? "text-primary" : "text-on-surface-variant"}`}>
                        {formatMoney(loan.outstandingBalance, { showCurrency: false })}
                      </td>
                      <td className="py-3 tabular-nums text-on-surface-variant">{formatMoney(loan.installmentAmount, { showCurrency: false })}</td>
                      <td className="py-3 text-on-surface-variant">{new Date(loan.startDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 text-on-surface-variant">{new Date(loan.endDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 pr-2 text-center">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${STATUS_CHIP[loan.status]}`}>
                          {loan.status.charAt(0) + loan.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter xl:col-span-4">
          <BentoCard title="Loan Status">
            <div className="relative flex items-center justify-center py-4">
              <svg className="-rotate-90" height="160" viewBox="0 0 160 160" width="160">
                <circle cx="80" cy="80" fill="transparent" r="60" stroke="var(--color-surface-variant)" strokeWidth="24" />
                <circle
                  cx="80" cy="80" fill="transparent" r="60"
                  stroke="var(--color-error)" strokeDasharray="377" strokeDashoffset="264"
                  strokeWidth="24" style={{ transform: "rotate(108deg)", transformOrigin: "center" }}
                />
                <circle
                  cx="80" cy="80" fill="transparent" r="60"
                  stroke="var(--color-primary-container)" strokeDasharray="377" strokeDashoffset="151"
                  strokeWidth="24" style={{ transform: "rotate(144deg)", transformOrigin: "center" }}
                />
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-on-surface">{LOANS.length + 30}</span>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Total Loans</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="mb-1 flex items-center justify-center gap-1">
                  <span className="size-2 rounded-full bg-primary-container" />
                  <span className="text-xs text-on-surface-variant">Active</span>
                </div>
                <span className="font-bold text-on-surface">{activeCount}</span>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-center gap-1">
                  <span className="size-2 rounded-full bg-surface-variant" />
                  <span className="text-xs text-on-surface-variant">Settled</span>
                </div>
                <span className="font-bold text-on-surface">{settledCount}</span>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-center gap-1">
                  <span className="size-2 rounded-full bg-error" />
                  <span className="text-xs text-on-surface-variant">Rejected</span>
                </div>
                <span className="font-bold text-on-surface">3</span>
              </div>
            </div>
          </BentoCard>

          <BentoCard title="Largest Balances" action={<Icon name="more_horiz" className="text-sm text-on-surface-variant" />}>
            <div className="flex flex-col gap-5">
              {LARGEST_BALANCES.map((item) => (
                <div key={item.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container"
                      >
                        {initials(item.name)}
                      </span>
                      <span>
                        <span className="block text-sm font-medium leading-tight text-on-surface">{item.name}</span>
                        <span className="block text-xs text-on-surface-variant">
                          {formatMoney(item.balance, { showCurrency: true })} left
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-bold text-primary">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-container-high">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-lg py-2 font-body-md text-body-md font-medium text-primary transition-colors hover:bg-secondary-fixed-dim/20"
            >
              View All Balances
            </button>
          </BentoCard>
        </div>
      </div>
    </>
  );
}