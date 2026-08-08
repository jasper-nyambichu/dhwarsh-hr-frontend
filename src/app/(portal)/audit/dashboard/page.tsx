import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart, ProgressRows } from "@/components/shared/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { formatNumber, initials } from "@/lib/format";

/**
 * Auditor dashboard. Read-only — no primary action buttons anywhere.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/dashboard/audit` endpoint yet. Replace with
 * `await api.get<AuditDashboard>("/dashboard/audit")` when it lands.
 * ─────────────────────────────────────────────────────────────────────────
 */

const KPI = {
  eventsToday: 1_842,
  flaggedActions: 7,
  usersActive: 63,
} as const;

/** Daily event volume over 7 days, oldest first. */
const ACTIVITY_VOLUME = [
  { label: "Mon", value: 120 },
  { label: "Tue", value: 250 },
  { label: "Wed", value: 90 },
  { label: "Thu", value: 450 },
  { label: "Fri", value: 180 },
  { label: "Sat", value: 310 },
  { label: "Sun", value: 380 },
] as const;
const ACTIVITY_MAX = Math.max(...ACTIVITY_VOLUME.map((d) => d.value));

/** Share of daily events per module, whole percent. */
const EVENTS_BY_MODULE = [
  { label: "Payroll", value: 85, color: "var(--color-primary)" },
  { label: "Employee", value: 62, color: "var(--color-primary)" },
  { label: "Leave", value: 40, color: "var(--color-primary)" },
  { label: "Auth", value: 25, color: "var(--color-primary)" },
  { label: "Settings", value: 12, color: "var(--color-primary)" },
] as const;

const AUDIT_EVENTS = [
  { id: 1, ts: "12 Aug 14:30", actor: "John Doe", actorCode: "EMP-829", module: "Payroll", action: "Modified Salary", entity: "Jane Smith", ip: "192.168.1.104", flagged: false },
  { id: 2, ts: "12 Aug 14:15", actor: "Alice Cooper", actorCode: "SYS-001", module: "Auth", action: "Role Assignment", entity: "Bob Builder", ip: "10.0.0.52", flagged: false },
  { id: 3, ts: "12 Aug 13:55", actor: "System Admin", actorCode: "SYS-000", module: "Settings", action: "Updated Policy", entity: "Global Auth Config", ip: "127.0.0.1", flagged: false },
  { id: 4, ts: "12 Aug 13:42", actor: "Mark Vance", actorCode: "EMP-302", module: "Auth", action: "Access Denied", entity: "Payroll DB", ip: "192.168.2.14", flagged: true },
  { id: 5, ts: "12 Aug 12:10", actor: "Sarah Lee", actorCode: "EMP-415", module: "Employee", action: "Viewed Profile", entity: "David Kim", ip: "10.0.1.200", flagged: false },
  { id: 6, ts: "12 Aug 11:45", actor: "John Doe", actorCode: "EMP-829", module: "Leave", action: "Approved Request", entity: "REQ-8842", ip: "192.168.1.104", flagged: false },
] as const;

const MOST_ACTIVE_USERS = [
  { id: 1, name: "John Doe", code: "EMP-829", count: 428 },
  { id: 2, name: "System Admin", code: "SYS-000", count: 391 },
  { id: 3, name: "Alice Cooper", code: "SYS-001", count: 215 },
  { id: 4, name: "Mark Vance", code: "EMP-302", count: 184 },
] as const;

const ACCESS_OUTCOMES = [
  { label: "Allowed", value: 98, color: "var(--color-primary-container)" },
  { label: "Denied", value: 2, color: "var(--color-error)" },
] as const;

export default async function AuditDashboardPage() {
  await requirePermission("audit:read");

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard label="Events Today" value={formatNumber(KPI.eventsToday)} icon="event_note" tone="primary" />
          <MetricCard label="Flagged Actions" value={formatNumber(KPI.flaggedActions)} icon="flag" tone="error" accent />
          <MetricCard label="Users Active" value={formatNumber(KPI.usersActive)} icon="group" />
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <BentoCard title="Activity Volume" subtitle="Last 7 days" className="flex h-64 flex-col">
            <div className="flex flex-1 items-end justify-between gap-2 rounded-lg bg-surface-container-low/50 p-2">
              {ACTIVITY_VOLUME.map((d) => (
                <div key={d.label} className="flex h-full w-full flex-col items-center justify-end gap-2">
                  <div
                    className="w-full rounded-t-sm bg-primary-container/40"
                    style={{ height: `${(d.value / ACTIVITY_MAX) * 100}%` }}
                    title={formatNumber(d.value)}
                  />
                  <span className="text-[10px] text-outline">{d.label}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="Events by Module" className="flex h-64 flex-col" bodyClassName="flex flex-1 flex-col justify-center">
            <ProgressRows rows={EVENTS_BY_MODULE} className="flex-1" />
          </BentoCard>
        </div>

        <BentoCard title="Recent Audit Events">
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Timestamp</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Actor</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Module</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Action</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Entity</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">IP</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {AUDIT_EVENTS.map((e) => (
                  <tr key={e.id} className={e.flagged ? "bg-error-container/20" : undefined}>
                    <td className={`py-3 pl-2 whitespace-nowrap ${e.flagged ? "font-medium text-error" : "text-on-surface-variant"}`}>
                      {e.ts}
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-on-surface-variant"
                        >
                          {initials(e.actor)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-on-surface">{e.actor}</span>
                          <span className="block text-[10px] text-outline">{e.actorCode}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="rounded bg-surface-container px-2 py-0.5 text-[10px] font-semibold uppercase text-on-surface-variant">
                        {e.module}
                      </span>
                    </td>
                    <td className={`py-3 ${e.flagged ? "font-medium text-error" : "text-on-surface"}`}>{e.action}</td>
                    <td className="py-3 text-on-surface-variant">{e.entity}</td>
                    <td className={`py-3 pr-2 text-right font-mono text-[11px] tabular-nums ${e.flagged ? "text-error" : "text-on-surface-variant"}`}>
                      {e.ip}
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
        <SegmentStrip
          segments={[
            { label: "Reads", value: formatNumber(1_610) },
            { label: "Writes", value: formatNumber(225) },
            { label: "Denied", value: formatNumber(7), tone: "warning" },
          ]}
        />

        <AlertSpotlight
          eyebrow="Compliance"
          title="7 privileged actions need review"
          message="Access-denied events from the last 24 hours."
          cta="Review Audit Log"
          href="/audit/logs"
        />

        <BentoCard title="Most Active Users">
          <ul className="flex flex-col gap-4">
            {MOST_ACTIVE_USERS.map((u) => (
              <li key={u.id} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-on-surface-variant"
                >
                  {initials(u.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body-md text-body-md font-medium text-on-surface">
                    {u.name}
                  </span>
                  <span className="block text-[10px] text-outline">{u.code}</span>
                </span>
                <span className="shrink-0 rounded bg-surface-container px-2 py-1 font-body-md text-[10px] font-semibold tabular-nums text-on-surface-variant">
                  {formatNumber(u.count)}
                </span>
              </li>
            ))}
          </ul>
        </BentoCard>

        <BentoCard title="Access Outcomes">
          <DonutChart segments={ACCESS_OUTCOMES} size={140} legend="value" centerLabel="Allowed" />
        </BentoCard>
      </div>
    </div>
  );
}