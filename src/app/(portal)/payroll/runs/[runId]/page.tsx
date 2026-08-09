import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney, initials } from "@/lib/format";
import type { Payslip } from "@/types";

/**
 * Payroll run detail.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — payslip rows shaped against `types.Payslip`. Swap
 * for `await api.get<PayrollRun>(`/payroll/runs/${runId}`)` and
 * `await api.get<Payslip[]>(`/payroll/runs/${runId}/payslips`)` when ready.
 * Approve/Reject/Export are not yet wired to the run endpoints.
 * ─────────────────────────────────────────────────────────────────────────
 */

const RUN_SUMMARY = {
  period: "August 2026",
  status: "Pending Approval" as const,
  gross: 4_250_000,
  deductions: 850_000,
  net: 3_400_000,
  employees: 142,
};

const PAYSLIPS: readonly (Pick<Payslip, "id" | "employeeName" | "grossPay" | "netPay"> & {
  department: string;
  deductions: number;
})[] = [
  { id: 1, employeeName: "Jane Wanjiku", department: "Marketing Dept", grossPay: 150_000, deductions: 30_000, netPay: 120_000 },
  { id: 2, employeeName: "David Omondi", department: "Engineering Dept", grossPay: 220_000, deductions: 45_000, netPay: 175_000 },
  { id: 3, employeeName: "Sarah Mutisya", department: "HR Dept", grossPay: 95_000, deductions: 15_000, netPay: 80_000 },
  { id: 4, employeeName: "Brian Kiprotich", department: "Sales Dept", grossPay: 110_000, deductions: 20_000, netPay: 90_000 },
  { id: 5, employeeName: "Alice Njoroge", department: "Finance Dept", grossPay: 280_000, deductions: 65_000, netPay: 215_000 },
  { id: 6, employeeName: "Faith Akinyi", department: "Operations Dept", grossPay: 135_000, deductions: 25_000, netPay: 110_000 },
];

const APPROVAL_TRAIL: readonly {
  title: string;
  detail: string;
  timestamp: string | null;
  done?: boolean;
  current?: boolean;
  upcoming?: boolean;
}[] = [
  { title: "Initiated", detail: "By Taruk (Admin)", timestamp: "Aug 25, 2026 • 09:00 AM", done: true },
  { title: "Processing Complete", detail: "System automated checks passed.", timestamp: "Aug 25, 2026 • 09:15 AM", done: true },
  { title: "Internal Review", detail: "Approved by HR Manager.", timestamp: "Aug 26, 2026 • 11:30 AM", done: true },
  { title: "Final Approval", detail: "Waiting for Finance Director's signature to authorize disbursement.", timestamp: "Pending Action", current: true },
  { title: "Disbursement", detail: "Scheduled", timestamp: null, upcoming: true },
];

export default async function PayrollRunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  await requirePermission("payroll:run");
  const { runId } = await params;
  const run = RUN_SUMMARY; // TODO: fetch by `runId` once the endpoint exists

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link href="/payroll/runs" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            {`Payroll Run — ${run.period}`}
            <span className="flex items-center gap-1.5 rounded-full border border-amber-main/30 bg-amber-main/10 px-2.5 py-1 font-body-md text-[12px] font-semibold text-amber-main">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-main" />
              {run.status}
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <Icon name="download" className="text-[18px]" />
              Export
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-error px-4 py-2 font-body-md text-body-md font-semibold text-error transition-colors hover:bg-error/5"
            >
              <Icon name="close" className="text-[18px]" />
              Reject
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
            >
              <Icon name="check" className="text-[18px]" />
              Approve
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <MetricCard label="Gross Pay" value={formatMoney(run.gross)} icon="payments" tone="primary" />
        <MetricCard label="Deductions" value={formatMoney(run.deductions)} icon="trending_down" tone="error" />
        <MetricCard label="Net Pay" value={formatMoney(run.net)} icon="account_balance_wallet" tone="primary" accent />
        <MetricCard label="Employees Processed" value={String(run.employees)} icon="groups" tone="primary" />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="lg:col-span-8">
          <BentoCard
            title="Payslips"
            action={
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  className="w-48 rounded-md border border-outline-variant py-1.5 pl-9 pr-4 font-body-md text-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Gross (KES)</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Deductions (KES)</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Net (KES)</th>
                    <th className="pb-3 pr-2 text-center font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {PAYSLIPS.map((slip) => (
                    <tr key={slip.id} className="group transition-colors">
                      <td className="py-3 pl-2">
                        <Link href={`/payroll/payslips/${slip.id}`} className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-xs font-bold text-primary"
                          >
                            {initials(slip.employeeName ?? "?")}
                          </span>
                          <span>
                            <span className="block font-semibold text-primary group-hover:underline">{slip.employeeName}</span>
                            <span className="block text-xs text-on-surface-variant">{slip.department}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(slip.grossPay, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums text-error">{formatMoney(slip.deductions, { showCurrency: false })}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(slip.netPay, { showCurrency: false })}</td>
                      <td className="py-3 pr-2 text-center">
                        <span className="inline-flex items-center rounded bg-tertiary-container/10 px-2 py-0.5 text-xs font-medium text-tertiary-container">
                          Ready
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
        <div className="lg:col-span-4">
          <BentoCard title="Approval Trail">
            <div className="relative">
              <div className="absolute bottom-6 left-4 top-2 w-0.5 bg-outline-variant/30" />
              <div className="relative flex flex-col gap-6">
                {APPROVAL_TRAIL.map((step) => (
                  <div key={step.title} className="flex items-start">
                    <span
                      className={
                        step.done
                          ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-tertiary text-on-tertiary shadow-sm"
                          : step.current
                            ? "relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-amber-main bg-surface-container-lowest"
                            : "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-outline-variant bg-surface"
                      }
                    >
                      {step.done && <Icon name="check" className="text-[18px]" />}
                      {step.current && <span className="size-2.5 animate-pulse rounded-full bg-amber-main" />}
                    </span>
                    <div className="ml-4">
                      <h3 className={`font-body-md text-sm font-semibold ${step.current ? "text-primary" : step.upcoming ? "text-on-surface-variant" : "text-on-surface"}`}>
                        {step.title}
                      </h3>
                      {step.timestamp && (
                        <p className={`mt-0.5 font-body-md text-xs ${step.current ? "font-medium text-amber-main" : "text-on-surface-variant"}`}>
                          {step.timestamp}
                        </p>
                      )}
                      <p
                        className={
                          step.current
                            ? "mt-1 rounded border border-amber-main/20 bg-amber-main/10 p-2 font-body-md text-xs text-on-surface-variant"
                            : "mt-1 font-body-md text-xs text-on-surface-variant"
                        }
                      >
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}