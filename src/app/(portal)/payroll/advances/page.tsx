import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatMoney, formatMoneyCompact, initials } from "@/lib/format";

/**
 * Salary advance requests.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no shared `Advance` type exists in types/index.ts
 * yet (only `AgentAdvance`, which is for labour agents, not employees).
 * `AdvanceRow` below is a local shape until the backend exposes an
 * employee-advance DTO; swap for `await api.get<Paginated<Advance>>(...)`
 * once that endpoint and type exist.
 * ─────────────────────────────────────────────────────────────────────────
 */

type AdvanceStatus = "PENDING" | "APPROVED" | "REJECTED";

type AdvanceRow = {
  id: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  amount: number;
  requestedDate: string;
  reason: string;
  recoveryMonth: string;
  status: AdvanceStatus;
};

const ADVANCES: readonly AdvanceRow[] = [
  { id: 1, employeeName: "David Omondi", employeeCode: "ENG-402", department: "Engineering", amount: 45_000, requestedDate: "2026-08-12", reason: "Medical Emergency", recoveryMonth: "Sept 2026", status: "PENDING" },
  { id: 2, employeeName: "Grace Njoroge", employeeCode: "MKT-118", department: "Marketing", amount: 15_000, requestedDate: "2026-08-10", reason: "School Fees", recoveryMonth: "Sept 2026", status: "APPROVED" },
  { id: 3, employeeName: "Kevin Mutua", employeeCode: "FIN-042", department: "Finance", amount: 80_000, requestedDate: "2026-08-09", reason: "Car Repairs", recoveryMonth: "Oct 2026", status: "PENDING" },
  { id: 4, employeeName: "Sarah Wanjiku", employeeCode: "HR-012", department: "Human Resources", amount: 25_000, requestedDate: "2026-08-08", reason: "Rent Deposit", recoveryMonth: "Sept 2026", status: "REJECTED" },
  { id: 5, employeeName: "George Maina", employeeCode: "OPS-221", department: "Operations", amount: 60_000, requestedDate: "2026-08-05", reason: "House Moving", recoveryMonth: "Oct 2026", status: "APPROVED" },
  { id: 6, employeeName: "Jane Onyango", employeeCode: "SAL-304", department: "Sales", amount: 30_000, requestedDate: "2026-08-01", reason: "Personal Use", recoveryMonth: "Sept 2026", status: "PENDING" },
];

const STATUS_CHIP: Record<AdvanceStatus, string> = {
  PENDING: "bg-amber-main/10 text-amber-main border border-amber-main/30",
  APPROVED: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30",
  REJECTED: "bg-error/10 text-error border border-error/30",
};

const STATUS_LABEL: Record<AdvanceStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const LARGEST_REQUESTS = [...ADVANCES].sort((a, b) => b.amount - a.amount).slice(0, 4);

