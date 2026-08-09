// app/(dashboard)/audit-logs/[id]/page.tsx
import Link from "next/link";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped for a single-event detail projection.
 * Swap for `await api.get<AuditEventDetail>(`/audit-logs/${id}`)`.
 * ─────────────────────────────────────────────────────────────────────────
 */
const EVENT = {
  id: "EVT-8924A",
  loggedAt: "Oct 24, 2023 at 14:32:05 UTC",
  actor: { name: "Sarah Jenkins", role: "Senior HR Admin", ip: "192.168.1.105", sessionId: "sess_9a8b7c6d5e4f", exactTimestamp: "2023-10-24 14:32:05.142 UTC" },
  target: "Employee Record (EMP-1042)",
  method: "PUT",
  endpoint: "/api/v2/employees/1042/salary",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  statusText: "200 OK - Processed",
  isCritical: true,
  before: { base_salary: "85,000.00", currency: "USD", effective_date: "2023-01-01", bonus_eligible: true, department_code: "FIN-01" },
  after: { base_salary: "92,500.00", currency: "USD", effective_date: "2023-11-01", bonus_eligible: true, department_code: "FIN-01" },
};

export default async function AuditEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("audit:read");
  const { id } = await params;
  const event = EVENT; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/audit/logs"
          className="flex size-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Event Detail: #{event.id}</h1>
          <p className="text-xs text-secondary">Logged on {event.loggedAt}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-4">
          <BentoCard title="Actor Identity">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full border-2 border-primary-container bg-secondary-container">
                <Icon name="person" className="text-2xl text-secondary" />
              </div>
              <div>
                <p className="text-base font-bold text-on-surface">{event.actor.name}</p>
                <p className="text-xs text-primary">{event.actor.role}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="mb-1 text-secondary">IP Address</p>
                <p className="font-mono text-[11px] font-medium text-on-surface">{event.actor.ip}</p>
              </div>
              <div>
                <p className="mb-1 text-secondary">Session ID</p>
                <p className="truncate font-mono text-[11px] font-medium text-on-surface" title={event.actor.sessionId}>
                  {event.actor.sessionId.slice(0, 9)}...
                </p>
              </div>
              <div className="col-span-2">
                <p className="mb-1 text-secondary">Exact Timestamp</p>
                <p className="font-medium text-on-surface">{event.actor.exactTimestamp}</p>
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <BentoCard
            title={
              <span className="flex w-full items-center justify-between">
                Request Context
                {event.isCritical && (
                  <span className="flex items-center gap-1 rounded-full bg-error-container px-2 py-1 text-[10px] font-medium text-on-error-container">
                    <Icon name="warning" className="text-[12px]" />
                    Critical Action
                  </span>
                )}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <p className="mb-1 text-xs text-secondary">Target Entity</p>
                <div className="flex items-center gap-2">
                  <Icon name="account_circle" className="text-[18px] text-primary" />
                  <p className="text-sm font-medium text-on-surface">{event.target}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-secondary">Endpoint / Action</p>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                    {event.method}
                  </span>
                  <p className="font-mono text-xs text-on-surface">{event.endpoint}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-secondary">User Agent</p>
                <p className="text-xs text-on-surface">{event.userAgent}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-secondary">Status</p>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-tertiary" />
                  <p className="text-xs font-medium text-on-surface">{event.statusText}</p>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 mt-4 flex flex-col rounded-2xl bg-white p-6 shadow-ambient-1">
          <h2 className="mb-4 flex items-center gap-2 border-b border-surface-container-highest pb-4 text-[10px] font-semibold uppercase tracking-wider text-secondary">
            <Icon name="difference" className="text-[16px]" />
            State Diff: Salary Update
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col overflow-hidden rounded-lg border border-error-container">
              <div className="flex items-center justify-between border-b border-error-container bg-error-container/30 px-4 py-2">
                <span className="text-xs font-bold text-error">Previous State</span>
                <Icon name="remove_circle_outline" className="text-[16px] text-error" />
              </div>
              <pre className="flex-1 bg-surface-container-lowest p-4 font-mono text-xs text-on-surface">
                {JSON.stringify(event.before, null, 2)}
              </pre>
            </div>
            <div className="flex flex-col overflow-hidden rounded-lg border border-tertiary-container/30">
              <div className="flex items-center justify-between border-b border-tertiary-container/30 bg-tertiary-container/10 px-4 py-2">
                <span className="text-xs font-bold text-tertiary">New State</span>
                <Icon name="add_circle_outline" className="text-[16px] text-tertiary" />
              </div>
              <pre className="flex-1 bg-surface-container-lowest p-4 font-mono text-xs text-on-surface">
                {JSON.stringify(event.after, null, 2)}
              </pre>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="rounded px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-surface-container-high">
              Export JSON Diff
            </button>
            <button type="button" className="rounded bg-primary px-4 py-2 text-xs font-bold text-white shadow transition-colors hover:bg-primary-container">
              Flag for Review
            </button>
          </div>
        </div>
      </div>
    </>
  );
}