import type { ReactNode } from "react";

import { BentoCard } from "@/components/shared/bento-card";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatMoney, humanizeEnum } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EmployeeCreationRequestResponse } from "@/types/employee-request";

/**
 * Read-only view of what HR submitted, for the admin who has to decide on it.
 *
 * Everything the approval will write is shown here — including salary and the
 * statutory identifiers — because an approval is a decision about those values.
 * Server Component: no state, no hooks.
 */
export function RequestDetails({
  request,
}: {
  request: EmployeeCreationRequestResponse;
}) {
  const d = request.details;

  return (
    <div className="flex flex-col gap-gutter">
      <Section
        icon="person"
        tone="primary"
        title="Personal details"
        subtitle="Legal identification and contact"
      >
        <Field label="Full name" value={d.fullName} wide />
        <Field label="National ID" value={d.nationalId} mono />
        <Field
          label="Date of birth"
          value={d.dateOfBirth ? formatDate(d.dateOfBirth) : null}
        />
        <Field label="Gender" value={d.gender ? humanizeEnum(d.gender) : null} />
        <Field
          label="Marital status"
          value={d.maritalStatus ? humanizeEnum(d.maritalStatus) : null}
        />
        <Field label="Phone" value={d.phone} icon="call" />
        <Field label="Email" value={d.email} icon="mail" />
        <Field label="Address" value={d.address} icon="location_on" wide />
      </Section>

      <Section
        icon="badge"
        tone="secondary"
        title="Employment"
        subtitle="Role, placement and terms"
        action={
          d.employmentType ? (
            <span className="rounded-full bg-primary-fixed/50 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {humanizeEnum(d.employmentType)}
            </span>
          ) : undefined
        }
      >
        <Field label="Job title" value={d.position} />
        <Field label="Branch" value={request.branchName} icon="store" />
        <Field label="Department" value={request.departmentName} />
        <Field
          label="Start date"
          value={d.dateHired ? formatDate(d.dateHired) : null}
        />
        <Field
          label="Agent"
          value={request.agentName ?? "None — direct employee"}
          icon="supervisor_account"
          wide
        />
      </Section>

      <Section
        icon="payments"
        tone="tertiary"
        title="Compensation"
        subtitle="Pay and the account it is paid into"
      >
        <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/20 bg-gradient-to-r from-surface-container-low to-surface-container p-3.5 sm:col-span-2">
          <div className="min-w-0">
            <p className="font-table-header text-table-header uppercase text-outline">
              Basic monthly salary
            </p>
            <p className="mt-0.5 break-words font-card-stat text-card-stat tabular-nums text-primary">
              {d.basicSalary === null ? "—" : formatMoney(d.basicSalary)}
            </p>
          </div>
          <Icon
            name="account_balance_wallet"
            className="shrink-0 text-[28px] text-primary/40"
          />
        </div>

        <RuleList className="sm:col-span-2">
          <Rule label="Bank" value={d.bankName} />
          <Rule label="Account number" value={d.bankAccountNumber} mono />
        </RuleList>
      </Section>

      <Section
        icon="assured_workload"
        tone="primary"
        title="Statutory details"
        subtitle="KRA, NSSF, SHIF and NITA registration"
      >
        <RuleList className="sm:col-span-2">
          <Rule label="KRA PIN" value={d.kraPin} mono />
          <Rule label="NSSF No" value={d.nssfNumber} mono />
          <Rule label="SHIF No" value={d.shifNumber} mono />
          <Rule label="NITA No" value={d.nitaNumber} mono />
        </RuleList>
      </Section>

      <Section
        icon="emergency"
        tone="error"
        title="Emergency contact"
        subtitle="Who to call if something goes wrong"
      >
        <Field label="Contact name" value={d.emergencyContactName} />
        <Field label="Contact phone" value={d.emergencyContactPhone} icon="phone_in_talk" />
      </Section>
    </div>
  );
}

const CHIP_TONE = {
  primary: "bg-primary-fixed/50 text-primary",
  secondary: "bg-secondary-container/50 text-secondary",
  tertiary: "bg-tertiary-container/15 text-tertiary",
  error: "bg-error-container/50 text-error",
} as const;

function Section({
  icon,
  tone,
  title,
  subtitle,
  action,
  children,
}: {
  icon: string;
  tone: keyof typeof CHIP_TONE;
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <BentoCard
      action={action}
      title={
        <span className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              CHIP_TONE[tone],
            )}
          >
            <Icon name={icon} className="text-[20px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold uppercase tracking-wide text-on-surface">
              {title}
            </span>
            <span className="block text-[11px] font-normal text-on-surface-variant">
              {subtitle}
            </span>
          </span>
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </BentoCard>
  );
}

function Field({
  label,
  value,
  mono = false,
  wide = false,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  wide?: boolean;
  icon?: string;
}) {
  return (
    <dl
      className={cn(
        "min-w-0 rounded-xl border border-outline-variant/15 bg-surface-container-low/60 p-3",
        wide && "sm:col-span-2",
      )}
    >
      <dt className="font-table-header text-table-header uppercase text-outline">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 flex items-center gap-1.5 break-words font-body-md text-body-md font-semibold",
          value ? "text-on-surface" : "font-normal text-outline",
          mono && "font-mono text-[12px]",
        )}
      >
        {icon && value ? (
          <Icon name={icon} className="shrink-0 text-[14px] text-primary" />
        ) : null}
        <span className="min-w-0">{value || "—"}</span>
      </dd>
    </dl>
  );
}

function RuleList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "divide-y divide-row-line overflow-hidden rounded-xl border border-row-line",
        className,
      )}
    >
      {children}
    </dl>
  );
}

function Rule({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
      <dt className="font-table-header text-table-header uppercase text-outline">
        {label}
      </dt>
      <dd
        className={cn(
          "break-all font-body-md text-body-md font-semibold",
          value ? "text-on-surface" : "font-normal text-outline",
          mono && "font-mono text-[12px]",
        )}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
