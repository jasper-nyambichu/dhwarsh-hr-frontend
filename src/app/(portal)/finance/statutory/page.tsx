// src/app/(portal)/finance/statutory/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for real statutory obligations + filing history fetches.
 * ─────────────────────────────────────────────────────────────────────────
 */
const OBLIGATIONS = [
  { code: "PAYE", amount: "1,245,600", due: "Due: 9th Nov 2023", status: "Pending" as const, icon: "account_balance_wallet", iconBg: "bg-primary-fixed", iconColor: "text-primary" },
  { code: "NSSF", amount: "340,200", due: "Due: 9th Nov 2023", status: "Filed" as const, icon: "savings", iconBg: "bg-tertiary-fixed", iconColor: "text-tertiary" },
  { code: "SHIF", amount: "185,450", due: "Due: 9th Nov 2023", status: "Pending" as const, icon: "health_and_safety", iconBg: "bg-secondary-fixed", iconColor: "text-secondary" },
  { code: "Housing Levy", amount: "275,000", due: "Due: 9th Nov 2023", status: "Pending" as const, icon: "real_estate_agent", iconBg: "bg-primary-fixed-dim/30", iconColor: "text-primary-container" },
];

const FILING_HISTORY = [
  { id: "1", period: "Oct 2023", type: "NSSF", amount: "340,200.00", filedDate: "02 Nov 2023" },
  { id: "2", period: "Sep 2023", type: "PAYE", amount: "1,210,500.00", filedDate: "08 Oct 2023" },
  { id: "3", period: "Sep 2023", type: "Housing Levy", amount: "268,000.00", filedDate: "08 Oct 2023" },
  { id: "4", period: "Sep 2023", type: "SHIF", amount: "180,100.00", filedDate: "08 Oct 2023" },
];

export default async function StatutoryPage() {
  await requirePermission("payroll:read");

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold text-primary">Statutory Remittances</h1>
          <p className="text-xs text-on-surface-variant">Manage and track your monthly compliance obligations.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-on-primary shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Icon name="publish" className="text-[18px]" />
          File Selected
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-4">
        {OBLIGATIONS.map((ob) => (
          <div
            key={ob.code}
            className="flex min-h-[160px] flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,0.10)]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="text-sm font-medium text-secondary">{ob.code}</div>
              <div className={`flex size-8 items-center justify-center rounded-full ${ob.iconBg} ${ob.iconColor}`}>
                <Icon name={ob.icon} className="text-[18px]" />
              </div>
            </div>
            <div>
              <div className="mb-1 text-2xl font-bold text-on-surface">KES {ob.amount}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">{ob.due}</span>
                <span
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    ob.status === "Filed" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-error-container text-on-error-container"
                  }`}
                >
                  {ob.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,0.06)]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-on-surface">Filing History</h3>
          <button className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-container">
            <Icon name="download" className="text-[18px]" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-inverse-on-surface px-4 pb-3 text-[10px] font-semibold uppercase text-outline">Period</th>
                <th className="border-b border-inverse-on-surface px-4 pb-3 text-[10px] font-semibold uppercase text-outline">Obligation Type</th>
                <th className="border-b border-inverse-on-surface px-4 pb-3 text-right text-[10px] font-semibold uppercase text-outline">Amount (KES)</th>
                <th className="border-b border-inverse-on-surface px-4 pb-3 text-[10px] font-semibold uppercase text-outline">Filed Date</th>
                <th className="border-b border-inverse-on-surface px-4 pb-3 text-[10px] font-semibold uppercase text-outline">Status</th>
                <th className="border-b border-inverse-on-surface px-4 pb-3 text-right text-[10px] font-semibold uppercase text-outline">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface">
              {FILING_HISTORY.map((f) => (
                <tr key={f.id} className="group transition-colors hover:bg-surface">
                  <td className="border-b border-inverse-on-surface px-4 py-4">{f.period}</td>
                  <td className="border-b border-inverse-on-surface px-4 py-4 font-medium">{f.type}</td>
                  <td className="border-b border-inverse-on-surface px-4 py-4 text-right">{f.amount}</td>
                  <td className="border-b border-inverse-on-surface px-4 py-4 text-on-surface-variant">{f.filedDate}</td>
                  <td className="border-b border-inverse-on-surface px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-tertiary-fixed/30 px-2 py-1 text-[11px] font-medium text-tertiary">
                      <div className="size-1.5 rounded-full bg-tertiary" />
                      Filed
                    </span>
                  </td>
                  <td className="border-b border-inverse-on-surface px-4 py-4 text-right">
                    <button className="text-primary opacity-0 transition-opacity hover:text-primary-container group-hover:opacity-100">
                      <Icon name="receipt" className="text-[20px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}