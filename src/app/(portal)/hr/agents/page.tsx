// src/app/(portal)/hr/agents/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<LabourAgent[]>("/hr/agents")`.
 * Note: this is distinct from the Agent Portal's own `agent/*` routes —
 * this page is HR's internal view of external labour-supply agents.
 * ─────────────────────────────────────────────────────────────────────────
 */
interface LabourAgent {
  id: string;
  name: string;
  code: string;
  initials: string;
  contact: string;
  staffDeployed: number;
  activeContracts: number;
  outstanding: string;
  status: "Active" | "Suspended" | "Review";
}

const AGENTS: LabourAgent[] = [
  { id: "1", name: "Strategic Labour Ltd", code: "AGN-001", initials: "SL", contact: "John Kamau", staffDeployed: 45, activeContracts: 3, outstanding: "KES 1,250,000", status: "Active" },
  { id: "2", name: "ProSource HR", code: "AGN-002", initials: "PR", contact: "Sarah Ochieng", staffDeployed: 112, activeContracts: 5, outstanding: "KES 3,400,000", status: "Active" },
  { id: "3", name: "Metro Manpower", code: "AGN-005", initials: "MM", contact: "David Mutua", staffDeployed: 28, activeContracts: 1, outstanding: "KES 850,000", status: "Suspended" },
  { id: "4", name: "Elite Kazi Solutions", code: "AGN-008", initials: "EK", contact: "Grace Wanjiku", staffDeployed: 65, activeContracts: 2, outstanding: "KES 1,920,000", status: "Active" },
  { id: "5", name: "Apex Workforce", code: "AGN-012", initials: "AW", contact: "Peter Njoroge", staffDeployed: 18, activeContracts: 1, outstanding: "KES 450,000", status: "Active" },
  { id: "6", name: "First Staffing Group", code: "AGN-015", initials: "FS", contact: "Mercy Kiprop", staffDeployed: 84, activeContracts: 4, outstanding: "KES 2,100,000", status: "Review" },
];

const TOP_BY_HEADCOUNT = [...AGENTS].sort((a, b) => b.staffDeployed - a.staffDeployed).slice(0, 4);

function statusBadge(status: LabourAgent["status"]) {
  switch (status) {
    case "Active":
      return "bg-[#E6F4EA] text-[#137333]";
    case "Suspended":
      return "bg-[#FCE8E6] text-[#C5221F]";
    case "Review":
      return "bg-[#FEF7E0] text-[#B06000]";
  }
}

export default async function LabourAgentsPage() {
  await requirePermission("agent:write");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-bold text-on-surface">Labour Agents</h1>
          <p className="text-sm text-on-surface-variant">Suppliers of outsourced staff.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant">
          <Icon name="add" className="text-[18px]" />
          Add Agent
        </button>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <div className="flex-1 rounded-2xl bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">Active Labour Agents</h2>
              <button className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-surface-container-low">
                <Icon name="filter_list" className="text-[16px]" />
                Filter
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-container-high text-[10px] font-semibold uppercase text-on-surface-variant">
                    <th className="pb-3 pr-4">Agent</th>
                    <th className="px-4 pb-3">Contact</th>
                    <th className="px-4 pb-3 text-center">Staff Deployed</th>
                    <th className="px-4 pb-3 text-center">Active Contracts</th>
                    <th className="px-4 pb-3 text-right">Outstanding</th>
                    <th className="pb-3 pl-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENTS.map((agent, i) => (
                    <tr
                      key={agent.id}
                      className={`group cursor-pointer border-dashed transition-colors hover:bg-surface-bright ${i < AGENTS.length - 1 ? "border-b border-surface-container" : ""}`}
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container font-bold text-primary">
                            {agent.initials}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-on-surface">{agent.name}</div>
                            <div className="mt-0.5 text-[11px] text-on-surface-variant">{agent.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-on-surface">{agent.contact}</td>
                      <td className="px-4 py-4 text-center font-semibold text-on-surface">{agent.staffDeployed}</td>
                      <td className="px-4 py-4 text-center text-on-surface-variant">{agent.activeContracts}</td>
                      <td className="px-4 py-4 text-right font-medium text-on-surface">{agent.outstanding}</td>
                      <td className="py-4 pl-4 text-center">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold ${statusBadge(agent.status)}`}>
                          {agent.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <div className="flex w-full rounded-lg border border-surface-container-high bg-surface-container-low p-1 shadow-sm">
            <button className="flex-1 rounded-md bg-surface-container-lowest py-1.5 text-xs font-semibold text-primary shadow-sm">Active (14)</button>
            <button className="flex-1 rounded-md py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface">Inactive (3)</button>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">Top by Headcount</h3>
              <Icon name="groups" className="text-[20px] text-outline-variant" />
            </div>
            <div className="flex flex-col gap-3">
              {TOP_BY_HEADCOUNT.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-surface-container hover:bg-surface-bright">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{agent.initials}</div>
                    <div className="text-sm font-semibold text-on-surface">{agent.name}</div>
                  </div>
                  <div className="rounded bg-surface-container-low px-2 py-0.5 text-sm font-bold text-on-surface">{agent.staffDeployed}</div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-xs font-semibold text-primary hover:underline">View All Agents</button>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">Contract Distribution</h3>
              <Icon name="donut_small" className="text-[20px] text-outline-variant" />
            </div>
            <div className="mb-6 flex justify-center">
              <div
                className="flex size-32 items-center justify-center rounded-full shadow-inner"
                style={{ background: "conic-gradient(#1C6EB4 0% 40%, #F97316 40% 70%, #0B2A45 70% 100%)" }}
              >
                <div className="flex size-20 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
                  <span className="text-lg font-bold text-on-surface">17</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <ContractRow color="bg-primary-container" label="Fixed Rate" pct="40%" />
              <ContractRow color="bg-[#F97316]" label="Percentage Base" pct="30%" />
              <ContractRow color="bg-[#0B2A45]" label="Per-Employee" pct="30%" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ContractRow({ color, label, pct }: { color: string; label: string; pct: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`size-3 rounded-sm ${color}`} />
        <span className="text-on-surface-variant">{label}</span>
      </div>
      <span className="font-semibold text-on-surface">{pct}</span>
    </div>
  );
}