import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getAllAdvances } from "@/lib/api/agent-advance";
import { formatDate, formatMoney, formatMoneyCompact, humanizeEnum } from "@/lib/format";
import type { AgentAdvanceResponse, AgentAdvanceStatus } from "@/types/agent-portal";

/**
 * Agent advances — money the company has paid to labour agents ahead of payroll.
 * (These are NOT employee salary advances; employees borrow through Loans.)
 */

const STATUS_CHIP: Record<AgentAdvanceStatus, string> = {
  OUTSTANDING: "bg-amber-main/10 text-amber-main border border-amber-main/30",
  PARTIALLY_RECOVERED: "bg-primary/10 text-primary border border-primary/20",
  FULLY_RECOVERED: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30",
};

export default async function PayrollAdvancesPage() {
  const session = await requirePermission("agentadvance:read");
  const canRecord = hasPermission(session.role, "agentadvance:approve");

  let advances: AgentAdvanceResponse[];
  try {
    advances = await getAllAdvances();
  } catch (error) {
    return (
      <DataUnavailable
        title="Agent Advances"
        subject="The advance list"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const open = advances.filter((advance) => advance.status !== "FULLY_RECOVERED");
  const outstanding = open.reduce((sum, advance) => sum + advance.outstandingBalance, 0);
  const totalAdvanced = advances.reduce((sum, advance) => sum + advance.amount, 0);

  return (
    <>
      <PageHeader
        title="Agent Advances"
        description="Money paid to agents ahead of payroll. The balance is subtracted from their next payment, before VAT."
        actions={
          canRecord ? (
            <Link
              href="/payroll/advances/new"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
            >
              <Icon name="add" className="text-[18px]" />
              Record Advance
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Outstanding" value={formatMoneyCompact(outstanding)} icon="pending_actions" tone="primary" hint="To be recovered in payroll" />
        <MetricCard label="Total Advanced" value={formatMoneyCompact(totalAdvanced)} icon="payments" tone="primary" />
        <MetricCard label="Open Advances" value={String(open.length)} icon="autorenew" tone="primary" />
      </div>

      <BentoCard className="mt-gutter" title="All Advances">
        {advances.length === 0 ? (
          <EmptyState symbol="account_balance_wallet" title="No advances recorded" />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[760px] border-collapse text-left">
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
                  <tr key={advance.id} className="border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface">
                    <td className="whitespace-nowrap py-3 pl-2 text-on-surface-variant">
                      <Link href={`/payroll/advances/${advance.id}`} className="text-primary hover:underline">
                        {formatDate(advance.advanceDate)}
                      </Link>
                    </td>
                    <td className="py-3 font-semibold">{advance.agentName ?? `Agent #${advance.agentId}`}</td>
                    <td className="py-3 text-on-surface-variant">{advance.purpose?.trim() || "—"}</td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(advance.amount, { showCurrency: false })}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(advance.outstandingBalance, { showCurrency: false })}</td>
                    <td className="py-3 pr-2 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CHIP[advance.status]}`}>
                        {humanizeEnum(advance.status)}
                      </span>
                    </td>
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