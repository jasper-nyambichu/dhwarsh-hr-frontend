// src/app/(portal)/finance/loans/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<LoanRecord[]>("/finance/loans")`.
 * ─────────────────────────────────────────────────────────────────────────
 */
interface LoanRecord {
  id: string;
  name: string;
  employeeId: string;
  avatarUrl?: string;
  initials?: string;
  principal: string;
  remaining: string;
  monthlyDeduction: string;
  status: "Active" | "At Risk" | "Settled";
}

const LOANS: LoanRecord[] = [
  { id: "1", name: "David Ochieng", employeeId: "EMP-0142", avatarUrl: "/avatars/david-o.jpg", principal: "KES 500,000", remaining: "KES 320,000", monthlyDeduction: "KES 25,000", status: "Active" },
  { id: "2", name: "Grace Wanjiru", employeeId: "EMP-0211", avatarUrl: "/avatars/grace.jpg", principal: "KES 1,200,000", remaining: "KES 1,150,000", monthlyDeduction: "KES 45,000", status: "At Risk" },
  { id: "3", name: "John Kamau", employeeId: "EMP-0089", initials: "JK", principal: "KES 200,000", remaining: "KES 0", monthlyDeduction: "KES 0", status: "Settled" },
  { id: "4", name: "Brian Mutua", employeeId: "EMP-0334", avatarUrl: "/avatars/brian.jpg", principal: "KES 750,000", remaining: "KES 410,000", monthlyDeduction: "KES 32,000", status: "Active" },
];

function statusBadge(status: LoanRecord["status"]) {
  switch (status) {
    case "Active":
      return "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary-fixed-dim/50";
    case "At Risk":
      return "bg-error-container text-on-error-container border-error/20";
    case "Settled":
      return "bg-surface-variant text-on-surface-variant border-outline-variant/30";
  }
}

export default async function LoanPortfolioPage() {
  await requirePermission("loan:read");

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Loan Portfolio</h1>
          <p className="mt-1 text-xs text-on-surface-variant">Overview of active employee loans and recovery metrics.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#0B2A45] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-container">
          <Icon name="add" className="text-[18px]" />
          Issue New Loan
        </button>
      </div>

      <div className="mb-gutter grid grid-cols-12 gap-gutter">
        <MetricCard label="Total Outstanding" value="KES 14,250,000" icon="account_balance_wallet" iconBg="bg-primary-fixed" iconColor="text-primary" trend="-2.4% vs last month" trendIcon="trending_down" trendColor="text-tertiary-container" />
        <MetricCard label="Recovery Rate" value="94.8%" icon="task_alt" iconBg="bg-tertiary-fixed" iconColor="text-tertiary" trend="+1.2% vs last month" trendIcon="trending_up" trendColor="text-tertiary-container" />
        <MetricCard label="Default Rate" value="2.1%" icon="warning" iconBg="bg-error-container" iconColor="text-error" trend="Stable" trendIcon="horizontal_rule" trendColor="text-on-surface-variant" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-container-highest bg-white shadow-[0_2px_8px_rgba(11,42,69,.06)]">
        <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-bright/50 p-6">
          <h3 className="text-base font-semibold text-on-surface">Employee Loan Portfolio</h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-surface-container">
              <Icon name="filter_list" className="text-[16px]" />
              Filter
            </button>
            <button className="flex items-center gap-1 rounded-lg bg-[#E6F0F8] px-3 py-1.5 text-sm font-bold text-[#1C6EB4] transition-colors hover:bg-primary-fixed">
              <Icon name="download" className="text-[16px]" />
              Export
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E9EFF5]">
                <th className="bg-surface-bright/30 px-6 py-4 text-[10px] font-semibold uppercase text-on-surface-variant">Employee</th>
                <th className="bg-surface-bright/30 px-6 py-4 text-[10px] font-semibold uppercase text-on-surface-variant">Principal Amount</th>
                <th className="bg-surface-bright/30 px-6 py-4 text-[10px] font-semibold uppercase text-on-surface-variant">Remaining Balance</th>
                <th className="bg-surface-bright/30 px-6 py-4 text-[10px] font-semibold uppercase text-on-surface-variant">Monthly Deduction</th>
                <th className="bg-surface-bright/30 px-6 py-4 text-[10px] font-semibold uppercase text-on-surface-variant">Status</th>
                <th className="bg-surface-bright/30 px-6 py-4 text-right text-[10px] font-semibold uppercase text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EFF5]">
              {LOANS.map((loan) => (
                <tr key={loan.id} className="group transition-colors hover:bg-background">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {loan.avatarUrl ? (
                        <div className="size-8 overflow-hidden rounded-full bg-surface-container">
                          <img src={loan.avatarUrl} alt={loan.name} className="size-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-primary">
                          {loan.initials}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-on-surface">{loan.name}</div>
                        <div className="text-[10px] text-on-surface-variant">{loan.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm">{loan.principal}</td>
                  <td className="px-6 py-3 text-sm font-medium">{loan.remaining}</td>
                  <td className="px-6 py-3 text-sm">{loan.monthlyDeduction}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold ${statusBadge(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button className="rounded p-1 text-primary opacity-0 transition-all hover:bg-surface-container group-hover:opacity-100">
                      <Icon name="more_vert" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-surface-container-high bg-surface-bright/50 p-4 text-xs text-on-surface-variant">
          <span>Showing 1 to 4 of 124 entries</span>
          <div className="flex gap-1">
            <button className="rounded border border-outline-variant px-2 py-1 hover:bg-surface-container disabled:opacity-50" disabled>
              Prev
            </button>
            <button className="rounded bg-primary px-2 py-1 text-white">1</button>
            <button className="rounded border border-outline-variant px-2 py-1 hover:bg-surface-container">2</button>
            <button className="rounded border border-outline-variant px-2 py-1 hover:bg-surface-container">3</button>
            <button className="rounded border border-outline-variant px-2 py-1 hover:bg-surface-container">Next</button>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
  trendIcon,
  trendColor,
}: {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend: string;
  trendIcon: string;
  trendColor: string;
}) {
  return (
    <div className="col-span-12 flex h-full flex-col justify-between rounded-2xl border border-surface-container-highest bg-white p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)] md:col-span-4">
      <div className="flex items-start justify-between">
        <span className="text-sm text-on-surface-variant">{label}</span>
        <div className={`flex size-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          <Icon name={icon} className="text-[18px]" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-on-surface">{value}</div>
        <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <Icon name={trendIcon} className="text-[14px]" />
          {trend}
        </div>
      </div>
    </div>
  );
}