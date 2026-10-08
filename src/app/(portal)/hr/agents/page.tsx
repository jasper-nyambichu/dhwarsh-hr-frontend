import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getAgents } from "@/lib/api/agent";
import { formatDate, formatMoney, formatNumber, humanizeEnum, initials } from "@/lib/format";
import { buildHref, first } from "@/lib/search-params";
import type { AgentResponse, ChargeType } from "@/types";

/**
 * Labour agents — HR's read-only view of the external staff suppliers.
 *
 * Read-only is not a design choice. `roles.ts` grants HR_MANAGER `agent:write`,
 * but no agent write endpoint admits the role: `POST` and `PUT /agents` are
 * SUPER_ADMIN/ADMIN, and `PUT /agents/{id}/deactivate` is SUPER_ADMIN alone. So
 * there is no Add/Edit/Deactivate control on this page — rendering one would be
 * a button that 403s.
 *
 * Two columns the old placeholder carried are gone because nothing can produce
 * them: "Outstanding" (agent advances are their own module with their own
 * status, not a per-agent total the API exposes) and "Active Contracts" (there
 * is no contract entity — an agent has one contract window, the start and end
 * dates on the row itself).
 */
export default async function LabourAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await requirePermission("agent:read");

  const params = await searchParams;
  const statusFilter = first(params.status);

  let agents: AgentResponse[];

  try {
    agents = await getAgents();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Labour Agents"
        description="Suppliers of outsourced staff."
        subject="The agent list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const visible =
    statusFilter === "ACTIVE" || statusFilter === "INACTIVE"
      ? agents.filter((agent) => agent.status === statusFilter)
      : agents;

  const byHeadcount = [...agents]
    .sort((a, b) => (b.employeeCount ?? 0) - (a.employeeCount ?? 0))
    .slice(0, 5);

  const chargeSplit = splitByChargeType(agents);

  return (
    <>
      <PageHeader
        title="Labour Agents"
        description="Suppliers of outsourced staff."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip label="All" count={agents.length} href="/hr/agents" active={!statusFilter} />
        <FilterChip
          label="Active"
          count={agents.filter((agent) => agent.status === "ACTIVE").length}
          href={buildHref("/hr/agents", { status: "ACTIVE" })}
          active={statusFilter === "ACTIVE"}
        />
        <FilterChip
          label="Inactive"
          count={agents.filter((agent) => agent.status === "INACTIVE").length}
          href={buildHref("/hr/agents", { status: "INACTIVE" })}
          active={statusFilter === "INACTIVE"}
        />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="handshake" className="text-[20px] text-primary" />
                Agents
              </span>
            }
            action={
              <span className="font-body-md text-[11px] text-outline">
                {formatNumber(visible.length)}{" "}
                {visible.length === 1 ? "agent" : "agents"}
              </span>
            }
          >
            {visible.length === 0 ? (
              <EmptyState
                symbol="handshake"
                title={statusFilter ? `No ${statusFilter.toLowerCase()} agents` : "No agents"}
                description="Labour agents are created by an administrator; HR sees them but cannot add one."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-md text-body-md">
                  <thead>
                    <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                      <th className="pb-3 pr-4">Agent</th>
                      <th className="pb-3 pr-4">Contact</th>
                      <th className="pb-3 pr-4 text-center">Deployed</th>
                      <th className="pb-3 pr-4">Charge</th>
                      <th className="pb-3 pr-4">Contract</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((agent) => (
                      <tr
                        key={agent.id}
                        className="border-b border-outline-variant/25 last:border-0 hover:bg-surface-container-low/40"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/hr/agents/${agent.id}`}
                            className="group flex items-center gap-3"
                          >
                            <span
                              aria-hidden
                              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-container/20 text-[11px] font-bold text-primary"
                            >
                              {initials(agent.name)}
                            </span>
                            <span>
                              <span className="block font-semibold text-on-surface group-hover:text-primary">
                                {agent.name}
                              </span>
                              <span className="block text-[11px] text-outline">
                                {agent.kraPin ?? "No KRA PIN on file"}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-on-surface-variant">
                          <span className="block">
                            {agent.contactPerson ?? "—"}
                          </span>
                          <span className="block text-[11px] text-outline">
                            {agent.phone ?? agent.email ?? "No contact details"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center tabular-nums text-on-surface-variant">
                          {agent.employeeCount === null
                            ? "—"
                            : formatNumber(agent.employeeCount)}
                        </td>
                        <td className="py-3 pr-4 text-on-surface-variant">
                          {describeCharge(agent)}
                        </td>
                        <td className="py-3 pr-4 text-[12px] text-on-surface-variant">
                          {agent.contractStartDate || agent.contractEndDate
                            ? `${agent.contractStartDate ? formatDate(agent.contractStartDate) : "—"} → ${
                                agent.contractEndDate ? formatDate(agent.contractEndDate) : "open"
                              }`
                            : "Not set"}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={agent.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>

          <p className="mt-4 text-[11px] text-outline">
            Read-only. HR holds an <code>agent:write</code> permission in the
            frontend role config, but no agent write endpoint accepts the role —
            creating, editing and deactivating agents is an administrator task.
          </p>
        </div>

        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="groups" className="text-[20px] text-primary" />
                Top by Headcount
              </span>
            }
          >
            {byHeadcount.length === 0 ? (
              <EmptyState
                symbol="groups"
                title="Nothing to rank"
                description="No agents are registered."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {byHeadcount.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/hr/agents/${agent.id}`}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-container-low"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary"
                      >
                        {initials(agent.name)}
                      </span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        {agent.name}
                      </span>
                    </span>
                    <span className="rounded bg-surface-container-low px-2 py-0.5 font-body-md text-body-md font-bold tabular-nums text-on-surface">
                      {agent.employeeCount === null
                        ? "—"
                        : formatNumber(agent.employeeCount)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="donut_small" className="text-[20px] text-primary" />
                How Agents Charge
              </span>
            }
          >
            {chargeSplit.length === 0 ? (
              <EmptyState
                symbol="donut_small"
                title="No agents"
                description="The breakdown appears once an agent exists."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {chargeSplit.map((row) => (
                  <div key={row.chargeType} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between font-body-md text-body-md">
                      <span className="text-on-surface-variant">{row.label}</span>
                      <span className="font-semibold tabular-nums text-on-surface">
                        {formatNumber(row.count)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-1.5 rounded-full bg-primary-container"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-outline">
                  Counted from the {formatNumber(agents.length)}{" "}
                  {agents.length === 1 ? "agent" : "agents"} in the list, not
                  from contracts — an agent has one charge type, not a portfolio.
                </p>
              </div>
            )}
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function FilterChip({
  label,
  count,
  href,
  active,
}: {
  label: string;
  count: number;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 font-body-md text-[12px] transition-colors ${
        active
          ? "border-primary-container bg-primary-container/10 font-semibold text-primary"
          : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      {label} ({formatNumber(count)})
    </Link>
  );
}

/**
 * `chargeType` decides which of the two amount columns is meaningful — the
 * backend allows both to be set at once, so the type is what makes the number
 * readable rather than the presence of a value.
 */
function describeCharge(agent: AgentResponse): string {
  if (agent.chargeType === "PERCENTAGE_OF_GROSS") {
    return agent.chargePercentage === null
      ? "Percentage — rate not set"
      : `${agent.chargePercentage}%`;
  }

  if (agent.chargeAmount === null) {
    return `${humanizeEnum(agent.chargeType)} — amount not set`;
  }

  return `${formatMoney(agent.chargeAmount)}${agent.chargeType === "PER_EMPLOYEE" ? "/employee" : ""}`;
}

function splitByChargeType(agents: AgentResponse[]) {
  const counts = new Map<ChargeType, number>();

  for (const agent of agents) {
    counts.set(agent.chargeType, (counts.get(agent.chargeType) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([chargeType, count]) => ({
      chargeType,
      count,
      label: humanizeEnum(chargeType),
      pct: agents.length === 0 ? 0 : Math.round((count / agents.length) * 100),
    }));
}