export default async function AdvancesPage() {
  // Gated as `loan:*` until the backend exposes an employee-advance module:
  // an advance is recovered from payroll exactly like a loan, and `PERMISSIONS`
  // mirrors the backend, so no `advance:*` permission exists to use here yet.
  await requirePermission("loan:read");

  const pendingCount = ADVANCES.filter((a) => a.status === "PENDING").length;

  return (
    <>
      <PageHeader
        title="Salary Advances"
        pill={<CountPill label={`${pendingCount} Pending`} tone="warning" />}
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
          >
            <Icon name="add" className="text-[18px]" />
            New Request
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="lg:col-span-8">
          <BentoCard
            title="Recent Advance Requests"
            action={
              <Link href="/payroll/advances" className="text-[10px] font-semibold text-primary hover:underline">
                View All
              </Link>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Amount (KES)</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Requested</th>
                    <th className="hidden pb-3 font-table-header text-table-header uppercase text-outline sm:table-cell">Reason</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Recovery</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Status</th>
                    <th className="pb-3 pr-2 text-center font-table-header text-table-header uppercase text-outline">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {ADVANCES.map((advance) => (
                    <tr key={advance.id} className="border-b border-surface-variant transition-colors last:border-0 hover:bg-surface-container-low">
                      <td className="py-3 pl-2">
                        <Link href={`/payroll/advances/${advance.id}`} className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-primary"
                          >
                            {initials(advance.employeeName)}
                          </span>
                          <span>
                            <span className="block font-semibold text-on-surface">{advance.employeeName}</span>
                            <span className="block text-[10px] text-outline">
                              {advance.employeeCode} • {advance.department}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 text-right font-semibold tabular-nums text-on-surface">
                        {formatMoney(advance.amount, { showCurrency: false })}
                      </td>
                      <td className="py-3 text-on-surface-variant">{formatDate(advance.requestedDate)}</td>
                      <td className="hidden max-w-[120px] truncate py-3 text-on-surface-variant sm:table-cell" title={advance.reason}>
                        {advance.reason}
                      </td>
                      <td className="py-3 text-on-surface-variant">{advance.recoveryMonth}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[advance.status]}`}>
                          <span className="size-1.5 rounded-full bg-current" />
                          {STATUS_LABEL[advance.status]}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-center">
                        <button type="button" className="rounded p-1 text-outline transition-colors hover:bg-surface-variant hover:text-primary">
                          <Icon name="more_vert" className="text-[18px]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <div className="flex gap-1 rounded-xl border border-surface-variant bg-surface-container-low p-1 shadow-inner">
            <button type="button" className="flex-1 rounded-lg border border-surface-variant bg-surface-container-lowest py-2 text-xs font-semibold text-primary shadow-sm">
              Pending ({pendingCount})
            </button>
            <button type="button" className="flex-1 rounded-lg py-2 text-xs font-semibold text-on-surface-variant transition-all hover:bg-surface-variant/50">
              Approved
            </button>
            <button type="button" className="flex-1 rounded-lg py-2 text-xs font-semibold text-on-surface-variant transition-all hover:bg-surface-variant/50">
              Rejected
            </button>
          </div>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="trending_up" className="text-[18px] text-tertiary" />
                Largest Requests
              </span>
            }
            action={<Icon name="filter_list" className="text-[16px] text-outline" />}
          >
            <div className="flex flex-col gap-4">
              {LARGEST_REQUESTS.map((advance, i) => (
                <div key={advance.id}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-secondary-container bg-blue-soft text-sm font-bold text-primary"
                      >
                        {initials(advance.employeeName)}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-on-surface">{advance.employeeName}</span>
                        <span className="block text-[11px] text-outline">{advance.department}</span>
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold text-on-surface">
                        {formatMoneyCompact(advance.amount)}
                      </span>
                      <span
                        className={`block text-[10px] font-semibold ${
                          advance.status === "PENDING" ? "text-amber-main" : advance.status === "APPROVED" ? "text-tertiary" : "text-error"
                        }`}
                      >
                        {STATUS_LABEL[advance.status]}
                      </span>
                    </span>
                  </div>
                  {i < LARGEST_REQUESTS.length - 1 && <div className="mt-4 h-px w-full bg-surface-variant" />}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-surface-variant py-2 text-xs font-semibold text-primary transition-colors hover:bg-blue-soft"
            >
              View Analytics
            </button>
          </BentoCard>

          <div className="flex items-start gap-3 rounded-card border border-primary-container/20 bg-gradient-to-br from-primary-container/10 to-transparent p-4">
            <Icon name="info" className="mt-0.5 text-[20px] text-primary" />
            <div>
              <h4 className="mb-1 text-xs font-semibold text-primary">Policy Reminder</h4>
              <p className="text-[11px] leading-relaxed text-on-surface-variant">
                Salary advances exceeding 50% of the employee&rsquo;s net pay require secondary approval from the HR
                Director before disbursement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}