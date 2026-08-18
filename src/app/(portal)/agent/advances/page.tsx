import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatMoney, formatMoneyCompact, initials } from "@/lib/format";

/**
 * Agent advance requests.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — this maps to `POST /agent-advances` and
 * `GET /agent-advances/my-advances`, but the response shape for a list
 * view (with employee name/department) isn't documented. Swap for
 * `await api.get<Paginated<AgentAdvance>>("/agent-advances/my-advances")`
 * once confirmed — note `types.AgentAdvance` doesn't carry a "purpose" or
 * "recovery period" field either, so the DTO may need extending.
 * ─────────────────────────────────────────────────────────────────────────
 */

type AdvanceStatus = "PENDING" | "APPROVED" | "REJECTED";

type AdvanceRow = {
  id: number;
  employeeName: string;
  department: string;
  amount: number;
  requestedDate: string;
  purpose: string;
  recoveryMonths: number;
  status: AdvanceStatus;
};

const ADVANCES: readonly AdvanceRow[] = [
  { id: 1, employeeName: "James Ochieng", department: "Sales Dept", amount: 50_000, requestedDate: "2026-10-24", purpose: "Medical Emergency", recoveryMonths: 3, status: "PENDING" },
  { id: 2, employeeName: "Sarah Mutua", department: "Marketing", amount: 25_000, requestedDate: "2026-10-22", purpose: "School Fees", recoveryMonths: 1, status: "APPROVED" },
  { id: 3, employeeName: "David Kamau", department: "IT Support", amount: 100_000, requestedDate: "2026-10-20", purpose: "Car Repair", recoveryMonths: 6, status: "APPROVED" },
  { id: 4, employeeName: "Alice Nduta", department: "HR Dept", amount: 15_000, requestedDate: "2026-10-18", purpose: "Personal", recoveryMonths: 1, status: "REJECTED" },
  { id: 5, employeeName: "Erick Wanjala", department: "Logistics", amount: 80_000, requestedDate: "2026-10-15", purpose: "Home Renovation", recoveryMonths: 4, status: "PENDING" },
  { id: 6, employeeName: "Catherine Mwangi", department: "Finance", amount: 40_000, requestedDate: "2026-10-10", purpose: "Relocation", recoveryMonths: 2, status: "APPROVED" },
];

const STATUS_CHIP: Record<AdvanceStatus, string> = {
  PENDING: "bg-orange/10 text-orange border border-orange/20",
  APPROVED: "bg-green-main/10 text-green-main border border-green-main/20",
  REJECTED: "bg-error/10 text-error border border-error/20",
};

export default async function AgentAdvancesPage() {
  await requirePermission("agentadvance:read:self");

  const pendingCount = ADVANCES.filter((a) => a.status === "PENDING").length;
  const approvedThisMonth = ADVANCES.filter((a) => a.status === "APPROVED").reduce((sum, a) => sum + a.amount, 0);

  return (
    <>
      <PageHeader
        title="Advance Requests"
        description="Manage and track employee salary advances."
        actions={
          <button type="button" className="flex items-center gap-2 rounded-lg bg-orange px-6 py-2 font-bold text-white shadow-md transition-transform hover:-translate-y-0.5">
            <Icon name="add" className="text-sm" />
            Request Advance
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Total Pending" value={`${pendingCount} Requests`} icon="pending_actions" tone="tertiary" hint="+2 since last week" />
        <MetricCard label="Approved This Month" value={formatMoneyCompact(approvedThisMonth)} icon="check_circle" tone="tertiary" hint="+15% vs last month" />
        <MetricCard label="Active Recoveries" value="34 Employees" icon="autorenew" tone="primary" hint={`${formatMoney(120_000)} pending recovery`} />
      </div>

      <BentoCard
        className="mt-gutter"
        title="Recent Requests History"
        action={
          <div className="flex gap-2">
            <button type="button" className="flex items-center gap-1 rounded-md border border-outline-variant px-3 py-1.5 font-body-md text-body-md font-medium text-primary transition-colors hover:bg-surface-container-low">
              <Icon name="filter_list" className="text-[16px]" />
              Filter
            </button>
            <button type="button" className="flex items-center gap-1 rounded-md border border-outline-variant px-3 py-1.5 font-body-md text-body-md font-medium text-primary transition-colors hover:bg-surface-container-low">
              <Icon name="download" className="text-[16px]" />
              Export
            </button>
          </div>
        }
      >
        <div className="w-full overflow-x-auto">
          <table className="data-table w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Amount (KES)</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Requested</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Purpose</th>
                <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Recovery</th>
                <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-on-surface">
              {ADVANCES.map((advance) => (
                <tr key={advance.id} className="border-b border-surface-variant/50 transition-colors hover:bg-surface-container-low">
                  <td className="py-4">
                    {/* Flex on a wrapper, not the <td> — a flex cell drops out
                        of the table layout and desyncs from its header. */}
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed-dim text-xs font-bold text-primary">
                        {initials(advance.employeeName)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{advance.employeeName}</span>
                        <span className="block truncate text-xs text-on-surface-variant">{advance.department}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-4 font-medium tabular-nums">{formatMoney(advance.amount, { showCurrency: false })}</td>
                  <td className="whitespace-nowrap py-4 text-on-surface-variant">{formatDate(advance.requestedDate)}</td>
                  <td className="py-4">{advance.purpose}</td>
                  <td className="whitespace-nowrap py-4">{advance.recoveryMonths} Month{advance.recoveryMonths > 1 ? "s" : ""}</td>
                  <td className="py-4 text-right">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CHIP[advance.status]}`}>
                      {advance.status.charAt(0) + advance.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-surface-variant pt-4 text-sm text-on-surface-variant">
          <span>Showing 1 to {ADVANCES.length} of 24 requests</span>
          <div className="flex gap-1">
            <button type="button" disabled className="rounded px-2 py-1 hover:bg-surface-container-high disabled:opacity-50">
              &lt; Prev
            </button>
            <button type="button" className="rounded bg-primary px-2 py-1 text-white">1</button>
            <button type="button" className="rounded px-2 py-1 hover:bg-surface-container-high">2</button>
            <button type="button" className="rounded px-2 py-1 hover:bg-surface-container-high">3</button>
            <button type="button" className="rounded px-2 py-1 hover:bg-surface-container-high">Next &gt;</button>
          </div>
        </div>
      </BentoCard>
    </>
  );
}