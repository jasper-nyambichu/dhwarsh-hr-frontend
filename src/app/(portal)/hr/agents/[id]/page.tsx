import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatMoney, formatMoneyCompact, initials } from "@/lib/format";
import type { Agent } from "@/types";

/**
 * Agent detail — HR view (read-only, no contract edit affordances).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Agent`, plus deployed-staff
 * and invoice-history rows the detail view needs as a projection. Swap for
 * `await api.get<Agent>(`/agents/${id}`)` when ready. Unlike
 * /admin/agents/[id], HR sees contract terms as read-only labels — no form.
 * ─────────────────────────────────────────────────────────────────────────
 */

const AGENT: Agent & { outstandingAdvances: number; utilisationPct: number } = {
  id: 1,
  name: "Strategic Labour Ltd",
  contactPerson: null,
  phone: null,
  email: null,
  address: null,
  bankName: null,
  bankAccountNumber: null,
  kraPin: null,
  contractStartDate: "2024-01-01",
  contractEndDate: "2024-12-31",
  chargeType: "PER_EMPLOYEE",
  chargeAmount: 1_500,
  chargePercentage: null,
  vatRegistered: true,
  status: "ACTIVE",
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
  outstandingAdvances: 45_000,
  utilisationPct: 35,
};

const DEPLOYED_STAFF = [
  { id: 1, name: "John Mwangi", code: "EMP-001", branch: "Nairobi CBD", role: "Security Officer", rate: 1_500, status: "DEPLOYED" as const },
  { id: 2, name: "Sarah Wanjiku", code: "EMP-045", branch: "Mombasa Port", role: "Logistics Clerk", rate: 2_000, status: "DEPLOYED" as const },
  { id: 3, name: "Peter Kiprono", code: "EMP-112", branch: "Nakuru Branch", role: "Janitor", rate: 1_200, status: "DEPLOYED" as const },
  { id: 4, name: "Alice Ochieng", code: "EMP-204", branch: "Kisumu HQ", role: "Data Entry", rate: 1_800, status: "LEAVE" as const },
  { id: 5, name: "Daniel Kamau", code: "EMP-315", branch: "Nairobi West", role: "Driver", rate: 2_200, status: "DEPLOYED" as const },
];

const INVOICES = [
  { id: 1, period: "Oct 2026", amount: 850_000 },
  { id: 2, period: "Sep 2026", amount: 825_500 },
  { id: 3, period: "Aug 2026", amount: 860_000 },
  { id: 4, period: "Jul 2026", amount: 840_000 },
  { id: 5, period: "Jun 2026", amount: 810_000 },
] as const;

const STATUS_CHIP = {
  DEPLOYED: "bg-tertiary-container/10 text-tertiary-container",
  LEAVE: "bg-error-container/30 text-error",
} as const;

export default async function HrAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("agent:read");
  const { id } = await params;
  const agent = AGENT; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-4">
            <button type="button" className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container-low hover:-translate-y-px">
              <Icon name="arrow_back_ios_new" />
            </button>
            <span className="flex items-center gap-3">
              {agent.name}
              <span className="rounded-full border border-tertiary-fixed bg-tertiary-fixed/30 px-3 py-1 font-table-header text-table-header uppercase text-tertiary">
                {agent.status === "ACTIVE" ? "Active" : "Inactive"}
              </span>
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title="Deployed Staff"
            action={
              <button type="button" className="flex items-center gap-1 font-body-md text-body-md font-medium text-primary transition-colors hover:text-primary-container">
                View All
                <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pr-4 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                    <th className="px-4 pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Branch</th>
                    <th className="px-4 pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Role</th>
                    <th className="px-4 pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Rate</th>
                    <th className="pb-3 pl-4 text-center font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {DEPLOYED_STAFF.map((staff) => (
                    <tr key={staff.id} className="group border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface-container-low/50">
                      <td className="py-4 pr-4">
                        <span className="flex items-center gap-3">
                          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-[10px] font-bold text-primary">
                            {initials(staff.name)}
                          </span>
                          <span>
                            <span className="block font-medium text-on-surface transition-colors group-hover:text-primary">{staff.name}</span>
                            <span className="block text-[10px] text-outline">{staff.code}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant">{staff.branch}</td>
                      <td className="px-4 py-4 text-on-surface-variant">{staff.role}</td>
                      <td className="px-4 py-4 text-right font-medium tabular-nums text-on-surface">{formatMoney(staff.rate)}/day</td>
                      <td className="py-4 pl-4 text-center">
                        <span className={`inline-block rounded px-2 py-1 text-[10px] font-medium ${STATUS_CHIP[staff.status]}`}>
                          {staff.status === "DEPLOYED" ? "Deployed" : "On Leave"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="description" className="text-primary" />
                Contract Terms
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <ReadOnlyField label="Charge Type" value="Per-Employee" />
              <ReadOnlyField label="Amount" value={`${formatMoney(agent.chargeAmount ?? 0)}/day`} />
              <ReadOnlyField
                label="VAT-Registered"
                value={
                  <span className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-[16px] text-tertiary" />
                    {agent.vatRegistered ? "Yes" : "No"}
                  </span>
                }
              />
              <ReadOnlyField label="Start Date" value={formatDate(agent.contractStartDate)} />
              <ReadOnlyField label="End Date" value={formatDate(agent.contractEndDate)} />
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <div className="relative overflow-hidden rounded-card border border-surface-container bg-surface-container-lowest p-card-padding shadow-ambient-1 transition-all hover:-translate-y-0.5 hover:shadow-ambient-2">
            <span className="pointer-events-none absolute right-4 top-4 text-error opacity-10">
              <Icon name="account_balance_wallet" className="text-[64px]" />
            </span>
            <h3 className="relative z-10 mb-2 font-medium text-on-surface-variant">Outstanding Advances</h3>
            <div className="relative z-10 mb-4 font-card-stat text-[28px] text-on-surface">{formatMoneyCompact(agent.outstandingAdvances)}</div>
            <div className="relative z-10 mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-1.5 rounded-full bg-error" style={{ width: `${agent.utilisationPct}%` }} />
            </div>
            <p className="relative z-10 mt-2 text-[10px] text-outline">{agent.utilisationPct}% of monthly allocation used</p>
          </div>

          <BentoCard title="Recent Invoices" action={<Icon name="more_vert" className="text-on-surface-variant" />}>
            <div className="flex flex-col">
              <div className="grid grid-cols-12 gap-2 border-b border-outline-variant/30 pb-2 font-table-header text-[10px] uppercase tracking-wider text-outline">
                <div className="col-span-4">Period</div>
                <div className="col-span-5 text-right">Amount</div>
                <div className="col-span-3 text-center">Status</div>
              </div>
              {INVOICES.map((inv) => (
                <div key={inv.id} className="grid grid-cols-12 items-center gap-2 border-b border-outline-variant/20 py-3 transition-colors last:border-0 hover:bg-surface-container-low/30">
                  <div className="col-span-4 font-medium text-on-surface">{inv.period}</div>
                  <div className="col-span-5 text-right font-medium text-on-surface">{formatMoney(inv.amount)}</div>
                  <div className="col-span-3 text-center">
                    <span className="inline-block size-2 rounded-full bg-tertiary" />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="mt-4 w-full rounded-lg border border-primary py-2 text-[12px] font-medium text-primary transition-colors hover:bg-primary-container/10">
              View Full History
            </button>
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</span>
      <span className="rounded-lg border border-surface-container-highest bg-surface-container-low px-3 py-2 font-medium text-on-surface">
        {value}
      </span>
    </div>
  );
}