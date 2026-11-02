import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AssignBranchForm, UserRow } from "@/components/features/users/user-rows";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { ROLES } from "@/config/roles";
import { getAgents } from "@/lib/api/agent";
import { getBranches } from "@/lib/api/branch";
import { getUsers } from "@/lib/api/user";
import type { AgentResponse, BranchResponse, UserSummaryResponse } from "@/types";

function SectionCard({ href, icon, title, description, status }: { href: string; icon: string; title: string; description: string; status: string }) {
  return (
    <Link
      href={href}
      className="bento-card group flex min-w-0 flex-col gap-4 p-4 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-card-padding"
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
          <Icon name={icon} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-on-surface group-hover:text-primary-container">{title}</span>
          <span className="mt-1 block text-sm text-on-surface-variant">{description}</span>
        </span>
        <Icon name="chevron_right" className="shrink-0 text-outline" />
      </span>
      <span className="text-sm font-medium text-on-surface">{status}</span>
    </Link>
  );
}

/** Where the Admin gives out logins: one card for branches, one for agents. */
export default async function SystemUsersPage() {
  const session = await requirePermission("user:manage");

  let users: UserSummaryResponse[];
  let branches: BranchResponse[];
  let agents: AgentResponse[];

  try {
    [users, branches, agents] = await Promise.all([getUsers(), getBranches(), getAgents()]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Users"
        description="Credentials for branches and agents."
        subject="The user directory"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const current = users.filter((user) => ROLES.includes(user.role));
  const branchLogins = current.filter((user) => (user.role === "BRANCH_MANAGER" || user.role === "BACK_OFFICE") && user.branchId !== null);
  const agentLogins = current.filter((user) => user.role === "AGENT" && user.agentId !== null);
  const needsBranch = current.filter((user) => user.role === "BACK_OFFICE" && user.branchId === null);
  const others = current.filter((user) => !branchLogins.includes(user) && !agentLogins.includes(user) && !needsBranch.includes(user));
  const branchOptions = branches.map((branch) => ({ id: branch.id, name: branch.name }));

  return (
    <>
      <PageHeader
        title="Users"
        description="Set the username and password for each branch and agent."
        pill={<CountPill label={`${current.filter((user) => user.active).length} Active`} />}
      />

      <div className="flex flex-col gap-gutter">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <SectionCard
            href="/admin/users/branches"
            icon="account_balance"
            title="Branches"
            description="A Branch Manager and a Back Office login for each branch."
            status={`${branchLogins.length} of ${branches.length * 2} logins set`}
          />
          <SectionCard
            href="/admin/users/agents"
            icon="handshake"
            title="Agents"
            description="A login for each agent to manage their own portal."
            status={`${agentLogins.length} of ${agents.length} logins set`}
          />
        </div>

        {needsBranch.length > 0 ? (
          <BentoCard title="Back Office without a branch" subtitle="Choose a branch. They will then see that branch only.">
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {needsBranch.map((user) => (
                <li key={user.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-amber-main/40 p-3">
                  <UserRow user={user} canDelete={user.id !== session.userId} />
                  <AssignBranchForm userId={user.id} currentBranchId={null} branches={branchOptions} />
                </li>
              ))}
            </ul>
          </BentoCard>
        ) : null}

        {others.length > 0 ? (
          <BentoCard title="Administrators and other accounts">
            <ul className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
              {others.map((user) => (
                <li key={user.id} className="min-w-0">
                  <UserRow user={user} showRole canDelete={user.id !== session.userId} />
                </li>
              ))}
            </ul>
          </BentoCard>
        ) : null}
      </div>
    </>
  );
}
