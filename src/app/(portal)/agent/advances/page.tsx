import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getMyAdvances } from "@/lib/api/agent-advance";
import { formatDate, formatMoney, formatMoneyCompact, humanizeEnum } from "@/lib/format";
import type { AgentAdvanceResponse, AgentAdvanceStatus } from "@/types/agent-portal";

/**
 * Advances the company has paid to the agent ahead of payroll. Read-only:
 * advances are recorded by the Payroll Officer, and the outstanding balance
 * is subtracted automatically from the next payment, before VAT.
 */

const STATUS_CHIP: Record<AgentAdvanceStatus, string> = {
  OUTSTANDING: "bg-orange/10 text-orange border border-orange/20",
  PARTIALLY_RECOVERED: "bg-primary/10 text-primary border border-primary/20",
  FULLY_RECOVERED: "bg-green-main/10 text-green-main border border-green-main/20",
};

export default async function AgentAdvancesPage() {
  await requirePermission("agentadvance:read:self");

  let advances: AgentAdvanceResponse[];
  try {
    advances = await getMyAdvances();
  } catch (error) {
    return (
      <DataUnavailable
        title="Advances"
        subject="Your advances"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const sorted = [...advances].sort((a, b) =>
    b.advanceDate.localeCompare(a.advanceDate) || b.id - a.id,
  );
  const open = sorted.filter((a) => a.status !== "FULLY_RECOVERED");
  const totalAdvanced = sorted.reduce((sum, a) => sum + a.amount, 0);
  const outstanding = open.reduce((sum, a) => sum + a.outstandingBalance, 0);

  return (
    <>
      <PageHeader
        title="Advances"
        description="Money paid to you ahead of payroll. Outstanding balances are deducted from your next payment."
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Outstanding Balance" value={formatMoneyCompact(outstanding)} icon="pending_actions" tone="tertiary" hint="Deducted from next payment" />
        <MetricCard label="Total Advanced" value={formatMoneyCompact(totalAdvanced)} icon="payments" tone="primary" />
        <MetricCard label="Open Advances" value={String(open.length)} icon="autorenew" tone="primary" />
      </div>

      <BentoCard className="mt-gutter" title="Advance History">
        {sorted.length === 0 ? (
          <EmptyState symbol="account_balance_wallet" title="No advances" description="You have no advances on record." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Date</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Purpose</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Amount (KES)</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Outstanding (KES)</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface">
                {sorted.map((advance) => (
                  <tr key={advance.id} className="border-b border-surface-variant/50 transition-colors hover:bg-surface-container-low">
                    <td className="whitespace-nowrap py-4 text-on-surface-variant">{formatDate(advance.advanceDate)}</td>
                    <td className="py-4">{advance.purpose?.trim() || "—"}</td>
                    <td className="py-4 text-right font-medium tabular-nums">{formatMoney(advance.amount, { showCurrency: false })}</td>
                    <td className="py-4 text-right font-medium tabular-nums">{formatMoney(advance.outstandingBalance, { showCurrency: false })}</td>
                    <td className="py-4 text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CHIP[advance.status]}`}>
                        {humanizeEnum(advance.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
          <Icon name="info" className="mt-0.5 shrink-0 text-primary" />
          <p className="text-sm text-on-surface-variant">
            Advances are recorded by the company&apos;s payroll team. To request one, contact your payroll officer.
          </p>
        </div>
      </BentoCard>
    </>
  );
}