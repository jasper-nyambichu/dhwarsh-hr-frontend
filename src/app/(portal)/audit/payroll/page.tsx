import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { ProgressRows } from "@/components/shared/charts";
import { PageHeader } from "@/components/shared/page-header";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { Icon } from "@/components/ui/icon";
import { formatNumber } from "@/lib/format";

/**
 * Payroll audit trail. Read-only.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped loosely against `types.AuditLog`, with a
 * payroll-specific projection (run id, amount changed) the list view needs
 * that isn't on the base DTO. Swap for
 * `await api.get<AuditLog[]>("/audit-logs/entity/PAYROLL_RUN/{id}")` (or a
 * dedicated payroll audit endpoint if one exists) when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

type PayrollAuditRow = {
  id: number;
  runId: string;
  actor: string;
  actorInitials: string;
  isSystem: boolean;
  action: string;
  amountChanged: string | null;
  significant: boolean;
  timestamp: string;
};

const ROWS: readonly PayrollAuditRow[] = [
  { id: 1, runId: "PR-2026-10-A", actor: "John Doe", actorInitials: "JD", isSystem: false, action: "Salary Adjustment", amountChanged: "+KES 150,000", significant: true, timestamp: "Oct 24, 14:32" },
  { id: 2, runId: "PR-2026-10-A", actor: "Alice Smith", actorInitials: "AS", isSystem: false, action: "Tax Rate Update", amountChanged: null, significant: false, timestamp: "Oct 24, 11:15" },
  { id: 3, runId: "PR-2026-10-A", actor: "John Doe", actorInitials: "JD", isSystem: false, action: "Deduction Override", amountChanged: "-KES 45,000", significant: true, timestamp: "Oct 23, 16:45" },
  { id: 4, runId: "PR-2026-10-A", actor: "System", actorInitials: "", isSystem: true, action: "Automated Run Init", amountChanged: null, significant: false, timestamp: "Oct 23, 01:00" },
  { id: 5, runId: "PR-2026-09-B", actor: "Mary Kariuki", actorInitials: "MK", isSystem: false, action: "Manual Correction", amountChanged: "+KES 12,500", significant: true, timestamp: "Oct 15, 09:20" },
  { id: 6, runId: "PR-2026-09-B", actor: "John Doe", actorInitials: "JD", isSystem: false, action: "Run Approval", amountChanged: null, significant: false, timestamp: "Oct 14, 18:00" },
  { id: 7, runId: "PR-2026-09-B", actor: "John Doe", actorInitials: "JD", isSystem: false, action: "Run Reversal", amountChanged: "KES 0 (Reverted)", significant: true, timestamp: "Oct 14, 17:45" },
  { id: 8, runId: "PR-2026-09-A", actor: "System", actorInitials: "", isSystem: true, action: "Automated Run Init", amountChanged: null, significant: false, timestamp: "Sep 28, 01:00" },
];

const ACTIONS_BY_TYPE = [
  { label: "Salary Adjustment", value: 45, color: "var(--color-primary)" },
  { label: "Deduction Override", value: 30, color: "var(--color-secondary)" },
  { label: "Run Reversal", value: 15, color: "var(--color-error)" },
  { label: "Manual Correction", value: 10, color: "var(--color-tertiary)" },
] as const;

export default async function AuditPayrollPage() {
  await requirePermission("audit:read");

  return (
    <>
      <PageHeader title="Payroll Audit Trail" description="Read-only view for system auditors." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="md:col-span-8">
          <BentoCard
            title="Audit Log"
            action={
              <button type="button" className="flex items-center gap-2 rounded-md px-3 py-1.5 font-body-md text-body-md font-medium text-primary transition-colors hover:bg-surface-container-low">
                <Icon name="download" className="text-sm" />
                Export CSV
              </button>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="py-3 pl-2 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Run ID</th>
                    <th className="py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Actor</th>
                    <th className="py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Action</th>
                    <th className="py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Amount Changed</th>
                    <th className="py-3 pr-2 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {ROWS.map((row) => (
                    <tr key={row.id} className="border-b border-surface-variant transition-colors last:border-0 hover:bg-surface-bright">
                      <td className="py-3 pl-2 font-medium text-on-surface">{row.runId}</td>
                      <td className="py-3 text-on-surface-variant">
                        <span className="flex items-center gap-2">
                          {row.isSystem ? (
                            <Icon name="settings_suggest" className="text-[16px] text-primary" />
                          ) : (
                            <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container">
                              {row.actorInitials}
                            </span>
                          )}
                          {row.actor}
                        </span>
                      </td>
                      <td className="py-3 text-on-surface-variant">{row.action}</td>
                      <td className="py-3 text-right">
                        {row.amountChanged ? (
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${row.significant ? "bg-error-container text-error" : "text-on-surface-variant"}`}>
                            {row.amountChanged}
                          </span>
                        ) : (
                          <span className="font-medium text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-2 text-right text-on-surface-variant">{row.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter md:col-span-4">
          <SegmentStrip
            segments={[
              { label: "Reviewed", value: formatNumber(0) },
              { label: "Flagged", value: formatNumber(ROWS.filter((r) => r.significant).length), tone: "warning" },
              { label: "Pending", value: formatNumber(0) },
            ]}
          />

          <BentoCard title="Actions by Type">
            <ProgressRows rows={ACTIONS_BY_TYPE} />
          </BentoCard>
        </div>
      </div>
    </>
  );
}