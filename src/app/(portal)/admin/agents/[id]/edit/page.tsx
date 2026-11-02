import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getAgent } from "@/lib/api/agent";
import type { AgentResponse } from "@/types";

import { AgentForm } from "../../_components/agent-form";

/** Edit a labour agent. `?photo=failed` means registering worked but the ID photo did not save. */
export default async function EditAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo?: string }>;
}) {
  await requirePermission("agent:write");

  const agentId = Number((await params).id);
  if (!Number.isInteger(agentId) || agentId <= 0) notFound();

  let agent: AgentResponse;
  try {
    agent = await getAgent(agentId);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Edit Agent" subject="This agent" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader title={`Edit ${agent.name}`} />
      {(await searchParams).photo === "failed" ? (
        <p role="alert" className="mx-auto mb-gutter w-full max-w-3xl rounded-lg border border-error/40 bg-error/5 px-4 py-3 font-body-md text-body-md text-error">
          The agent was registered, but the ID photo did not save. Choose it again below.
        </p>
      ) : null}
      <AgentForm initial={agent} />
    </>
  );
}
