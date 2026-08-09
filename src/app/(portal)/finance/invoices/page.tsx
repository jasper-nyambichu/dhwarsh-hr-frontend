// src/app/(portal)/finance/invoices/page.tsx
import Link from "next/link";
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<Invoice[]>("/finance/invoices")`.
 * ─────────────────────────────────────────────────────────────────────────
 */
interface Invoice {
  id: string;
  agentName: string;
  invoiceNo: string;
  period: string;
  amount: string;
  dueDate: string;
  dueDateUrgent?: boolean;
  status: "Pending" | "Approved" | "Paid";
}

const INVOICES: Invoice[] = [
  { id: "1", agentName: "Safaricom PLC", invoiceNo: "INV-2023-0491", period: "Oct 2023", amount: "450,000.00", dueDate: "Nov 15, 2023", status: "Pending" },
  { id: "2", agentName: "Equity Group Holdings", invoiceNo: "INV-2023-0488", period: "Oct 2023", amount: "1,250,500.00", dueDate: "Nov 12, 2023", status: "Approved" },
  { id: "3", agentName: "KCB Group", invoiceNo: "INV-2023-0475", period: "Sep 2023", amount: "890,200.00", dueDate: "Oct 30, 2023", status: "Paid" },
  { id: "4", agentName: "Jubilee Insurance", invoiceNo: "INV-2023-0495", period: "Oct 2023", amount: "320,000.00", dueDate: "Nov 05, 2023", dueDateUrgent: true, status: "Pending" },
  { id: "5", agentName: "Britam Holdings", invoiceNo: "INV-2023-0498", period: "Oct 2023", amount: "150,750.00", dueDate: "Nov 20, 2023", status: "Pending" },
  { id: "6", agentName: "Nairobi Hospital", invoiceNo: "INV-2023-0460", period: "Sep 2023", amount: "560,000.00", dueDate: "Oct 15, 2023", status: "Paid" },
];

function statusBadge(status: Invoice["status"]) {
  switch (status) {
    case "Pending":
      return "bg-secondary-container text-on-secondary-container border-secondary-container/50";
    case "Approved":
      return "bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed/50";
    case "Paid":
      return "bg-surface-container-high text-on-surface-variant border-surface-variant";
  }
}

export default async function InvoicesPage() {
  await requirePermission("invoice:read");

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold text-on-background">Agent Invoices</h1>
          <p className="text-xs text-on-surface-variant">Manage and process external partner billing.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container">
            <Icon name="filter_list" className="text-[18px]" />
            Filter
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-container">
            <Icon name="add" className="text-[18px]" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_2px_8px_rgba(11,42,69,0.06)]">
        <div className="flex items-center justify-between border-b border-surface-variant bg-white p-6">
          <div className="flex gap-4">
            <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
              All Invoices <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">124</span>
            </span>
            <span className="cursor-pointer text-sm text-on-surface-variant transition-colors hover:text-primary">Pending Approval</span>
            <span className="cursor-pointer text-sm text-on-surface-variant transition-colors hover:text-primary">Paid</span>
          </div>
          <button className="rounded-md p-2 text-primary transition-colors hover:bg-surface-container" title="Export">
            <Icon name="download" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-bright/50">
                <th className="px-6 py-3 text-[10px] font-semibold uppercase text-on-surface-variant">Agent Name</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase text-on-surface-variant">Invoice No</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase text-on-surface-variant">Period</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase text-on-surface-variant">Amount (KES)</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase text-on-surface-variant">Due Date</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase text-on-surface-variant">Status</th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="group border-b border-surface-variant transition-colors hover:bg-surface-bright">
                  <td className="px-6 py-3 font-medium text-on-surface">{inv.agentName}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{inv.period}</td>
                  <td className="px-4 py-3 text-right font-medium text-on-surface">{inv.amount}</td>
                  <td className={`px-4 py-3 ${inv.dueDateUrgent ? "text-error" : "text-on-surface-variant"}`}>{inv.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${statusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {inv.status === "Pending" && (
                      <button className="whitespace-nowrap rounded-md bg-[#E6F0F8] px-3 py-1.5 text-xs font-medium text-[#1C6EB4] opacity-0 transition-colors hover:bg-primary-container hover:text-white group-hover:opacity-100">
                        Approve &amp; Pay
                      </button>
                    )}
                    {inv.status === "Approved" && (
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="ml-auto flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary opacity-0 transition-colors hover:text-primary-container group-hover:opacity-100"
                      >
                        View Details
                        <Icon name="chevron_right" className="text-[14px]" />
                      </Link>
                    )}
                    {inv.status === "Paid" && (
                      <button className="ml-auto flex items-center gap-1 px-2 py-1 text-xs font-medium text-on-surface-variant opacity-0 transition-colors hover:text-primary group-hover:opacity-100">
                        Receipt
                        <Icon name="download" className="text-[14px]" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-surface-variant bg-surface-bright/30 p-4">
          <span className="text-sm text-on-surface-variant">Showing 1 to 6 of 124 entries</span>
          <div className="flex gap-1">
            <button className="rounded p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-50" disabled>
              <Icon name="chevron_left" />
            </button>
            <button className="flex size-8 items-center justify-center rounded bg-primary text-sm font-medium text-white">1</button>
            <button className="flex size-8 items-center justify-center rounded text-sm font-medium text-on-surface hover:bg-surface-container">2</button>
            <button className="flex size-8 items-center justify-center rounded text-sm font-medium text-on-surface hover:bg-surface-container">3</button>
            <span className="flex size-8 items-center justify-center text-on-surface-variant">...</span>
            <button className="rounded p-1 text-on-surface hover:bg-surface-container">
              <Icon name="chevron_right" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}