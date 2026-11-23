import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AdvanceList } from "@/components/features/money/money-lists";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAdvances } from "@/lib/api/agent-money";
import { formatKes } from "@/lib/money-format";

/** Every advance given to agents (read only): the Admin approves them; payroll runs take them back. */
export default async function AccountsAdvancesPage() {
  await requirePermission("agentadvance:read");

  let advances: Awaited<ReturnType<typeof getAdvances>>;
  try {
    advances = await getAdvances();
  } catch (error) {
    return <DataUnavailable title="Advances" subject="The advances" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const given = advances
    .filter((advance) => advance.status !== "PENDING" && advance.status !== "REJECTED")
    .sort((a, b) => b.advanceDate.localeCompare(a.advanceDate) || b.id - a.id);
  const owed = given
    .filter((advance) => advance.status === "OUTSTANDING" || advance.status === "PARTIALLY_RECOVERED")
    .reduce((sum, advance) => sum + advance.outstandingBalance, 0);

  return (
    <>
      <PageHeader title="Advances" description="Advances given to agents and how much is still owed. Each payroll run takes them back from the agent's invoice." />
      <BentoCard title="All advances given" subtitle={`${given.length} advance(s) · ${formatKes(owed)} still owed by agents`}>
        {given.length === 0 ? (
          <EmptyState symbol="account_balance_wallet" title="No advances" description="Advances the Admin approves for agents appear here." />
        ) : (
          <AdvanceList advances={given} showAgent />
        )}
      </BentoCard>
    </>
  );
}
