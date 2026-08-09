import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney, initials } from "@/lib/format";

/**
 * Agent payroll summary detail — per-employee breakdown for one period.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no per-employee breakdown endpoint exists yet.
 * `types.AgentPayrollSummary` covers the aggregate row; this detail view
 * needs a `AgentPayrollSummaryLine[]` the backend doesn't expose yet. Swap
 * once `/payroll/runs/{id}/agents/{agentId}/summary` (or similar) returns
 * per-employee lines rather than just the PDF.
 * ─────────────────────────────────────────────────────────────────────────
 */

const SUMMARY = { period: "August 2026", totalDays: 432, grossEarnings: 1_245_000, commission: 124_500 };

const LINES = [
  { id: 1, name: "Peter Anderson", days: 22, gross: 85_000, commission: 8_500 },
  { id: 2, name: "Lisiya John", days: 20, gross: 72_000, commission: 7_200 },
  { id: 3, name: "Ahamed Ali", days: 24, gross: 98_000, commission: 9_800 },
  { id: 4, name: "Jenita Ray", days: 18, gross: 65_000, commission: 6_500 },
];

export default async function AgentSummaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("agentsummary:read:self");
  const { id } = await params;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <button type="button" className="flex size-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant">
              <Icon name="arrow_back" />
            </button>
            {`Summary: ${SUMMARY.period}`}
          </span>
        }
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-gutter">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <BentoCard title={null}>
            <div className="mb-4 flex items-start justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Total Days Worked</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="calendar_month" className="text-sm" />
              </span>
            </div>
            <p className="font-card-stat text-card-stat text-on-surface">{SUMMARY.totalDays}</p>
            <p className="mt-2 flex items-center gap-1 font-label-rail text-label-rail text-tertiary">
              <Icon name="trending_up" className="text-[14px]" />
              +12% from last month
            </p>
          </BentoCard>
          <BentoCard title={null}>
            <div className="mb-4 flex items-start justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Gross Earnings (KES)</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="payments" className="text-sm" />
              </span>
            </div>
            <p className="font-card-stat text-card-stat text-on-surface">{formatMoney(SUMMARY.grossEarnings, { showCurrency: false })}</p>
          </BentoCard>
          <BentoCard title={null} className="border-t-4 border-orange">
            <div className="mb-4 flex items-start justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Commission Earned (KES)</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-orange/10 text-orange">
                <Icon name="account_balance_wallet" className="text-sm" />
              </span>
            </div>
            <p className="font-card-stat text-card-stat text-on-surface">{formatMoney(SUMMARY.commission, { showCurrency: false })}</p>
          </BentoCard>
        </div>

        <BentoCard
          title="Employee Breakdown"
          action={
            <button type="button" className="flex items-center gap-2 font-body-md text-body-md text-primary transition-colors hover:text-primary-container">
              <Icon name="download" className="text-sm" />
              Export CSV
            </button>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                  <th className="pb-3 text-center font-table-header text-table-header uppercase text-on-surface-variant">Days Worked</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Gross Earnings (KES)</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Commission (KES)</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {LINES.map((line) => (
                  <tr key={line.id} className="border-t border-outline-variant/20">
                    <td className="py-3 pl-2">
                      <span className="flex items-center gap-3">
                        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container">
                          {initials(line.name)}
                        </span>
                        <span className="font-semibold text-on-primary-fixed-variant">{line.name}</span>
                      </span>
                    </td>
                    <td className="py-3 text-center">{line.days}</td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(line.gross, { showCurrency: false })}</td>
                    <td className="py-3 pr-2 text-right font-medium tabular-nums text-orange">{formatMoney(line.commission, { showCurrency: false })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-container-low font-bold text-on-primary-fixed-variant">
                  <td className="py-4 pl-2 text-sm uppercase tracking-wider">Totals</td>
                  <td className="py-4 text-center">{SUMMARY.totalDays}</td>
                  <td className="py-4 text-right">{formatMoney(SUMMARY.grossEarnings, { showCurrency: false })}</td>
                  <td className="py-4 pr-2 text-right text-base text-orange">{formatMoney(SUMMARY.commission, { showCurrency: false })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </BentoCard>
      </div>
    </>
  );
}