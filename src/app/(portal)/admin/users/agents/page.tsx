import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { CredentialCard } from "@/components/features/users/credential-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getAgents } from "@/lib/api/agent";
import { getUsers } from "@/lib/api/user";
import type { AgentResponse, UserSummaryResponse } from "@/types";

/** One login per agent, which they use to manage their own portal. */
export default async function UserAgentsPage() {
  await requirePermission("user:manage");

  let users: UserSummaryResponse[];
  let agents: AgentResponse[];
  try {
    [users, agents] = await Promise.all([getUsers(), getAgents()]);
  } catch (error) {
    return <DataUnavailable title="Agents" subject="The agent logins" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/admin/users"
              aria-label="Back to users"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            Agents
          </span>
        }
        description="Set each agent's username and password, then share them."
        actions={
          <Link href="/admin/agents/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container">
            <Icon name="add" className="text-[18px]" />
            Register Agent
          </Link>
        }
      />

      {agents.length === 0 ? (
        <div className="bento-card p-4 sm:p-card-padding">
          <EmptyState symbol="handshake" title="No agents yet" description="Register an agent, then set their login here." />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-2">
          {agents.map((agent) => (
            <CredentialCard
              key={agent.id}
              title={agent.name}
              where="this agent's portal"
              account={users.find((user) => user.role === "AGENT" && user.agentId === agent.id) ?? null}
              agentId={agent.id}
              signInPath="/agent-login"
            />
          ))}
        </div>
      )}
    </>
  );
}
