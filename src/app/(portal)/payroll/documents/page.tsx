import { requirePermission } from "@/app/lib/dal";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";

/**
 * Payroll document archive.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no shared document type for this list exists yet.
 * Swap for `await api.get<Paginated<PayrollDocument>>("/payroll/documents")`
 * once that endpoint and DTO exist.
 * ─────────────────────────────────────────────────────────────────────────
 */

type DocType = "PAYSLIP_BATCH" | "STATUTORY" | "BANK_FILE";

type DocRow = {
  id: number;
  name: string;
  type: DocType;
  period: string;
  generated: string;
  size: string;
};

const DOCUMENTS: readonly DocRow[] = [
  { id: 1, name: "August 2026 Payslips - Full Workforce", type: "PAYSLIP_BATCH", period: "Aug 2026", generated: "2 hours ago", size: "2.4 MB" },
  { id: 2, name: "KRA P10 Return - August 2026", type: "STATUTORY", period: "Aug 2026", generated: "Yesterday", size: "850 KB" },
  { id: 3, name: "Bank Disbursement File - KCB Branch", type: "BANK_FILE", period: "Aug 2026", generated: "Yesterday", size: "120 KB" },
  { id: 4, name: "July 2026 Payslips - Management", type: "PAYSLIP_BATCH", period: "Jul 2026", generated: "Aug 2, 2026", size: "1.1 MB" },
  { id: 5, name: "SHIF Monthly Return - July 2026", type: "STATUTORY", period: "Jul 2026", generated: "Aug 4, 2026", size: "450 KB" },
  { id: 6, name: "NSSF Monthly Return - July 2026", type: "STATUTORY", period: "Jul 2026", generated: "Aug 4, 2026", size: "480 KB" },
  { id: 7, name: "June 2026 Payslips - Full Workforce", type: "PAYSLIP_BATCH", period: "Jun 2026", generated: "Jul 1, 2026", size: "2.3 MB" },
  { id: 8, name: "Bank Disbursement File - Equity Branch", type: "BANK_FILE", period: "Jun 2026", generated: "Jul 2, 2026", size: "98 KB" },
];

const TYPE_META: Record<DocType, { label: string; icon: string; iconClass: string; chipClass: string }> = {
  PAYSLIP_BATCH: {
    label: "Payslip Batch",
    icon: "picture_as_pdf",
    iconClass: "bg-error-container text-error",
    chipClass: "bg-secondary-container text-on-secondary-fixed",
  },
  STATUTORY: {
    label: "Statutory",
    icon: "description",
    iconClass: "bg-tertiary-container/20 text-tertiary",
    chipClass: "bg-tertiary-container/20 text-tertiary",
  },
  BANK_FILE: {
    label: "Bank File",
    icon: "csv",
    iconClass: "bg-secondary-container/50 text-secondary",
    chipClass: "bg-surface-variant text-on-surface-variant",
  },
};

export default async function PayrollDocumentsPage() {
  await requirePermission("payroll:read");

  return (
    <>
      <PageHeader
        title="Payroll Documents"
        description="Access and download payroll outputs and compliance filings."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <select className="appearance-none rounded-lg border border-outline-variant/30 bg-surface-container-lowest py-2 pl-3 pr-8 font-body-md text-body-md text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option>August 2026</option>
                <option>July 2026</option>
                <option>June 2026</option>
              </select>
              <Icon
                name="calendar_month"
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-outline"
              />
            </div>
            <div className="relative">
              <select className="appearance-none rounded-lg border border-outline-variant/30 bg-surface-container-lowest py-2 pl-3 pr-8 font-body-md text-body-md text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option>All Types</option>
                <option>Payslip Batches</option>
                <option>Statutory Returns</option>
                <option>Bank Files</option>
              </select>
              <Icon
                name="filter_list"
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-outline"
              />
            </div>
          </div>
        }
      />

      <div className="overflow-hidden rounded-card border border-outline-variant/10 bg-surface-container-lowest shadow-ambient-1">
        <div className="w-full overflow-x-auto">
          <table className="data-table w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-variant">
                <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Document</th>
                <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Type</th>
                <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Period</th>
                <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Generated</th>
                <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Size</th>
                <th className="px-6 py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant font-body-md text-body-md text-on-surface">
              {DOCUMENTS.map((doc) => {
                const meta = TYPE_META[doc.type];
                return (
                  <tr key={doc.id} className="group transition-colors hover:bg-primary/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded ${meta.iconClass}`}>
                          <Icon name={meta.icon} className="text-sm" />
                        </span>
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold ${meta.chipClass}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{doc.period}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{doc.generated}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{doc.size}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          className="rounded border border-primary/30 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/5"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          title="Download"
                          className="rounded bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20"
                        >
                          <Icon name="download" className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-outline-variant/10 px-6 py-4">
          <span className="font-body-md text-body-md text-on-surface-variant">Showing 1 to 8 of 45 documents</span>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded p-1 text-on-surface-variant hover:bg-surface-variant/50 disabled:opacity-50">
              <Icon name="chevron_left" className="text-sm" />
            </button>
            <button type="button" className="flex size-7 items-center justify-center rounded bg-primary text-xs font-medium text-on-primary">
              1
            </button>
            <button type="button" className="flex size-7 items-center justify-center rounded text-xs font-medium text-on-surface-variant hover:bg-surface-variant/50">
              2
            </button>
            <button type="button" className="flex size-7 items-center justify-center rounded text-xs font-medium text-on-surface-variant hover:bg-surface-variant/50">
              3
            </button>
            <button type="button" className="rounded p-1 text-on-surface-variant hover:bg-surface-variant/50">
              <Icon name="chevron_right" className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}