import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { getCurrentUser, requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getCompany, getCompanySettings } from "@/lib/api/company";
import { formatPercent, humanizeEnum } from "@/lib/format";
import type { CompanyResponse, CompanySettingsResponse } from "@/types";

/**
 * Settings — company profile and payroll rules, read from the backend.
 *
 * Both reads exist: `GET /company` and `GET /company/settings`. Both are
 * rendered read-only.
 *
 * The placeholder form carried four fields that have no column behind them —
 * **cut-off day**, **rounding rule**, and the three **automation toggles**
 * (auto-recover advances, auto-recover loans, email payslips). `company_settings`
 * holds VAT rate, working hours, overtime multiplier, weekend days and payroll
 * period, and nothing else. They are gone rather than left as controls that
 * save into the void.
 *
 * Super-admin-only editing is real and is stated on the page: `PUT
 * /company/settings` is `hasRole('SUPER_ADMIN')` while ADMIN holds only
 * `company:settings` (read). The write form itself lands with the mutations
 * batch; showing an ADMIN an enabled Save button in the meantime would be a
 * lie, so an ADMIN gets a plain note instead.
 */

const SECTIONS = [
  { id: "profile", label: "Company Profile", icon: "apartment" },
  { id: "payroll", label: "Payroll Rules", icon: "payments" },
] as const;

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-surface-variant py-3 last:border-0">
      <div className="min-w-0">
        <p className="font-body-md text-body-md font-medium text-on-surface">
          {label}
        </p>
        {hint ? (
          <p className="mt-0.5 text-xs text-on-surface-variant">{hint}</p>
        ) : null}
      </div>
      <p className="shrink-0 text-right font-body-md text-body-md tabular-nums text-on-surface-variant">
        {value}
      </p>
    </div>
  );
}

export default async function AdminSettingsPage() {
  // ADMIN holds `company:settings` but deliberately not `company:write` —
  // that one is SUPER_ADMIN-only (see ROLE_PERMISSIONS). Gating on
  // `company:write` bounced the administrator off their own settings screen.
  await requirePermission("company:settings");

  const viewer = await getCurrentUser();

  let company: CompanyResponse;
  let settings: CompanySettingsResponse;

  try {
    [company, settings] = await Promise.all([
      getCompany(),
      getCompanySettings(),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Settings"
        description="Company profile and payroll rules."
        subject="Company settings"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const canWrite = viewer.role === "SUPER_ADMIN";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Company profile and the rules payroll is calculated against."
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-gutter md:flex-row">
        {/* ───────────────────────────────── sub-nav ─────────────────── */}
        <div className="w-full flex-shrink-0 md:w-64">
          <div className="sticky top-24 rounded-card bg-surface-container-lowest p-4 shadow-ambient-1">
            <h2 className="mb-4 pl-3 font-table-header text-table-header uppercase text-on-surface-variant">
              Settings Menu
            </h2>
            <ul className="flex flex-col gap-1">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                  >
                    <Icon
                      name={section.icon}
                      className="text-lg text-outline"
                    />
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ───────────────────────────────── panels ─────────────────── */}
        <div className="flex flex-1 flex-col gap-gutter">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="apartment" className="text-primary" />
                Company Profile
              </span>
            }
          >
            {/* `id` on an inner div because BentoCard owns the heading. */}
            <div id="profile">
              <Row label="Registered Name" value={company.name} />
              <Row label="KRA PIN" value={company.kraPin ?? "—"} />
              <Row label="NSSF Number" value={company.nssfNumber ?? "—"} />
              <Row label="SHIF Number" value={company.shifNumber ?? "—"} />
              <Row label="NITA Number" value={company.nitaNumber ?? "—"} />
              <Row label="Currency" value={company.currency ?? "—"} />
              <Row label="Timezone" value={company.timezone ?? "—"} />
              <Row label="Email" value={company.email ?? "—"} />
              <Row label="Phone" value={company.phone ?? "—"} />
              <Row label="Address" value={company.address ?? "—"} />
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="manage_accounts" className="text-primary" />
                Payroll Rules
              </span>
            }
          >
            <div id="payroll">
              <Row
                label="Payroll Period"
                value={humanizeEnum(settings.payrollPeriod)}
                hint="How often a payroll run is generated."
              />
              <Row
                label="VAT Rate"
                value={formatPercent(settings.vatRate, 2)}
                hint="Applied to agent invoices for VAT-registered suppliers."
              />
              <Row
                label="Overtime Multiplier"
                value={
                  settings.overtimeMultiplier === null
                    ? "—"
                    : `${settings.overtimeMultiplier.toFixed(2)}×`
                }
                hint="Hourly rate multiplier for approved overtime."
              />
              <Row
                label="Working Hours per Day"
                value={
                  settings.defaultWorkingHoursPerDay === null
                    ? "—"
                    : `${settings.defaultWorkingHoursPerDay.toFixed(2)} hrs`
                }
              />
              <Row
                label="Weekend Days"
                value={settings.weekendDays ?? "—"}
                hint="Excluded from working-day and absence calculations."
              />
            </div>
          </BentoCard>

          <div className="flex items-center gap-3 rounded-card bg-surface-container-lowest p-card-padding shadow-ambient-1">
            <span
              className={
                canWrite
                  ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-soft text-primary-container"
                  : "flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
              }
            >
              <Icon name={canWrite ? "edit" : "lock"} className="text-lg" />
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {canWrite ? (
                <>
                  These values are set by the platform owner. Editing them from
                  here is not wired yet.
                </>
              ) : (
                <>
                  Read-only. Payroll rules and statutory rates are changed by the
                  platform owner.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
