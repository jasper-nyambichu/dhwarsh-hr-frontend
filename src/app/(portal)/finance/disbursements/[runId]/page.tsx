// src/app/(portal)/finance/disbursements/[runId]/page.tsx
import Link from "next/link";
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<BatchDetail>(`/finance/disbursements/${runId}`)`.
 * ─────────────────────────────────────────────────────────────────────────
 */
const BATCH = {
  id: "BATCH-8924-OCT",
  status: "Processing" as const,
  description: "October 2023 Mid-Month Payroll Disbursements",
  totalAmount: "4,250,000",
  succeeded: 142,
  attempted: 145,
  failed: 3,
  payments: [
    { id: "1", name: "David Kamau", title: "Operations Manager", account: "**** **** **34 5678", amount: "125,000.00", status: "Succeeded" as const, avatarUrl: "/avatars/david-kamau.jpg" },
    { id: "2", name: "Grace Wanjiru", title: "Marketing Executive", account: "**** **** **12 9087", amount: "85,500.00", status: "Failed" as const, failReason: "Invalid Account No.", avatarUrl: "/avatars/grace.jpg" },
    { id: "3", name: "James Omondi", title: "Software Engineer", account: "**** **** **88 1122", amount: "180,000.00", status: "Succeeded" as const, initials: "JO" },
  ],
};

export default async function DisbursementBatchDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  await requirePermission("payroll:read");
  const { runId } = await params;
  const batch = BATCH; // TODO: fetch by `runId` once the endpoint exists

  return (
    <div className="flex flex-1 flex-col gap-gutter">
      <div className="mb-2 flex items-center gap-4">
        <Link
          href="/finance/disbursements"
          className="flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]"
        >
          <Icon name="chevron_left" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-on-surface">Batch {batch.id}</h1>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              {batch.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">{batch.description}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-medium text-primary shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-colors hover:bg-surface-container">
            <Icon name="download" className="text-[18px]" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <SummaryTile label="Total Amount" icon="account_balance_wallet" iconBg="bg-primary-fixed" iconColor="text-primary-container">
          <span className="text-sm font-normal text-on-surface-variant">KES</span> {batch.totalAmount}
        </SummaryTile>
        <SummaryTile label="Succeeded" icon="check_circle" iconBg="bg-tertiary-fixed" iconColor="text-tertiary">
          {batch.succeeded} <span className="text-sm font-normal text-on-surface-variant">/ {batch.attempted}</span>
        </SummaryTile>
        <SummaryTile label="Failed" icon="error" iconBg="bg-error-container" iconColor="text-error" valueClass="text-error">
          {batch.failed} <span className="text-sm font-normal text-on-surface-variant">Transactions</span>
        </SummaryTile>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(11,42,69,.06)]">
        <div className="flex items-center justify-between border-b border-surface-variant p-6">
          <h2 className="text-xl font-semibold text-on-surface">Payment Status</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
              <input
                type="text"
                placeholder="Search employee..."
                className="w-64 rounded-lg border border-surface-variant bg-surface-bright py-2 pl-10 pr-4 text-sm focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
              />
            </div>
            <button className="rounded-lg border border-surface-variant p-2 text-on-surface-variant transition-colors hover:bg-surface-container">
              <Icon name="filter_list" />
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-bright text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Account Number</th>
                <th className="px-6 py-4 text-right">Amount (KES)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white text-sm text-on-surface">
              {batch.payments.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-surface-variant transition-colors hover:bg-background ${p.status === "Failed" ? "bg-error-container/10" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.avatarUrl ? (
                        <div className="size-8 overflow-hidden rounded-full bg-surface-container">
                          <img src={p.avatarUrl} alt={p.name} className="size-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-secondary-fixed text-xs font-bold text-secondary">
                          {p.initials}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-on-surface">{p.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{p.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-mono ${p.status === "Failed" ? "text-error" : "text-on-surface-variant"}`}>{p.account}</td>
                  <td className="px-6 py-4 text-right font-medium">{p.amount}</td>
                  <td className="px-6 py-4">
                    {p.status === "Succeeded" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed-dim/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-tertiary">
                        <Icon name="check" className="text-[14px]" />
                        Succeeded
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-error">
                          <Icon name="close" className="text-[14px]" />
                          Failed
                        </span>
                        {p.failReason && <p className="mt-1 max-w-[150px] truncate text-[10px] text-error">{p.failReason}</p>}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === "Succeeded" ? (
                      <button className="text-outline transition-colors hover:text-primary">
                        <Icon name="more_vert" className="text-[20px]" />
                      </button>
                    ) : (
                      <button className="ml-auto flex items-center justify-end gap-1 text-sm font-medium text-primary-container transition-colors hover:text-primary">
                        <Icon name="refresh" className="text-[16px]" />
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-surface-variant bg-surface-bright p-4">
          <span className="text-sm text-on-surface-variant">Showing 1 to 3 of 145 entries</span>
          <div className="flex gap-1">
            <button className="flex size-8 items-center justify-center rounded border border-surface-variant text-outline hover:bg-surface-container disabled:opacity-50" disabled>
              <Icon name="chevron_left" className="text-[18px]" />
            </button>
            <button className="flex size-8 items-center justify-center rounded bg-primary-container text-sm font-medium text-white">1</button>
            <button className="flex size-8 items-center justify-center rounded border border-surface-variant text-sm font-medium text-on-surface-variant hover:bg-surface-container">2</button>
            <button className="flex size-8 items-center justify-center rounded border border-surface-variant text-sm font-medium text-on-surface-variant hover:bg-surface-container">3</button>
            <span className="flex size-8 items-center justify-center text-on-surface-variant">...</span>
            <button className="flex size-8 items-center justify-center rounded border border-surface-variant text-outline hover:bg-surface-container">
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  icon,
  iconBg,
  iconColor,
  valueClass = "text-on-surface",
  children,
}: {
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  valueClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
        <div className={`flex size-10 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
          <Icon name={icon} />
        </div>
      </div>
      <div className={`flex items-baseline gap-1 text-2xl font-bold ${valueClass}`}>{children}</div>
    </div>
  );
}