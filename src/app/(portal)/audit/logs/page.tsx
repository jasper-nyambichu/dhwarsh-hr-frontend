// src/app/(portal)/audit/logs/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { AuditLogTable, type AuditLogEntry } from "@/components/features/audit/audit-log-table";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<AuditLogEntry[]>("/audit-logs")`
 * when the endpoint exists.
 * ─────────────────────────────────────────────────────────────────────────
 */
const AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 1,
    timestamp: "2023-10-27 14:32:01 UTC",
    actor: "sarah.jenkins@dhwarsh.com",
    role: "HR Admin",
    module: "Employee Data",
    action: "UPDATE",
    entity: "EMP-8492",
    ipAddress: "192.168.1.104",
    result: "success",
    detail: {
      kind: "diff",
      transactionId: "TXN-9982-11A",
      sessionId: "SES-4410-XYZ",
      lines: [
        { type: "context", text: '"employee_id": "EMP-8492",' },
        { type: "context", text: '"department": "Engineering",' },
        { type: "removed", text: '"base_salary": 95000,' },
        { type: "added", text: '"base_salary": 105000,' },
        { type: "removed", text: '"title": "Software Engineer I"' },
        { type: "added", text: '"title": "Software Engineer II"' },
      ],
    },
  },
  {
    id: 2,
    timestamp: "2023-10-27 13:15:44 UTC",
    actor: "system.scheduler",
    role: "System",
    module: "Payroll",
    action: "EXECUTE",
    entity: "BATCH-OCT-23",
    ipAddress: "10.0.0.5 (Internal)",
    result: "success",
    detail: { kind: "note", message: "Detailed execution trace unavailable for batch system processes." },
  },
  {
    id: 3,
    timestamp: "2023-10-27 11:05:12 UTC",
    actor: "j.doe@dhwarsh.com",
    role: "Manager",
    module: "System Settings",
    action: "DELETE",
    entity: "API_KEY_PROD",
    ipAddress: "203.0.113.42",
    result: "error",
    detail: {
      kind: "error",
      title: "Authorization Failed",
      message:
        "User 'Manager' role lacks 'delete_api_key' permission on module 'System Settings'. Action blocked by policy 'POL-SEC-004'.",
    },
  },
];

export default async function AuditLogsPage() {
  await requirePermission("audit:read");

  return (
    <>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">System Audit Trail</h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            Immutable record of all system events and data mutations.
          </p>
        </div>
        <div className="flex gap-3">
          <select className="cursor-pointer appearance-none rounded-lg border border-outline-variant bg-white py-2 pl-3 pr-8 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/10">
            <option>All Modules</option>
            <option>Payroll</option>
            <option>Employee Data</option>
            <option>System Settings</option>
          </select>
          <div className="flex cursor-pointer items-center rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface">
            <Icon name="calendar_month" className="mr-2 text-[16px] text-on-surface-variant" />
            Last 7 Days
          </div>
          <button className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-surface-container-high">
            <Icon name="filter_list" className="text-[16px]" />
            More Filters
          </button>
        </div>
      </div>

      <AuditLogTable logs={AUDIT_LOGS} />
    </>
  );
}