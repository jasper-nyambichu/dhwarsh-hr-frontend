import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getMyPayslips } from "@/lib/api/payroll";
import { formatMoney, formatMoneyCompact, formatMonthYear } from "@/lib/format";
import type { PayslipResponse } from "@/types/payroll";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Employee payslip directory — the signed-in employee's own payslips, newest first. */
export default async function EmployeePayslipsPage() {
  await requirePermission("payslip:read:self");

  let payslips: PayslipResponse[];
  try {
    payslips = await getMyPayslips();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payslip Directory"
        subject="Your payslips"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const currentYear = new Date().getFullYear();
  const ytdNet = payslips
    .filter((payslip) => payslip.periodEnd.startsWith(String(currentYear)))
    .reduce((sum, payslip) => sum + payslip.netPay, 0);

  const trend: BarDatum[] = payslips
    .slice(0, 6)
    .reverse()
    .map((payslip) => ({
      label: MONTHS[Number(payslip.periodEnd.slice(5, 7)) - 1] ?? "—",
      value: payslip.netPay,
      tooltip: formatMoney(payslip.netPay),
    }));
  const trendMax = Math.max(1, ...trend.map((point) => point.value));

  return (
    <>
      <PageHeader title="Payslip Directory" description="Your payslips, newest first." />

      <div className="flex flex-col gap-gutter xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-gutter">
          <BentoCard flush>
            {payslips.length === 0 ? (
              <EmptyState symbol="receipt_long" title="No payslips yet" description="Your payslips appear here after each payroll run." className="m-4 border-0" />
            ) : (
              <div className="overflow-x-auto p-card-padding">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-surface-variant">
                      <th className="px-4 py-3 font-table-header uppercase text-on-surface-variant">Period</th>
                      <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Gross</th>
                      <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Deductions</th>
                      <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Net</th>
                      <th className="px-4 py-3 text-center font-table-header uppercase text-on-surface-variant">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map((payslip) => (
                      <tr key={payslip.id} className="border-b border-surface-variant transition-colors last:border-0 hover:bg-surface">
                        <td className="px-4 py-4 font-body-md font-medium text-on-surface">{formatMonthYear(payslip.periodEnd)}</td>
                        <td className="px-4 py-4 text-right font-body-md text-on-surface">{formatMoney(payslip.grossPay)}</td>
                        <td className="px-4 py-4 text-right font-body-md text-error">-{formatMoney(payslip.grossPay - payslip.netPay)}</td>
                        <td className="px-4 py-4 text-right font-body-md font-bold text-primary">{formatMoney(payslip.netPay)}</td>
                        <td className="px-4 py-4 text-center">
                          <Link href={`/me/payslips/${payslip.id}`} aria-label={`Open payslip for ${formatMonthYear(payslip.periodEnd)}`} className="inline-flex text-primary transition-colors hover:text-on-primary-fixed-variant">
                            <Icon name="visibility" className="text-[20px]" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        <div className="flex w-full flex-col gap-gutter xl:w-[320px] xl:shrink-0">
          <BentoCard flush>
            <div className="flex items-center justify-between p-card-padding">
              <div>
                <span className="mb-1 block text-xs font-medium text-on-surface-variant">{currentYear} Net Pay (YTD)</span>
                <span className="block font-card-stat text-card-stat text-primary">{formatMoney(ytdNet)}</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary-fixed">
                <Icon name="account_balance_wallet" className="text-primary" />
              </div>
            </div>
          </BentoCard>

          {trend.length > 0 ? (
            <BentoCard title="Net Pay Trend" subtitle="Last 6 payslips" className="flex min-h-64 flex-col" bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2">
              <BarChart
                data={trend}
                max={trendMax}
                axisLabels={[formatMoneyCompact(trendMax, { showCurrency: false }), formatMoneyCompact(trendMax / 2, { showCurrency: false }), "0"]}
                tone="primary"
              />
            </BentoCard>
          ) : null}
        </div>
      </div>
    </>
  );
}