import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getAllAdvances } from "@/lib/api/agent-advance";
import { formatDate, formatMoney, formatMoneyCompact, humanizeEnum } from "@/lib/format";

/** Agent advances for audit review — money paid to agents ahead of payroll. Read-only. */
export default async function AuditAdvancesPage() {
  await requirePermission("agentadvance:read");

  let advances: Awaited<ReturnType<typeof getAllAdvances>>;
  try {
    advances = await getAllAdvances();
  } catch (error) {
    return <DataUnavailable title="Agent Advances" subject="The advance list" reason={error instanceof Error ? error.message : undefined} />;
  }

  const open = advances.filter((advance) => advance.status !== "FULLY_RECOVERED");

  return (
    <>
      <PageHeader title="Agent Advances" description="Money paid to agents ahead of payroll, and how much is still to be recovered. Read-only." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Outstanding" value={formatMoneyCompact(open.reduce((sum, advance) => sum + advance.outstandingBalance, 0))} icon="pending_actions" tone="primary" />
        <MetricCard label="Total Advanced" value={formatMoneyCompact(advances.reduce((sum, advance) => sum + advance.amount, 0))} icon="payments" tone="primary" />
        <MetricCard label="Open Advances" value={String(open.length)} icon="autorenew" tone="primary" />
      </div>

      <BentoCard className="mt-gutter" title="All Advances">
        {advances.length === 0 ? (
          <EmptyState symbol="account_balance_wallet" title="No advances recorded" />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Date</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Agent</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Purpose</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Amount</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Outstanding</th>
                  <th className="pb-3 pr-2 text-center font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {advances.map((advance) => (
                  <tr key={advance.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="whitespace-nowrap py-3 pl-2 text-on-surface-variant">{formatDate(advance.advanceDate)}</td>
                    <td className="py-3 font-semibold">{advance.agentName ?? `Agent #${advance.agentId}`}</td>
                    <td className="py-3 text-on-surface-variant">{advance.purpose?.trim() || "—"}</td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(advance.amount, { showCurrency: false })}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(advance.outstandingBalance, { showCurrency: false })}</td>
                    <td className="py-3 pr-2 text-center text-xs font-medium">{humanizeEnum(advance.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </>
  );
}