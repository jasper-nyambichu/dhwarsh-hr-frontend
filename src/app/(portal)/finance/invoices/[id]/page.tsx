// src/app/(portal)/finance/invoices/[id]/page.tsx
import Link from "next/link";
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<InvoiceDetail>(`/finance/invoices/${id}`)`.
 * ─────────────────────────────────────────────────────────────────────────
 */
const INVOICE = {
  id: "INV-2023-049",
  generatedOn: "Oct 12, 2023",
  invoiceDate: "Oct 12, 2023",
  dueDate: "Oct 26, 2023",
  billTo: { name: "TechCorp East Africa", attn: "Finance Department", address: "4th Floor, Innovation Hub", city: "Nairobi, Kenya" },
  issuer: { name: "Dhwarsh HR Solutions Ltd.", address: "123 Corporate Park, Westlands", city: "Nairobi, Kenya", pin: "P051234567M" },
  lineItems: [
    { description: "Software Engineering Contractor", employeeId: "EMP-001", employeeName: "Jane Doe", rate: "15,000.00", days: 10, amount: "150,000.00" },
    { description: "UI/UX Design Contractor", employeeId: "EMP-002", employeeName: "John Smith", rate: "12,000.00", days: 15, amount: "180,000.00" },
    { description: "Data Analyst Consultant", employeeId: "EMP-003", employeeName: "Alice Kip", rate: "20,000.00", days: 3, amount: "60,000.00" },
  ],
  subtotal: "390,000.00",
  vat: "62,400.00",
  total: "452,400.00",
  approvalTrail: [
    { title: "Invoice Submitted", timestamp: "Oct 12, 2023 • 09:41 AM", by: "System Auto-generation", icon: "check", state: "done" as const },
    { title: "Reviewed by Finance", timestamp: "Oct 13, 2023 • 11:20 AM", by: "Mark O. (Sr. Accountant)", byAvatarUrl: "/avatars/mark.jpg", icon: "visibility", state: "done" as const },
    { title: "Approved for Payment", timestamp: "Oct 14, 2023 • 02:15 PM", by: "Sarah K. (Finance Director)", byAvatarUrl: "/avatars/sarah-k.jpg", icon: "thumb_up", state: "done" as const },
    { title: "Payment Processing", timestamp: "Awaiting final bank disbursement", icon: "account_balance_wallet", state: "pending" as const },
  ],
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoice:read");
  const { id } = await params;
  const invoice = INVOICE; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <Link href="/finance/invoices" className="mb-2 flex items-center gap-1 text-sm text-primary-container hover:underline">
            <Icon name="arrow_back" className="text-[14px]" />
            Back to Invoices
          </Link>
          <h1 className="text-xl font-bold text-primary">Invoice #{invoice.id}</h1>
          <p className="mt-1 text-xs text-on-surface-variant">Generated on {invoice.generatedOn}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-primary-container bg-white px-4 py-2 text-sm font-medium text-primary-container transition-colors hover:bg-secondary-fixed">
            <Icon name="download" className="text-[18px]" />
            Download PDF
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary-container">
            Process Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="flex justify-center lg:col-span-8">
          <div className="relative flex w-full max-w-[800px] flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(11,42,69,.06)] md:p-12">
            <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-primary to-primary-container" />

            <div className="mb-12 mt-4 flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-primary">INVOICE</h2>
                <p className="text-xs font-bold text-on-surface-variant">{invoice.id}</p>
              </div>
              <div className="text-right text-xs text-on-surface-variant">
                <div className="mb-1 text-2xl font-bold text-primary">Dhw.</div>
                <p>{invoice.issuer.name}</p>
                <p>{invoice.issuer.address}</p>
                <p>{invoice.issuer.city}</p>
                <p>PIN: {invoice.issuer.pin}</p>
              </div>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-8">
              <div>
                <p className="mb-2 text-[10px] uppercase text-outline">Bill To</p>
                <p className="text-sm font-bold text-on-surface">{invoice.billTo.name}</p>
                <p className="text-xs text-on-surface-variant">Attn: {invoice.billTo.attn}</p>
                <p className="text-xs text-on-surface-variant">{invoice.billTo.address}</p>
                <p className="text-xs text-on-surface-variant">{invoice.billTo.city}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4 text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="text-on-surface-variant">Invoice Date:</span>
                  <span className="font-bold text-on-surface">{invoice.invoiceDate}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="text-on-surface-variant">Due Date:</span>
                  <span className="font-bold text-on-surface">{invoice.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Total Amount:</span>
                  <span className="text-sm font-bold text-primary">KES {invoice.total}</span>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-primary">
                    <th className="w-1/2 py-3 text-[10px] uppercase text-on-surface-variant">Description / Employee</th>
                    <th className="py-3 text-right text-[10px] uppercase text-on-surface-variant">Rate</th>
                    <th className="py-3 text-right text-[10px] uppercase text-on-surface-variant">Days</th>
                    <th className="py-3 text-right text-[10px] uppercase text-on-surface-variant">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, i) => (
                    <tr key={i} className="border-b border-surface-variant transition-colors hover:bg-surface">
                      <td className="py-4">
                        <p className="text-sm font-bold text-on-surface">{item.description}</p>
                        <p className="text-[10px] text-outline">
                          ID: {item.employeeId} | {item.employeeName}
                        </p>
                      </td>
                      <td className="py-4 text-right text-sm">{item.rate}</td>
                      <td className="py-4 text-right text-sm">{item.days}</td>
                      <td className="py-4 text-right text-sm font-medium">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end border-t-2 border-surface-variant pt-4">
              <div className="w-1/2">
                <div className="flex justify-between border-b border-surface-variant py-2">
                  <span className="text-sm text-on-surface-variant">Subtotal</span>
                  <span className="text-sm font-medium text-on-surface">KES {invoice.subtotal}</span>
                </div>
                <div className="flex justify-between border-b border-surface-variant py-2">
                  <span className="text-sm text-on-surface-variant">VAT (16%)</span>
                  <span className="text-sm font-medium text-on-surface">KES {invoice.vat}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-base font-bold text-primary">Total Amount</span>
                  <span className="text-base font-bold text-primary">KES {invoice.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-gutter lg:col-span-4">
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <h3 className="mb-6 text-xl font-semibold text-primary">Approval Trail</h3>
            <div className="relative">
              <div className="absolute bottom-4 left-4 top-4 w-0.5 bg-surface-variant" />
              {invoice.approvalTrail.map((step, i) => (
                <div key={i} className={`relative z-10 flex gap-4 ${i < invoice.approvalTrail.length - 1 ? "mb-8" : ""}`}>
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                      step.state === "done" ? "bg-tertiary-fixed text-tertiary" : "bg-surface-variant text-outline"
                    }`}
                  >
                    <Icon name={step.icon} className="text-[16px]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{step.title}</p>
                    <p className="mt-1 text-[10px] text-on-surface-variant">{step.timestamp}</p>
                    {step.by && !step.byAvatarUrl && <p className="mt-1 text-[10px] text-outline">{step.by}</p>}
                    {step.byAvatarUrl && (
                      <div className="mt-2 flex items-center gap-2 rounded bg-surface-container-low p-2">
                        <div className="size-5 overflow-hidden rounded-full bg-secondary-container">
                          <img src={step.byAvatarUrl} alt={step.by} className="size-full object-cover" />
                        </div>
                        <span className="text-[10px] text-on-surface">{step.by}</span>
                      </div>
                    )}
                    {step.state === "pending" && (
                      <button className="mt-3 rounded border border-outline-variant bg-surface px-3 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-surface-container">
                        Update Status manually
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-primary-container p-6 text-white shadow-[0_2px_8px_rgba(11,42,69,.06)]">
            <Icon name="support_agent" className="absolute -right-8 -top-8 text-[120px] opacity-10" />
            <h4 className="relative z-10 mb-2 text-sm font-bold">Need Clarification?</h4>
            <p className="relative z-10 mb-4 text-xs opacity-80">
              Flag this invoice back to the agent if there are discrepancies in days or rates.
            </p>
            <button className="relative z-10 w-full rounded-lg bg-white px-4 py-2 text-xs font-bold text-primary-container shadow-sm transition-colors hover:bg-surface">
              Flag Invoice
            </button>
          </div>
        </div>
      </div>
    </>
  );
}