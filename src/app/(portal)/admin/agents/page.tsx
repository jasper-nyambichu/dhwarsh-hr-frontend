import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoneyCompact, formatNumber } from "@/lib/format";
import type { Agent, ChargeType } from "@/types";

/**
 * Labour agents directory (write-enabled, admin view).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Agent`, plus contact person,
 * phone, and active-placement count the list view needs as a projection.
 * Swap for `await api.get<Paginated<AgentSummary>>("/agents")` when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

type AgentRow = Pick<Agent, "id" | "name" | "chargeType"> & {
  code: string;
  contactPerson: string;
  phone: string;
  activePlacements: number;
};

const AGENTS: readonly AgentRow[] = [
  { id: 1, name: "Apex Force Ltd", code: "AG-1042", contactPerson: "Sarah Jenkins", phone: "+254 712 345 678", activePlacements: 145, chargeType: "PER_EMPLOYEE" },
  { id: 2, name: "Global Workforce", code: "AG-0891", contactPerson: "David Ochieng", phone: "+254 722 987 654", activePlacements: 89, chargeType: "FIXED" },
  { id: 3, name: "Prime Staffing", code: "AG-1102", contactPerson: "Mary Wanjiku", phone: "+254 733 112 233", activePlacements: 210, chargeType: "PER_EMPLOYEE" },
  { id: 4, name: "Reliable Hands", code: "AG-0955", contactPerson: "John Mutua", phone: "+254 700 555 444", activePlacements: 45, chargeType: "FIXED" },
  { id: 5, name: "Elite Supply Co.", code: "AG-1201", contactPerson: "Fatuma Ali", phone: "+254 755 888 999", activePlacements: 120, chargeType: "PER_EMPLOYEE" },
  { id: 6, name: "Quick Labour Link", code: "AG-0774", contactPerson: "Peter Njoroge", phone: "+254 788 222 111", activePlacements: 62, chargeType: "PERCENTAGE" },
];

const CHARGE_TYPE_LABEL: Record<ChargeType, string> = {
  FIXED: "One-off Placement",
  PERCENTAGE: "Per Head/Monthly",
  PER_EMPLOYEE: "Per Head/Monthly",
};

const CHARGE_TYPE_CHIP: Record<ChargeType, string> = {
  FIXED: "bg-surface-container-low text-on-surface-variant",
  PERCENTAGE: "bg-blue-soft text-primary-container",
  PER_EMPLOYEE: "bg-blue-soft text-primary-container",
};

export default async function AdminAgentsPage() {
  await requirePermission("agent:read");

  const activeAgentCount = AGENTS.length + 18; // matches Stitch's "24" summary tile against 6 visible rows
  const totalPlacements = AGENTS.reduce((sum, a) => sum + a.activePlacements, 0) + 1_310; // ditto, aggregate not derivable from visible rows alone

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
        <BentoCard title={null} className="col-span-12 flex flex-col justify-between lg:col-span-3">
          <div className="flex items-start justify-between">
            <span className="font-body-md font-medium text-on-surface-variant">Total Active Agents</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-container/10 text-primary">
              <Icon name="storefront" className="text-lg" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="font-card-stat text-card-stat text-on-background">{formatNumber(activeAgentCount)}</h2>
            <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-tertiary">
              <Icon name="trending_up" className="text-[12px]" />
              +3 this month
            </p>
          </div>
        </BentoCard>

        <BentoCard title={null} className="col-span-12 flex flex-col justify-between lg:col-span-3">
          <div className="flex items-start justify-between">
            <span className="font-body-md font-medium text-on-surface-variant">Total Placements</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-tertiary-container/10 text-tertiary-container">
              <Icon name="group_add" className="text-lg" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="font-card-stat text-card-stat text-on-background">{formatNumber(totalPlacements)}</h2>
            <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-tertiary">
              <Icon name="trending_up" className="text-[12px]" />
              Active contracts
            </p>
          </div>
        </BentoCard>

        <BentoCard title={null} className="col-span-12 flex items-center justify-between lg:col-span-6">
          <div className="flex-1">
            <h3 className="mb-2 font-body-md font-bold text-on-background">Pending Commissions</h3>
            <div className="flex items-end gap-3">
              <span className="font-card-stat text-card-stat text-on-background">{formatMoneyCompact(450_000)}</span>
              <span className="pb-1 text-[10px] text-on-surface-variant">Due by 5th Nov</span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-surface-container-highest">
              <div className="h-1.5 rounded-full bg-amber-main" style={{ width: "60%" }} />
            </div>
          </div>
          <div className="ml-6 shrink-0">
            <button type="button" className="rounded-lg bg-blue-soft px-4 py-1.5 text-xs font-medium text-primary-container transition-colors hover:bg-secondary-container">
              Process Payouts
            </button>
          </div>
        </BentoCard>

        <div className="col-span-12 overflow-hidden rounded-card bg-surface-container-lowest shadow-ambient-1">
          <div className="flex items-center justify-between border-b border-[#E9EFF5] p-4">
            <h3 className="font-body-md font-bold text-on-background">Registered Agents Directory</h3>
            <div className="flex gap-2">
              <button type="button" className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-primary-container transition-colors hover:bg-blue-soft">
                <Icon name="filter_list" className="text-[14px]" />
                Filter
              </button>
              <button type="button" className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-primary-container transition-colors hover:bg-blue-soft">
                <Icon name="download" className="text-[14px]" />
                Export
              </button>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Agent Details</th>
                  <th className="px-4 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Contact Person</th>
                  <th className="px-4 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Phone</th>
                  <th className="px-4 py-3 text-center font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Active Placements</th>
                  <th className="px-4 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Commission Type</th>
                  <th className="px-4 py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-background">
                {AGENTS.map((agent) => (
                  <tr key={agent.id} className="group border-b border-[#E9EFF5] transition-colors last:border-0 hover:bg-[#f6fafe]">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded border border-primary-container/20 bg-primary-container/10 text-xs font-bold text-primary"
                        >
                          {agent.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                        <span>
                          <span className="block font-semibold text-primary">{agent.name}</span>
                          <span className="block text-[10px] text-on-surface-variant">ID: {agent.code}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">{agent.contactPerson}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">{agent.phone}</td>
                    <td className="px-4 py-3 text-center font-semibold">{formatNumber(agent.activePlacements)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${CHARGE_TYPE_CHIP[agent.chargeType]}`}>
                        {CHARGE_TYPE_LABEL[agent.chargeType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" title="Edit" className="p-1 text-on-surface-variant transition-colors hover:text-primary">
                          <Icon name="edit" className="text-[18px]" />
                        </button>
                        <button type="button" title="Deactivate" className="p-1 text-on-surface-variant transition-colors hover:text-error">
                          <Icon name="block" className="text-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#E9EFF5] bg-white p-4 text-xs text-on-surface-variant">
            <span>Showing 1 to {AGENTS.length} of 24 agents</span>
            <div className="flex gap-1">
              <button type="button" disabled className="rounded border border-[#E9EFF5] px-2 py-1 hover:bg-surface-container-low disabled:opacity-50">
                &lt;
              </button>
              <button type="button" className="rounded border border-primary bg-primary px-2 py-1 text-white">1</button>
              <button type="button" className="rounded border border-[#E9EFF5] px-2 py-1 hover:bg-surface-container-low">2</button>
              <button type="button" className="rounded border border-[#E9EFF5] px-2 py-1 hover:bg-surface-container-low">3</button>
              <button type="button" className="rounded border border-[#E9EFF5] px-2 py-1 hover:bg-surface-container-low">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}