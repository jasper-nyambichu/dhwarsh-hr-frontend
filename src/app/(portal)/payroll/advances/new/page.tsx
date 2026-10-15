import { format } from "date-fns";

import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getActiveAgents } from "@/lib/api/agent-advance";

import { RecordAdvanceForm } from "./_components/record-advance-form";

/** Record money given to an agent. Replaces the old "salary advance request" form. */
export default async function NewAdvancePage() {
  await requirePermission("agentadvance:approve");

  let agents: Awaited<ReturnType<typeof getActiveAgents>>;
  try {
    agents = await getActiveAgents();
  } catch (error) {
    return (
      <DataUnavailable
        title="Record Advance"
        subject="The agent list"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Record Advance"
        description="Log money the company has paid an agent. It is recovered automatically in their next payroll run."
      />
      <RecordAdvanceForm
        today={format(new Date(), "yyyy-MM-dd")}
        agents={agents.map((agent) => ({ id: agent.id, name: agent.name }))}
      />
    </>
  );
}