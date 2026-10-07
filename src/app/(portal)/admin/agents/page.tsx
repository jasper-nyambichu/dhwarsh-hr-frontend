import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getAgents } from "@/lib/api/agent";
import { formatMoney, formatNumber, formatPercent, initials } from "@/lib/format";
import type { AgentResponse, ChargeType } from "@/types";

/**
 * Labour agents directory.
 *
 * Every figure on this screen comes from `GET /agents`, which returns the whole
 * table as `List<AgentResponse>` — there is no paging, so there are no page
 * controls either.
 *
 * Two tiles the Stitch brief asks for are absent rather than faked:
 * "Pending Commissions" and a month-over-month agent delta. Neither has a
 * source in the schema or the API — `agent_payroll_summaries` holds commission
 * only once a payroll run has produced it, and nothing tracks an agent
 * creation trend. An invented number on a financial screen is worse than no
 * number, so the layout drops them and keeps what is real.
 */

const CHARGE_TYPE_LABEL: Record<ChargeType, string> = {
  PER_EMPLOYEE: "Per Employee",
  PERCENTAGE_OF_GROSS: "% of Gross",
  FIXED_MONTHLY: "Fixed Monthly",
  CUSTOM: "Custom",
};

const CHARGE_TYPE_CHIP: Record<ChargeType, string> = {
  PER_EMPLOYEE: "bg-blue-soft text-primary-container",
  PERCENTAGE_OF_GROSS: "bg-tertiary-container/10 text-tertiary-container",
  FIXED_MONTHLY: "bg-surface-container-low text-on-surface-variant",
  CUSTOM: "bg-surface-container-low text-on-surface-variant",
};

/** Renders whichever of the two charge columns actually carries this agent's rate. */
function chargeLabel(agent: AgentResponse): string {
  switch (agent.chargeType) {
    case "PERCENTAGE_OF_GROSS":
      // Two decimals: the column is DECIMAL(5,2) and a commission rate rounded
      // to a whole percent would misstate the contract.
      return agent.chargePercentage === null
        ? "—"
        : `${formatPercent(agent.chargePercentage, 2)} of gross`;
    case "PER_EMPLOYEE":
    case "FIXED_MONTHLY":
      return agent.chargeAmount === null
        ? "—"
        : formatMoney(agent.chargeAmount);
    case "CUSTOM":
      return "Per contract";
  }
}

export default async function AdminAgentsPage() {
  await requirePermission("agent:read");

  let agents: AgentResponse[];

  try {
    agents = await getAgents();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Labour Agents"
        description="Manage external recruitment and labour supply partners."
        subject="The agent directory"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const activeAgents = agents.filter((agent) => agent.status === "ACTIVE");
  const totalDeployed = agents.reduce(
    (sum, agent) => sum + (agent.employeeCount ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Labour Agents"
        description="Manage external recruitment and labour supply partners."
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-bold text-white shadow-sm transition-colors hover:bg-primary hover:shadow-md"
          >
            <Icon name="add" className="text-sm" />
            Register Agent
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        <BentoCard
          title={null}
          className="col-span-12 flex flex-col justify-between lg:col-span-6"
        >
          <div className="flex items-start justify-between">
            <span className="font-body-md font-medium text-on-surface-variant">
              Active Agents
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-container/10 text-primary">
              <Icon name="storefront" className="text-lg" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="font-card-stat text-card-stat text-on-background">
              {formatNumber(activeAgents.length)}
            </h2>
            <p className="mt-1 text-[10px] font-medium text-on-surface-variant">
              of {formatNumber(agents.length)} registered
            </p>
          </div>
        </BentoCard>

        <BentoCard
          title={null}
          className="col-span-12 flex flex-col justify-between lg:col-span-6"
        >
          <div className="flex items-start justify-between">
            <span className="font-body-md font-medium text-on-surface-variant">
              Deployed Staff
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-tertiary-container/10 text-tertiary-container">
              <Icon name="group_add" className="text-lg" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="font-card-stat text-card-stat text-on-background">
              {formatNumber(totalDeployed)}
            </h2>
            <p className="mt-1 text-[10px] font-medium text-on-surface-variant">
              Outsourced employees across all agents
            </p>
          </div>
        </BentoCard>

        <div className="col-span-12 overflow-hidden rounded-card bg-surface-container-lowest shadow-ambient-1">
          <div className="flex items-center justify-between border-b border-[#E9EFF5] p-4">
            <h3 className="font-body-md font-bold text-on-background">
              Registered Agents Directory
            </h3>
          </div>

          {agents.length === 0 ? (
            <div className="p-4">
              <EmptyState
                symbol="storefront"
                title="No agents registered"
                description="Labour agents appear here once they have been added to the system."
              />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                      Agent Details
                    </th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                      Contact Person
                    </th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-center font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                      Deployed Staff
                    </th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                      Commission Type
                    </th>
                    <th className="px-4 py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-background">
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="group border-b border-[#E9EFF5] transition-colors last:border-0 hover:bg-[#f6fafe]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/agents/${agent.id}`}
                          className="flex items-center gap-3"
                        >
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center rounded border border-primary-container/20 bg-primary-container/10 text-xs font-bold text-primary"
                          >
                            {initials(agent.name)}
                          </span>
                          <span>
                            <span className="block font-semibold text-primary">
                              {agent.name}
                            </span>
                            <span className="block text-[10px] text-on-surface-variant">
                              {agent.kraPin ? `KRA: ${agent.kraPin}` : `Agent #${agent.id}`}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {agent.contactPerson ?? (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {agent.phone ?? (
                          <span className="font-body-md text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {formatNumber(agent.employeeCount ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${CHARGE_TYPE_CHIP[agent.chargeType]}`}
                        >
                          {CHARGE_TYPE_LABEL[agent.chargeType]}
                        </span>
                        <span className="mt-1 block text-[10px] text-on-surface-variant">
                          {chargeLabel(agent)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={agent.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[#E9EFF5] bg-white p-4 text-xs text-on-surface-variant">
            <span>
              {formatNumber(agents.length)}{" "}
              {agents.length === 1 ? "agent" : "agents"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
