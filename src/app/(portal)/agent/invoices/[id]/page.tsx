import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatMoney } from "@/lib/format";

/**
 * Printable agent invoice document.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped loosely against `types.AgentPayrollSummary`
 * plus line-item and billing details not on that DTO. Swap for the actual
 * invoice PDF/data endpoint once documented (currently only
 * `GET /payroll/runs/{id}/agents/{agentId}/invoice` returning a raw PDF is
 * documented — this page would need a JSON equivalent to render as HTML).
 * ─────────────────────────────────────────────────────────────────────────
 */

const INVOICE = {
  reference: "INV-2026-1042",
  issueDate: "2026-10-24",
  periodStart: "2026-10-01",
  periodEnd: "2026-10-15",
  dueDate: "2026-11-08",
  agentName: "Strategic Labour Ltd",
  agentAddress: ["123 Business Park, Block A", "Nairobi, Kenya"],
  agentVat: "P0123456789",
  agentEmail: "billing@strategiclabour.co.ke",
  billTo: "Dhwarsh Logistics",
  billToAddress: ["Dhwarsh HQ, Industrial Area", "Nairobi, Kenya", "Attn: Accounts Payable"],
  vatRate: 16,
  paymentTerms: "Net 15 Days. Please make payments to Strategic Labour Ltd, KCB Bank, Acc: 1122334455.",
};

const LINE_ITEMS = [
  { id: 1, name: "John Kamau", role: "Forklift Operator", days: 12, rate: 1_500 },
  { id: 2, name: "Sarah Ochieng", role: "Warehouse Supervisor", days: 14, rate: 2_200 },
  { id: 3, name: "Peter Njoroge", role: "Loader", days: 10, rate: 1_200 },
  { id: 4, name: "Mary Wanjiku", role: "Quality Control", days: 15, rate: 1_800 },
];

export default async function AgentInvoiceDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoice:read:self");
  const { id } = await params;
  const invoice = INVOICE; // TODO: fetch by `id` once a JSON invoice endpoint exists

  const subtotal = LINE_ITEMS.reduce((sum, item) => sum + item.days * item.rate, 0);
  const vat = Math.round(subtotal * (invoice.vatRate / 100));
  const total = subtotal + vat;

  return (
    <div className="bg-surface-container-low py-10">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-between px-4 print:hidden">
        <button type="button" className="flex items-center gap-2 font-body-md text-body-md text-primary transition-colors hover:text-primary-container">
          <Icon name="arrow_back" />
          Back to Invoices
        </button>
        <div className="flex gap-4">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-label-rail text-label-rail uppercase tracking-wider text-primary transition-colors hover:bg-primary-fixed">
            <Icon name="print" />
            Print
          </button>
          <button type="button" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-rail text-label-rail uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-primary-container">
            <Icon name="download" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="mx-auto flex min-h-[297mm] w-[210mm] flex-col rounded-card bg-white p-10 shadow-ambient-2 lg:p-16 print:min-h-0 print:w-auto print:rounded-none print:p-[15mm] print:shadow-none">
        <div className="mb-16 flex items-start justify-between border-b border-surface-variant pb-8">
          <div className="w-1/2 border-r border-surface-variant pr-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded bg-orange text-white">
                <Icon name="corporate_fare" />
              </span>
              <div>
                <h1 className="font-page-title text-page-title text-orange">{invoice.agentName}</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Your staffing partner</p>
              </div>
            </div>
            <div className="space-y-1 font-body-md text-body-md text-on-surface-variant">
              {invoice.agentAddress.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>VAT No: {invoice.agentVat}</p>
              <p>Email: {invoice.agentEmail}</p>
            </div>
          </div>
          <div className="w-1/2 pl-8">
            <h2 className="mb-2 font-label-rail text-label-rail uppercase tracking-wider text-outline">Bill To</h2>
            <h3 className="mb-4 font-page-title text-page-title text-primary">{invoice.billTo}</h3>
            <div className="space-y-1 font-body-md text-body-md text-on-surface-variant">
              {invoice.billToAddress.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12 flex justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-light text-primary">INVOICE</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Reference: <span className="font-semibold text-on-surface">{invoice.reference}</span>
            </p>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-4 font-body-md text-body-md">
              <span className="text-on-surface-variant">Date of Issue:</span>
              <span className="w-32 font-semibold text-on-surface">{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="flex justify-end gap-4 font-body-md text-body-md">
              <span className="text-on-surface-variant">Billing Period:</span>
              <span className="w-32 font-semibold text-on-surface">
                {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
              </span>
            </div>
            <div className="flex justify-end gap-4 font-body-md text-body-md">
              <span className="text-on-surface-variant">Due Date:</span>
              <span className="w-32 font-semibold text-error">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>

        <div className="mb-12 flex-1">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="px-2 py-3 font-table-header text-table-header uppercase text-primary">Employee</th>
                <th className="px-2 py-3 text-right font-table-header text-table-header uppercase text-primary">Days Worked</th>
                <th className="px-2 py-3 text-right font-table-header text-table-header uppercase text-primary">Daily Rate (KES)</th>
                <th className="px-2 py-3 text-right font-table-header text-table-header uppercase text-primary">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant font-body-md text-body-md">
              {LINE_ITEMS.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-4">
                    <div className="font-semibold text-on-surface">{item.name}</div>
                    <div className="text-[10px] text-on-surface-variant">{item.role}</div>
                  </td>
                  <td className="px-2 py-4 text-right text-on-surface-variant">{item.days}</td>
                  <td className="px-2 py-4 text-right text-on-surface-variant">{formatMoney(item.rate, { showCurrency: false })}</td>
                  <td className="px-2 py-4 text-right font-semibold text-on-surface">
                    {formatMoney(item.days * item.rate, { showCurrency: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-16 flex justify-end">
          <div className="w-1/2 lg:w-1/3">
            <div className="flex justify-between border-b border-surface-variant py-2 font-body-md text-body-md">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-semibold text-on-surface">{formatMoney(subtotal, { showCurrency: false })}</span>
            </div>
            <div className="flex justify-between border-b border-surface-variant py-2 font-body-md text-body-md">
              <span className="text-on-surface-variant">VAT ({invoice.vatRate}%)</span>
              <span className="font-semibold text-on-surface">{formatMoney(vat, { showCurrency: false })}</span>
            </div>
            <div className="mt-2 flex justify-between rounded-lg border border-primary-fixed bg-primary-fixed-dim/20 px-4 py-4">
              <span className="font-page-title text-page-title text-primary">Total Payable</span>
              <span className="font-page-title text-page-title font-bold text-primary">{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-surface-variant pt-6 text-center font-body-md text-body-md text-on-surface-variant">
          <p className="mb-2">
            <strong className="text-on-surface">Payment Terms:</strong> {invoice.paymentTerms}
          </p>
          <p className="text-[10px]">Thank you for your continued partnership.</p>
        </div>
      </div>
    </div>
  );
}