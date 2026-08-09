import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney, initials } from "@/lib/format";

/**
 * Agent invoices list.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/agent-invoices` list endpoint exists yet;
 * only PDF download endpoints per run/agent are documented. Swap once a
 * list endpoint returning `AgentPayrollSummary[]` (plus invoice no/status)
 * exists.
 * ─────────────────────────────────────────────────────────────────────────
 */

type InvoiceStatus = "PAID" | "PENDING" | "OVERDUE";

type InvoiceRow = {
  id: number;
  invoiceNo: string;
  period: string;
  staffName: string;
  amount: number;
  status: InvoiceStatus;
};

const INVOICES: readonly InvoiceRow[] = [
  { id: 89, invoiceNo: "INV-2026-089", period: "Oct 2026", staffName: "Mercy Kiprono", amount: 145_000, status: "OVERDUE" },
  { id: 90, invoiceNo: "INV-2026-090", period: "Nov 2026", staffName: "James Omondi", amount: 98_500, status: "PENDING" },
  { id: 88, invoiceNo: "INV-2026-088", period: "Sep 2026", staffName: "Alice Wanjiku", amount: 210_000, status: "PAID" },
  { id: 87, invoiceNo: "INV-2026-087", period: "Sep 2026", staffName: "David Kamau", amount: 75_200, status: "PAID" },
  { id: 91, invoiceNo: "INV-2026-091", period: "Nov 2026", staffName: "Mercy Kiprono", amount: 50_000, status: "PENDING" },
];

const STATUS_CHIP: Record<InvoiceStatus, string> = {
  PAID: "bg-[#E8F5E9] text-[#2E7D32]",
  PENDING: "bg-[#FFF3E0] text-[#E65100]",
  OVERDUE: "bg-error-container text-on-error-container",
};

const STATUS_DOT: Record<InvoiceStatus, string> = {
  PAID: "bg-green-main",
  PENDING: "bg-orange",
  OVERDUE: "bg-error",
};

const STATUS_SEGMENTS = [
  { label: "Paid", value: 55, color: "var(--color-green-main)" },
  { label: "Pending", value: 30, color: "var(--color-orange)" },
  { label: "Overdue", value: 15, color: "var(--color-error)" },
] as const;

const OVERDUE = [
  { id: 89, invoiceNo: "INV-2026-089", period: "Mercy Kiprono • Oct 2026", amount: 145_000, daysLate: "15 days late" },
  { id: 72, invoiceNo: "INV-2026-072", period: "John Doe • Aug 2026", amount: 82_400, daysLate: "42 days late" },
  { id: 65, invoiceNo: "INV-2026-065", period: "Sarah Smith • Jul 2026", amount: 25_000, daysLate: "60+ days late" },
] as const;

export default async function AgentInvoicesPage() {
  await requirePermission("invoice:read:self");

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Manage and track your agent network invoices."
        pill={<CountPill label="3 Overdue" tone="warning" />}
        actions={
          <div className="flex gap-3">
            <button type="button" className="flex items-center gap-2 rounded-lg bg-blue-soft px-4 py-2 font-body-md text-body-md font-semibold text-primary-container transition-colors hover:bg-secondary-container">
              <Icon name="filter_list" className="text-[18px]" />
              Filter
            </button>
            <button type="button" className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-body-md text-body-md font-semibold text-white shadow-sm transition-colors hover:bg-primary">
              <Icon name="add" className="text-[18px]" />
              New Invoice
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="lg:col-span-8">
          <BentoCard
            title="Invoice History"
            action={
              <Link href="/agent/invoices" className="font-body-md text-body-md font-semibold text-primary hover:underline">
                View All
              </Link>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="py-3 pl-2 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Invoice No</th>
                    <th className="py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Period</th>
                    <th className="py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Staff</th>
                    <th className="py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Amount (KES)</th>
                    <th className="py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="py-3 pr-2 text-center font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-surface">
                  {INVOICES.map((inv) => (
                    <tr key={inv.id} className="border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface">
                      <td className="py-4 pl-2 font-semibold">
                        <Link href={`/agent/invoices/${inv.id}`}>{inv.invoiceNo}</Link>
                      </td>
                      <td className="py-4 text-on-surface-variant">{inv.period}</td>
                      <td className="py-4">
                        <span className="flex items-center gap-2">
                          <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-soft text-[10px] font-bold text-primary-container">
                            {initials(inv.staffName)}
                          </span>
                          {inv.staffName}
                        </span>
                      </td>
                      <td className="py-4 text-right font-semibold tabular-nums">{formatMoney(inv.amount, { showCurrency: false })}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_CHIP[inv.status]}`}>
                          <span className={`mr-1.5 size-1.5 rounded-full ${STATUS_DOT[inv.status]}`} />
                          {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="py-4 pr-2 text-center">
                        <button type="button" className="text-on-surface-variant hover:text-primary">
                          <Icon name="more_vert" className="text-[18px]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Invoice Status">
            <DonutChart segments={STATUS_SEGMENTS} size={180} legend="value" centerLabel="Total" />
          </BentoCard>

          <div className="rounded-card border border-error/10 bg-gradient-to-br from-white to-[#fff0f0] p-card-padding shadow-ambient-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-page-title text-base font-bold text-error">
                <Icon name="warning" className="text-[20px]" />
                Priority Overdue
              </h3>
              <span className="rounded-full bg-error-container px-2 py-1 text-[10px] font-bold text-on-error-container">
                {OVERDUE.length} Invoices
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {OVERDUE.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-error/20 bg-white p-3 shadow-sm transition-colors hover:border-error/40">
                  <div>
                    <p className="mb-0.5 text-sm font-semibold text-on-surface">{item.invoiceNo}</p>
                    <p className="text-[10px] text-on-surface-variant">{item.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-error">{formatMoney(item.amount)}</p>
                    <p className="flex items-center justify-end gap-1 text-[10px] text-error">
                      <Icon name="schedule" className="text-[10px]" />
                      {item.daysLate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="mt-4 w-full rounded-lg py-2 text-center text-xs font-semibold text-error transition-colors hover:bg-error/5">
              Send Reminders
            </button>
          </div>
        </div>
      </div>
    </>
  );
}