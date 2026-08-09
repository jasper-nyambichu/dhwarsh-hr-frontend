//src/app/(portal)/admin/audit/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber } from "@/lib/format";

/**
 * System Audit Log.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.AuditEvent`. Backend should
 * expose module/date-range filters as query params, same as the branches
 * region filter pattern.
 * ─────────────────────────────────────────────────────────────────────────
 */

type AuditResult = "SUCCESS" | "FAILURE";

type AuditRow = {
  id: number;
  date: string;
  time: string;
  actorName: string;
  actorRole: string;
  actorInitials: string | null;
  actorAvatarUrl: string | null;
  actorIcon: string | null;
  module: string;
  action: string;
  entity: string;
  ip: string;
  result: AuditResult;
};

const AUDIT_LOG: readonly AuditRow[] = [
  { id: 1, date: "Oct 24, 2023", time: "14:32:01 EAT", actorName: "Sarah Connor", actorRole: "HR Manager", actorInitials: null, actorAvatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKRGiEPPpwAFUbYRwUScSLhUuqNwES2D2cTgXK2FIGkmfGfsyNF4nkKncO_PuZF4vCrr0eVNKl56w_J1eZLQRI5bhl0l35ht4ACDnxcI0FNpHTFiWHF6AusFtACdFDTzWCiHNq2pPj1U1h3hVnboBQC25MR6_SrnUvklYmIhOABGoqBcD5nqPTjmCADNlNcZHgkaa82EYH7BFWBCx3OTByf47S3vKWq839oclXqmVjvo8Q1_cLpDtu", actorIcon: null, module: "Payroll", action: "Updated Salary Record", entity: "EMP-2041 (John Doe)", ip: "192.168.1.45", result: "SUCCESS" },
  { id: 2, date: "Oct 24, 2023", time: "11:15:22 EAT", actorName: "Mike Ross", actorRole: "System", actorInitials: null, actorAvatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVQrGj8KpBGGvF5op4PYZlJPv1TC7Q06OCZmRXQk6Gsfsc6Y1EZP0kpG0U83qfK5_uk7WvbHs_llF0a_s_WsOlioKSnMO7vf4j888gzyYKjkWXbVjgBhMMgrolmezSWrkf6mbgDr_g72uI6pbY1W8jZzjYcXDg6DdNf72lNxZ7Udh2aOu3NVOL_pMKqgSG6zYd8p93nVsEeRc4fwH2g7N5h8BqU_42tbakueTGX6YUnVwAz4VZGcf_", actorIcon: null, module: "Authentication", action: "Failed Login Attempt", entity: "admin@dhwarsh.com", ip: "41.204.186.22", result: "FAILURE" },
  { id: 3, date: "Oct 24, 2023", time: "09:45:00 EAT", actorName: "Elena Vance", actorRole: "Department Head", actorInitials: null, actorAvatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOxaujxzS8Q5eb58knEzg5OFtl-g01bt9_GEFTTlcFzhxwHpETV4cZANA1Utai9fmkWjNg0uGUwfBtV-o11Vckd_y4iLAeaRm8nflg0NoPF6tnjDxYJbY-yfzw5umVM6no-nHNWPkw1XLwgcl_NA8ueUltybQRJC9cZNbTukVZt_6Dm1C3FZS9Q4o1XmDi4LLyvRDiFEaR0oRFJPcvcLqBAsvUTxIDKsRzb1iteF96JouRS-5IyjNI", actorIcon: null, module: "Leave Management", action: "Approved Leave Request", entity: "REQ-8902 (Annual)", ip: "192.168.1.112", result: "SUCCESS" },
  { id: 4, date: "Oct 23, 2023", time: "16:20:45 EAT", actorName: "Taruk Admin", actorRole: "Super Admin", actorInitials: "TA", actorAvatarUrl: null, actorIcon: null, module: "System Settings", action: "Modified Global Policy", entity: "Password Expiry Rules", ip: "10.0.0.5", result: "SUCCESS" },
  { id: 5, date: "Oct 23, 2023", time: "14:05:12 EAT", actorName: "API Gateway", actorRole: "Service", actorInitials: null, actorAvatarUrl: null, actorIcon: "smart_toy", module: "Data Export", action: "Bulk Export Initiated", entity: "Employee Directory (CSV)", ip: "172.16.0.100", result: "SUCCESS" },
  { id: 6, date: "Oct 23, 2023", time: "10:30:00 EAT", actorName: "David Chen", actorRole: "IT Support", actorInitials: null, actorAvatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPWloXFr14T98r3XgExT6DYgyid_2qP91RDVX79dUIxZJnwKbM9xfl3LLsLbn1rbdQh5CxefGQ7-BRYJhAPsbotNcyroAw4OjAPZiCe-76pE9s6rciCnfYmR11m_AIQ66STDvAPtn4qnKzAWIx3_L9r2BUF3Vz3PhOic_V-2PJ9UddID1Bxd3HksvlcWnpRJaL7VMJKJcboQRryPkoEQk2WEnfTn6t9dhNih4Vs7lRlVt8GCc_CC0k", actorIcon: null, module: "User Management", action: "Reset User Password", entity: "EMP-4092 (Jane Smith)", ip: "192.168.1.55", result: "SUCCESS" },
  { id: 7, date: "Oct 22, 2023", time: "23:15:44 EAT", actorName: "Unknown", actorRole: "External", actorInitials: null, actorAvatarUrl: null, actorIcon: "public", module: "Authentication", action: "Invalid API Token", entity: "Endpoint: /v1/employees", ip: "105.163.22.8", result: "FAILURE" },
  { id: 8, date: "Oct 22, 2023", time: "08:00:05 EAT", actorName: "System Cron", actorRole: "Automated", actorInitials: null, actorAvatarUrl: null, actorIcon: "schedule", module: "Database", action: "Automated Backup", entity: "Full DB Snapshot", ip: "localhost", result: "SUCCESS" },
];

type ModuleShare = { label: string; icon: string; percent: number; count: number; colorClassName: string };

const MODULE_SHARE: readonly ModuleShare[] = [
  { label: "Authentication", icon: "login", percent: 45, count: 1102, colorClassName: "bg-primary" },
  { label: "Payroll", icon: "payments", percent: 25, count: 612, colorClassName: "bg-tertiary" },
  { label: "User Management", icon: "group_add", percent: 15, count: 367, colorClassName: "bg-secondary" },
  { label: "Settings", icon: "settings_applications", percent: 10, count: 245, colorClassName: "bg-error" },
  { label: "Other", icon: "more_horiz", percent: 5, count: 125, colorClassName: "bg-outline-variant" },
];

export default async function AuditLogPage() {
  await requirePermission("audit:read");

  return (
    <>
      <PageHeader
        title="System Audit Log"
        description="Review system activities and administrative actions."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                defaultValue="all"
                className="appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-4 pr-10 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Modules</option>
                <option value="authentication">Authentication</option>
                <option value="user_management">User Management</option>
                <option value="payroll">Payroll</option>
                <option value="settings">Settings</option>
              </select>
              <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant" />
            </div>
            <div className="relative">
              <select
                defaultValue="7d"
                className="appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-4 pr-10 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant" />
            </div>
            <button className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest p-2 transition-colors hover:bg-surface-container-low">
              <Icon name="filter_list" className="text-on-surface-variant" />
            </button>
            <button className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest p-2 text-primary transition-colors hover:bg-surface-container-low">
              <Icon name="download" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter xl:col-span-8">
          <BentoCard title="Recent Activity" subtitle={`Showing ${formatNumber(AUDIT_LOG.length)} of 2,451 entries`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="border-b border-outline-variant px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Timestamp</th>
                    <th className="border-b border-outline-variant px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Actor</th>
                    <th className="border-b border-outline-variant px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Module</th>
                    <th className="border-b border-outline-variant px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Action &amp; Entity</th>
                    <th className="border-b border-outline-variant px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">IP Address</th>
                    <th className="border-b border-outline-variant px-4 py-3 text-center font-table-header text-table-header uppercase text-on-surface-variant">Result</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {AUDIT_LOG.map((event) => (
                    <tr key={event.id} className="border-b border-outline-variant/50 transition-colors last:border-0 hover:bg-surface-container-low/30">
                      <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                        <div className="flex flex-col">
                          <span>{event.date}</span>
                          <span className="text-[10px] text-outline">{event.time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {event.actorAvatarUrl ? (
                            <img src={event.actorAvatarUrl} alt={event.actorName} className="size-6 rounded-full bg-surface-container-high object-cover" />
                          ) : (
                            <div className="flex size-6 items-center justify-center rounded-full bg-surface-variant text-[10px] font-bold text-on-surface-variant">
                              {event.actorIcon ? <Icon name={event.actorIcon} className="text-[14px]" /> : event.actorInitials}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-on-surface">{event.actorName}</span>
                            <span className="text-[10px] text-primary">{event.actorRole}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface">{event.module}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface">{event.action}</span>
                          <span className="text-[10px] text-on-surface-variant">{event.entity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-outline">{event.ip}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={
                            event.result === "SUCCESS"
                              ? "inline-flex items-center rounded-full bg-tertiary-container/10 px-2 py-0.5 text-[10px] font-medium text-tertiary"
                              : "inline-flex items-center rounded-full bg-error-container/50 px-2 py-0.5 text-[10px] font-medium text-error"
                          }
                        >
                          {event.result === "SUCCESS" ? "Success" : "Failure"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter xl:col-span-4">
          <BentoCard title="Events by Module" subtitle="Volume distribution last 30 days">
            <div className="flex flex-col gap-5">
              {MODULE_SHARE.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-body-md text-[11px] font-medium text-on-surface">
                      <Icon name={item.icon} className={`text-[14px] ${item.colorClassName.replace("bg-", "text-")}`} />
                      {item.label}
                    </span>
                    <span className="font-body-md text-[11px] font-bold text-on-surface">{item.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-container-high">
                    <div className={`h-1.5 rounded-full ${item.colorClassName}`} style={{ width: `${item.percent}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[9px] text-on-surface-variant">{formatNumber(item.count)} events</p>
                </div>
              ))}
            </div>
            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low py-2 font-body-md text-[11px] font-semibold text-primary transition-colors hover:bg-primary-container/10">
              View Detailed Analytics
              <Icon name="arrow_forward" className="text-sm" />
            </button>
          </BentoCard>

          <div className="relative overflow-hidden rounded-card bg-primary p-card-padding text-on-primary shadow-md">
            <div className="absolute -right-10 -top-10 size-32 rounded-full bg-on-primary/10 blur-xl" />
            <div className="relative z-10">
              <h3 className="mb-2 flex items-center gap-2 font-body-md text-body-md font-bold">
                <Icon name="security" />
                Security Alert
              </h3>
              <p className="mb-4 text-[11px] text-on-primary/80">
                Unusual number of failed login attempts detected in the last 24 hours.
              </p>
              <button className="w-full rounded-lg bg-on-primary px-4 py-2 font-body-md text-[11px] font-bold text-primary transition-colors hover:bg-surface-container-low">
                Investigate Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}