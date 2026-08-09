// app/(dashboard)/employee-history/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for a real `EmployeeChangeEntry[]` fetch.
 * ─────────────────────────────────────────────────────────────────────────
 */
interface EmployeeChangeEntry {
  id: number;
  employeeName: string;
  employeeId: string;
  fieldIcon: string;
  fieldLabel: string;
  before: string;
  after: string;
  authorizedBy: string;
  authorizedByInitials: string;
  isSelfService?: boolean;
  timestamp: string;
}

const CHANGES: EmployeeChangeEntry[] = [
  { id: 1, employeeName: "Sarah Jenkins", employeeId: "EMP-8492", fieldIcon: "payments", fieldLabel: "Base Salary", before: "$85,000", after: "$92,500", authorizedBy: "Marcus Reed", authorizedByInitials: "MR", timestamp: "Oct 24, 14:32 EST" },
  { id: 2, employeeName: "David Chen", employeeId: "EMP-3321", fieldIcon: "account_balance", fieldLabel: "Bank Account", before: "**** 4922", after: "**** 8831", authorizedBy: "Self-Service", authorizedByInitials: "", isSelfService: true, timestamp: "Oct 23, 09:15 EST" },
  { id: 3, employeeName: "Elena Rodriguez", employeeId: "EMP-9012", fieldIcon: "lan", fieldLabel: "Department", before: "Marketing", after: "Product Strategy", authorizedBy: "System Admin", authorizedByInitials: "SJ", timestamp: "Oct 22, 16:45 EST" },
];

export default async function EmployeeHistoryPage() {
  await requirePermission("employee:read");

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-on-surface">Employee Record Change History</h1>
          <p className="text-xs text-on-surface-variant">Comprehensive tracking of PII and structural employment updates.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-xs font-medium text-primary shadow-ambient-1 transition-colors hover:bg-surface-container-high">
            <Icon name="filter_list" className="text-[18px]" />
            Filter
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-on-primary shadow-ambient-1 transition-colors hover:bg-primary-container">
            <Icon name="download" className="text-[18px]" />
            Export Log
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-ambient-1">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container-low">
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Employee</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Field Changed</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Change Details</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Authorized By</th>
                <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-xs text-on-surface">
              {CHANGES.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface-container-lowest/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-secondary-container">
                        <Icon name="person" className="text-[16px] text-secondary" />
                      </div>
                      <div>
                        <div className="font-medium text-on-surface">{c.employeeName}</div>
                        <div className="text-[10px] text-on-surface-variant">ID: {c.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-secondary-container/30 px-2.5 py-1 text-[11px] font-medium text-primary">
                      <Icon name={c.fieldIcon} className="text-[14px]" />
                      {c.fieldLabel}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-on-surface-variant line-through opacity-70">{c.before}</span>
                      <Icon name="arrow_right_alt" className="text-[16px] text-on-surface-variant" />
                      <span className="rounded bg-tertiary-container/10 px-2 py-0.5 font-medium text-tertiary">{c.after}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {c.isSelfService ? (
                        <>
                          <Icon name="person" className="text-[16px] text-primary" />
                          <span className="italic text-on-surface-variant">Self-Service</span>
                        </>
                      ) : (
                        <>
                          <div className="flex size-5 items-center justify-center rounded-full bg-primary-container text-[9px] font-bold text-on-primary">
                            {c.authorizedByInitials}
                          </div>
                          <span className="text-on-surface-variant">{c.authorizedBy}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-on-surface-variant">{c.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/30 bg-surface-container-lowest px-6 py-4">
          <span className="text-xs text-on-surface-variant">Showing 1-3 of 124 records</span>
          <div className="flex gap-1">
            <button className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50">
              <Icon name="chevron_left" className="text-[18px]" />
            </button>
            <button className="flex size-7 items-center justify-center rounded bg-primary text-xs text-on-primary">1</button>
            <button className="flex size-7 items-center justify-center rounded text-xs text-on-surface-variant hover:bg-surface-container-high">2</button>
            <button className="flex size-7 items-center justify-center rounded text-xs text-on-surface-variant hover:bg-surface-container-high">3</button>
            <button className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high">
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}