import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AdvanceRequestForm } from "@/components/features/money/agent-forms";
import { AdvanceList } from "@/components/features/money/money-lists";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getMyAdvances } from "@/lib/api/agent-money";
import { formatKes } from "@/lib/money-format";

/** The agent's advances: what they owe, what is waiting for approval, and a form to ask for one. */
export default async function AgentAdvancesPage() {
  await requirePermission("agentadvance:request");

  let advances: Awaited<ReturnType<typeof getMyAdvances>>;
  try {
    advances = await getMyAdvances();
  } catch (error) {
    return (
      <DataUnavailable
        title="Advances"
        subject="Your advances"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const owed = advances
    .filter((advance) => advance.status === "OUTSTANDING" || advance.status === "PARTIALLY_RECOVERED")
    .reduce((sum, advance) => sum + advance.outstandingBalance, 0);
  const waiting = advances.filter((advance) => advance.status === "PENDING").length;

  return (
    <>
      <PageHeader
        title="Advances"
        description="Ask for an advance and see what you still owe. Advances are recovered from your payroll once approved."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:max-w-xl">
        <div className="rounded-card bg-surface-container-lowest p-4 shadow-ambient-1">
          <p className="text-xs text-outline">Still owed</p>
          <p className="mt-1 break-words text-lg font-bold tabular-nums text-on-surface sm:text-xl">{formatKes(owed)}</p>
        </div>
        <div className="rounded-card bg-surface-container-lowest p-4 shadow-ambient-1">
          <p className="text-xs text-outline">Waiting for approval</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-on-surface">{waiting}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <AdvanceRequestForm />

        <BentoCard title="Your advances" subtitle={`${advances.length} in total`}>
          {advances.length === 0 ? (
            <EmptyState
              symbol="account_balance_wallet"
              title="No advances yet"
              description="An advance you request appears here with the Administrator's decision."
            />
          ) : (
            <AdvanceList advances={advances} />
          )}
        </BentoCard>
      </div>
    </>
  );
}