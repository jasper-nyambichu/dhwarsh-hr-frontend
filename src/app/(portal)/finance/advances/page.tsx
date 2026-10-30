import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AdvanceList } from "@/components/features/money/money-lists";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getAdvances } from "@/lib/api/agent-money";
import { formatNumber } from "@/lib/format";
import { formatKes } from "@/lib/money-format";

/** Every agent advance, company-wide. Read-only: Admin approves them, Payroll recovers them. */
export default async function FinanceAdvancesPage() {
  await requirePermission("agentadvance:read");

  let advances: Awaited<ReturnType<typeof getAdvances>>;
  try {
    advances = await getAdvances();
  } catch (error) {
    return (
      <DataUnavailable
        title="Advances"
        subject="The advances list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const open = advances.filter((advance) => ["OUTSTANDING", "PARTIALLY_RECOVERED"].includes(advance.status));
  const outstanding = open.reduce((sum, advance) => sum + advance.outstandingBalance, 0);
  const pending = advances.filter((advance) => advance.status === "PENDING").length;

  return (
    <>
      <PageHeader title="Advances" description="Money advanced to agents and how much is still to be recovered." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Outstanding" value={formatKes(outstanding)} icon="account_balance_wallet" tone="primary" />
        <MetricCard label="Open advances" value={formatNumber(open.length)} icon="payments" tone="primary" />
        <MetricCard label="Awaiting approval" value={formatNumber(pending)} icon="pending_actions" tone={pending > 0 ? "amber" : "primary"} />
      </div>

      <BentoCard className="mt-gutter" title="All advances" subtitle="Newest first">
        {advances.length === 0 ? (
          <EmptyState symbol="account_balance_wallet" title="No advances yet" />
        ) : (
          <AdvanceList advances={advances} />
        )}
      </BentoCard>
    </>
  );
}