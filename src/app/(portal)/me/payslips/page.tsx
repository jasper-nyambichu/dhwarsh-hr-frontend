//src/app/(portal)/employee/payslips/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";

/**
 * Employee payslip directory + net pay trend.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Payslip`. Bar chart uses
 * fixed percentage heights matching the mock; swap for a real chart once
 * monthly net-pay history is available (or use the shared chart component
 * if one exists — confirm and I'll switch this over).
 * ─────────────────────────────────────────────────────────────────────────
 */

type PayslipStatus = "PAID" | "PENDING";

type PayslipRow = {
  id: number;
  period: string;
  gross: number;
  deductions: number;
  net: number;
  status: PayslipStatus;
};

type TrendPoint = { label: string; heightPercent: number; highlighted?: boolean };

const PAYSLIPS: readonly PayslipRow[] = [
  { id: 1, period: "December 2023", gross: 5200, deductions: 850, net: 4350, status: "PAID" },
  { id: 2, period: "November 2023", gross: 5200, deductions: 850, net: 4350, status: "PAID" },
  { id: 3, period: "October 2023", gross: 5200, deductions: 900, net: 4300, status: "PAID" },
  { id: 4, period: "September 2023", gross: 5000, deductions: 800, net: 4200, status: "PAID" },
];

const YTD_NET_PAY = 51450;

const TREND: readonly TrendPoint[] = [
  { label: "Jul", heightPercent: 60 },
  { label: "Aug", heightPercent: 65 },
  { label: "Sep", heightPercent: 70 },
  { label: "Oct", heightPercent: 75 },
  { label: "Nov", heightPercent: 80 },
  { label: "Dec", heightPercent: 80, highlighted: true },
];

export default async function EmployeePayslipsPage() {
  await requirePermission("payslip:read:self");

  return (
    <>
      <PageHeader
        title="Payslip Directory"
        actions={
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <select
              defaultValue="2023"
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
            <button className="flex items-center gap-2 rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container transition-colors hover:bg-primary-fixed">
              <Icon name="download" className="text-[18px]" />
              Download All
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-gutter xl:flex-row">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col gap-gutter">
          <BentoCard flush>
            <div className="overflow-x-auto p-card-padding">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-variant">
                    <th className="px-4 py-3 font-table-header uppercase text-on-surface-variant">Period</th>
                    <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Gross</th>
                    <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Deductions</th>
                    <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Net</th>
                    <th className="px-4 py-3 text-center font-table-header uppercase text-on-surface-variant">Status</th>
                    <th className="px-4 py-3 text-center font-table-header uppercase text-on-surface-variant">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {PAYSLIPS.map((payslip) => (
                    <tr key={payslip.id} className="border-b border-surface-variant transition-colors last:border-0 hover:bg-surface">
                      <td className="px-4 py-4 font-body-md font-medium text-on-surface">{payslip.period}</td>
                      <td className="px-4 py-4 text-right font-body-md text-on-surface">{formatMoney(payslip.gross)}</td>
                      <td className="px-4 py-4 text-right font-body-md text-error">-{formatMoney(payslip.deductions)}</td>
                      <td className="px-4 py-4 text-right font-body-md font-bold text-primary">{formatMoney(payslip.net)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="rounded-full bg-tertiary-fixed-dim/20 px-2 py-1 text-[10px] font-bold uppercase text-tertiary-container">
                          {payslip.status === "PAID" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link
                          href={`/employee/payslips/${payslip.id}`}
                          className="inline-flex text-primary transition-colors hover:text-on-primary-fixed-variant"
                        >
                          <Icon name="download" className="text-[20px]" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        {/* Full width until xl, where it becomes a fixed side column. The
            pt-10 only makes sense once it sits beside the table. */}
        <div className="flex w-full flex-col gap-gutter xl:w-[320px] xl:shrink-0 xl:pt-10">
          <BentoCard flush>
            <div className="flex items-center justify-between p-card-padding">
              <div>
                <span className="mb-1 block text-xs font-medium text-on-surface-variant">YTD Net Pay</span>
                <span className="block font-card-stat text-card-stat text-primary">{formatMoney(YTD_NET_PAY)}</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary-fixed">
                <Icon name="account_balance_wallet" className="text-primary" />
              </div>
            </div>
          </BentoCard>

          <BentoCard title="Net Pay Trend (6 Mos)" flush>
            <div className="p-card-padding pt-0">
              <div className="relative mt-4 flex h-48 items-end gap-3 border-b border-surface-variant pb-2">
                <div className="absolute bottom-6 left-0 top-0 flex h-full flex-col justify-between text-[9px] text-on-surface-variant opacity-50">
                  <span>5k</span>
                  <span>4k</span>
                  <span>3k</span>
                </div>
                {TREND.map((point, index) => (
                  <div
                    key={point.label}
                    className={`group flex h-full flex-1 flex-col items-center justify-end gap-2 ${index === 0 ? "ml-6" : ""}`}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-colors ${
                        point.highlighted ? "bg-primary shadow-md" : "bg-secondary-fixed group-hover:bg-primary"
                      }`}
                      style={{ height: `${point.heightPercent}%` }}
                    />
                    <span className={`text-[10px] ${point.highlighted ? "font-bold text-primary" : "text-on-surface-variant"}`}>
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Icon name="trending_up" className="text-[16px] text-tertiary-container" />
                <span className="text-xs text-on-surface-variant">Consistent earnings this quarter</span>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}