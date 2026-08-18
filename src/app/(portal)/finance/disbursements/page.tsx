// src/app/(portal)/finance/disbursements/page.tsx
import Link from "next/link";
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<DisbursementBatch[]>("/finance/disbursements")`.
 * ─────────────────────────────────────────────────────────────────────────
 */
interface DisbursementBatch {
  id: string;
  batchId: string;
  payrollRun: string;
  branch: string;
  employees: number;
  totalAmount: string;
  method: "Bank Transfer" | "Mobile Money";
  status: "Completed" | "Processing" | "Failed";
}

const BATCHES: DisbursementBatch[] = [
  { id: "1", batchId: "#DB-2608-001", payrollRun: "Aug 2026", branch: "Nairobi CBD", employees: 142, totalAmount: "12,450,000.00", method: "Bank Transfer", status: "Completed" },
  { id: "2", batchId: "#DB-2608-002", payrollRun: "Aug 2026", branch: "Mombasa Hub", employees: 85, totalAmount: "7,210,500.00", method: "Mobile Money", status: "Processing" },
  { id: "3", batchId: "#DB-2608-003", payrollRun: "Aug 2026", branch: "Kisumu Branch", employees: 45, totalAmount: "3,850,200.00", method: "Bank Transfer", status: "Failed" },
  { id: "4", batchId: "#DB-2607-001", payrollRun: "Jul 2026", branch: "Nairobi CBD", employees: 140, totalAmount: "12,100,000.00", method: "Bank Transfer", status: "Completed" },
  { id: "5", batchId: "#DB-2607-002", payrollRun: "Jul 2026", branch: "Mombasa Hub", employees: 82, totalAmount: "6,950,000.00", method: "Mobile Money", status: "Completed" },
  { id: "6", batchId: "#DB-2607-003", payrollRun: "Jul 2026", branch: "Kisumu Branch", employees: 45, totalAmount: "3,850,200.00", method: "Bank Transfer", status: "Completed" },
];

function statusBadge(status: DisbursementBatch["status"]) {
  switch (status) {
    case "Completed":
      return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
    case "Processing":
      return "bg-primary-fixed text-on-primary-fixed-variant";
    case "Failed":
      return "bg-error-container text-on-error-container";
  }
}

export default async function DisbursementsPage() {
  await requirePermission("payroll:read");

  return (
    <div className="flex flex-1 flex-col gap-gutter">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-bold text-on-background">Disbursements</h1>
          <p className="text-xs text-on-surface-variant">Manage and track bulk salary payments across all branches.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#0B2A45] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-container hover:shadow-md">
          <Icon name="add" className="text-[18px]" />
          New Batch
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(11,42,69,.06)]">
        <div className="flex items-center justify-between border-b border-surface-container bg-surface-bright/50 p-6">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <select className="rounded-md border border-[#E9EFF5] px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary">
              <option>All Statuses</option>
              <option>Processing</option>
              <option>Completed</option>
              <option>Failed</option>
            </select>
            <select className="rounded-md border border-[#E9EFF5] px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary">
              <option>Recent First</option>
              <option>Oldest First</option>
              <option>Amount High-Low</option>
            </select>
          </div>
          <button className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-[#E6F0F8]">
            <Icon name="download" className="text-[18px]" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E9EFF5] bg-surface-bright/20">
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Batch ID</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Payroll Run</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Branch</th>
                <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Employees</th>
                <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Total Amount (KES)</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Payment Method</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-background">
              {BATCHES.map((b) => (
                <tr key={b.id} className="group border-b border-[#E9EFF5] transition-colors hover:bg-background">
                  <td className="px-6 py-4 font-medium text-primary">
                    <Link href={`/finance/disbursements/${b.id}`} className="hover:underline">
                      {b.batchId}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{b.payrollRun}</td>
                  <td className="px-6 py-4">{b.branch}</td>
                  <td className="px-6 py-4 text-right">{b.employees}</td>
                  <td className="px-6 py-4 text-right font-medium">{b.totalAmount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Icon name={b.method === "Bank Transfer" ? "account_balance" : "smartphone"} className="text-[16px]" />
                      {b.method}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded p-1.5 text-primary opacity-0 transition-opacity hover:bg-secondary-container group-hover:opacity-100">
                      <Icon name="more_vert" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-surface-container bg-surface-bright/50 p-4">
          <span className="text-xs text-on-surface-variant">Showing 1-6 of 42 batches</span>
          <div className="flex gap-1">
            <button className="cursor-not-allowed p-1 text-outline-variant">
              <Icon name="chevron_left" />
            </button>
            <button className="flex size-8 items-center justify-center rounded-md bg-primary-container text-sm font-medium text-white">1</button>
            <button className="flex size-8 items-center justify-center rounded-md text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container">2</button>
            <button className="flex size-8 items-center justify-center rounded-md text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container">3</button>
            <span className="flex size-8 items-center justify-center text-sm text-outline-variant">...</span>
            <button className="rounded p-1 text-primary transition-colors hover:bg-secondary-container">
              <Icon name="chevron_right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}