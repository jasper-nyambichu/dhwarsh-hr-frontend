import type { ReactNode } from "react";

import { BentoCard } from "@/components/shared/bento-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatMoney, humanizeEnum } from "@/lib/format";
import type { EmployeeResponse } from "@/types";

/**
 * One employee's record, laid out as on the Admin's employee page: a profile banner (who they are, where they work,
 * since when) and the details grouped in cards — personal, employment, statutory numbers, payment and emergency
 * contact. Shared by every portal's employee page; each page adds its own column of actions beside it.
 * Responsive: one column on a phone, two card columns from tablets up, long values wrap.
 */

function Row({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  const shown = value?.trim() ? value : null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-on-surface-variant">{label}</span>
      <span className={`min-w-0 break-words text-right text-sm font-medium ${shown ? "text-on-surface" : "text-outline"} ${mono && shown ? "font-mono" : ""}`}>
        {shown ?? "—"}
      </span>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/** "2 years 3 months", "5 months", "3 weeks" since the hire date. */
function timeServed(dateHired: string | null): string | null {
  if (!dateHired) return null;
  const start = new Date(`${dateHired}T00:00:00`);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 1) {
    const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
    return days < 14 ? `${days} day${days === 1 ? "" : "s"}` : `${Math.floor(days / 7)} weeks`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years} year${years === 1 ? "" : "s"}` : null, rest ? `${rest} month${rest === 1 ? "" : "s"}` : null]
    .filter(Boolean)
    .join(" ");
}

function Fact({ icon, label, value, hint }: { icon: string; label: string; value: string; hint?: string | null }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg bg-surface-container-low/70 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
        <Icon name={icon} className="text-[20px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-outline">{label}</span>
        <span className="block break-words text-sm font-semibold text-on-surface">{value}</span>
        {hint ? <span className="block text-xs text-on-surface-variant">{hint}</span> : null}
      </span>
    </div>
  );
}

/** Who the employee is at a glance. `showSalary` false for viewers who do not see pay (Branch Manager). */
export function EmployeeProfileBanner({ employee, showSalary = true }: { employee: EmployeeResponse; showSalary?: boolean }) {
  const served = timeServed(employee.dateHired);
  return (
    <section aria-label="Employee summary" className="bento-card overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary via-primary-container to-tertiary" aria-hidden />
      <div className="flex flex-col gap-5 p-4 sm:p-card-padding">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-secondary-container text-xl font-bold text-primary shadow-ambient-1 sm:size-20 sm:text-2xl"
          >
            {initials(employee.fullName)}
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-on-surface sm:text-xl">{employee.fullName}</h2>
            <p className="mt-0.5 break-words text-sm text-on-surface-variant">
              <span className="font-mono">{employee.employeeNumber}</span>
              {employee.position ? ` · ${employee.position}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={employee.employmentStatus} />
              {employee.employmentType ? (
                <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                  {humanizeEnum(employee.employmentType)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 ${showSalary ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
          <Fact icon="location_city" label="Branch" value={employee.branchName ?? "—"} hint={employee.departmentName ?? "No department yet"} />
          <Fact icon="handshake" label="Agent" value={employee.agentName ?? "Paid directly"} hint={employee.agentName ? "Pays this employee" : "By the company"} />
          <Fact
            icon="event_available"
            label="Date hired"
            value={employee.dateHired ? formatDate(employee.dateHired) : "—"}
            hint={served ? `${served} of service` : null}
          />
          {showSalary ? (
            <Fact icon="payments" label="Basic salary" value={employee.basicSalary === null ? "Not recorded" : formatMoney(employee.basicSalary)} hint="Per month" />
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Everything recorded about the employee, grouped in cards. */
export function EmployeeInfoCards({ employee, showSalary = true, action }: { employee: EmployeeResponse; showSalary?: boolean; action?: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
      <BentoCard title="Personal" action={action}>
        <Row label="Full name" value={employee.fullName} />
        <Row label="National ID" value={employee.nationalId} mono />
        <Row label="Date of birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null} />
        <Row label="Gender" value={employee.gender ? humanizeEnum(employee.gender) : null} />
        <Row label="Marital status" value={employee.maritalStatus ? humanizeEnum(employee.maritalStatus) : null} />
        <Row label="Phone" value={employee.phone} />
        <Row label="Email" value={employee.email} />
        <Row label="Address" value={employee.address} />
      </BentoCard>

      <BentoCard title="Employment">
        <Row label="Employee number" value={employee.employeeNumber} mono />
        <Row label="Position" value={employee.position} />
        <Row label="Employment type" value={employee.employmentType ? humanizeEnum(employee.employmentType) : null} />
        <Row label="Branch" value={employee.branchName} />
        <Row label="Department" value={employee.departmentName ?? "Not assigned"} />
        <Row label="Agent" value={employee.agentName ?? "Paid directly"} />
        <Row label="Date hired" value={employee.dateHired ? formatDate(employee.dateHired) : null} />
        {showSalary ? <Row label="Basic salary" value={employee.basicSalary === null ? null : formatMoney(employee.basicSalary)} /> : null}
      </BentoCard>

      <BentoCard title="Statutory numbers">
        <Row label="KRA PIN" value={employee.kraPin} mono />
        <Row label="SHIF number" value={employee.shifNumber} mono />
        <Row label="NSSF number" value={employee.nssfNumber} mono />
        <Row label="NITA number" value={employee.nitaNumber} mono />
      </BentoCard>

      <BentoCard title="Payment & emergency contact">
        <Row label="M-Pesa number" value={employee.bankAccountNumber} mono />
        {employee.bankName ? <Row label="Bank / provider" value={employee.bankName} /> : null}
        <Row label="Emergency contact" value={employee.emergencyContactName} />
        <Row label="Emergency phone" value={employee.emergencyContactPhone} />
      </BentoCard>
    </div>
  );
}
