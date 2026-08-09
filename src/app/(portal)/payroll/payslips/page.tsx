import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import type { Payslip } from "@/types";

/**
 * Payslips list, filterable by period and branch.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Payslip`. Swap for
 * `await api.get<Paginated<Payslip>>("/payroll/runs/{runId}/payslips")`
 * (or a dedicated `/payslips` list endpoint if one exists) when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

type PayslipRow = Pick<Payslip, "id" | "employeeName" | "grossPay" | "netPay"> & {
  department: string;
  paye: number;
  nssf: number;
  shif: number;
  status: "Sent" | "Pending";
};

const PAYSLIPS: readonly PayslipRow[] = [
  { id: 1, employeeName: "Sarah Mwangi", department: "Marketing Dept", grossPay: 150_000, paye: 35_000, nssf: 1_080, shif: 4_125, netPay: 109_795, status: "Sent" },
  { id: 2, employeeName: "David Ochieng", department: "Finance Dept", grossPay: 220_000, paye: 58_000, nssf: 1_080, shif: 6_050, netPay: 154_870, status: "Pending" },
  { id: 3, employeeName: "Grace Njoroge", department: "IT Support", grossPay: 95_000, paye: 16_000, nssf: 1_080, shif: 2_612, netPay: 75_308, status: "Sent" },
  { id: 4, employeeName: "Kevin Mutua", department: "Sales Exec", grossPay: 120_000, paye: 24_000, nssf: 1_080, shif: 3_300, netPay: 91_620, status: "Sent" },
  { id: 5, employeeName: "Alice Juma", department: "Operations", grossPay: 85_000, paye: 13_000, nssf: 1_080, shif: 2_337, netPay: 68_583, status: "Pending" },
];

const STATUS_CHIP: Record<PayslipRow["status"], string> = {
  Sent: "bg-tertiary-container/10 text-tertiary",
  Pending: "bg-error-container/40 text-error",
};

const NET_PAY_TREND: readonly BarDatum[] = [
  { label: "Mar", value: 3.4, tooltip: "KES 3.4M" },
  { label: "Apr", value: 3.6, tooltip: "KES 3.6M" },
  { label: "May", value: 3.5, tooltip: "KES 3.5M" },
  { label: "Jun", value: 3.8, tooltip: "KES 3.8M" },
  { label: "Jul", value: 4.0, tooltip: "KES 4.0M" },
  { label: "Aug", value: 4.2, tooltip: "KES 4.2M" },
];

export default async function PayslipsPage() {
  await requirePermission("payroll:read");

  return (
    <>
      <PageHeader
        title="Payslips"
        description="Manage and distribute employee payslips."
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-body-md text-body-md font-semibold text-primary shadow-sm transition-colors hover:bg-surface-container"
            >
              <Icon name="download" className="text-sm" />
              Export All
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-body-md text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary"
            >
              <Icon name="send" className="text-sm" />
              Distribute Selected
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="xl:col-span-8">
          <BentoCard
            title="Payroll Cycle: Aug 2026"
            action={
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  className="w-56 rounded-lg border border-outline-variant py-1.5 pl-9 pr-3 font-body-md text-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="w-8 pb-3 pl-2">
                      <input type="checkbox" className="rounded border-outline-variant text-primary" />
                    </th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Gross</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">PAYE</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">NSSF</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">SHIF</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Net</th>
                    <th className="pb-3 text-center font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Download</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {PAYSLIPS.map((slip) => (
                    <tr key={slip.id} className="group transition-colors">
                      <td className="py-3 pl-2">
                        <input type="checkbox" className="rounded border-outline-variant text-primary" />
                      </td>
                      <td className="py-3">
                        <span className="block font-semibold text-on-surface">{slip.employeeName}</span>
                        <span className="block text-xs text-on-surface-variant">{slip.department}</span>
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums">{formatMoney(slip.grossPay, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums text-error">-{formatMoney(slip.paye, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums text-error">-{formatMoney(slip.nssf, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums text-error">-{formatMoney(slip.shif, { showCurrency: false })}</td>
                      <td className="py-3 text-right font-bold tabular-nums text-primary">{formatMoney(slip.netPay, { showCurrency: false })}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CHIP[slip.status]}`}>
                          {slip.status}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <button className="rounded-md p-1 text-primary transition-colors hover:bg-primary/10">
                          <Icon name="download" className="text-sm" />
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
        <div className="flex flex-col gap-gutter xl:col-span-4">
          <BentoCard title={null} className="flex items-center justify-between">
            <div>
              <p className="mb-1 font-body-md text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Total Net Disbursed
              </p>
              <h3 className="font-card-stat text-card-stat text-on-surface">{formatMoneyCompact(4_200_000)}</h3>
              <p className="mt-1 flex items-center gap-1 font-body-md text-xs font-medium text-tertiary">
                <Icon name="trending_up" className="text-[14px]" />
                +2.4% from last month
              </p>
            </div>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name="account_balance_wallet" className="text-2xl" />
            </span>
          </BentoCard>

          <BentoCard
            title="Net Pay Trend"
            action={<Icon name="more_horiz" className="text-sm text-on-surface-variant" />}
            className="flex flex-1 flex-col"
            bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2"
          >
            <BarChart data={NET_PAY_TREND} max={5} axisLabels={["5M", "4M", "3M", "2M", "0"]} tone="primary" />
          </BentoCard>
        </div>
      </div>
    </>
  );
}