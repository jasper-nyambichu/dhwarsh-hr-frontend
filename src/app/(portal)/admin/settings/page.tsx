import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { getCurrentUser, requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getCompany, getCompanySettings } from "@/lib/api/company";
import type { CompanyResponse, CompanySettingsResponse } from "@/types";

import { CompanyForm } from "./_components/company-form";
import { SettingsForm } from "./_components/settings-form";

/**
 * Settings — company profile and the payroll rules, editable by Super Admin.
 *
 * Both reads return 404 on a database where they were never set up. That is a
 * first-run state, not a failure: Super Admin gets the empty company form to fill
 * in (saving it also creates the default payroll settings), and anyone else is told
 * the company is not set up yet. Any other failure is a real error.
 */
export default async function AdminSettingsPage() {
  await requirePermission("company:settings");
  const viewer = await getCurrentUser();
  const canWrite = viewer.role === "SUPER_ADMIN";

  const [companyResult, settingsResult] = await Promise.allSettled([getCompany(), getCompanySettings()]);

  const failures = [companyResult, settingsResult].flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (failures.some((reason) => reason instanceof ApiError && reason.isUnauthorized)) redirect("/login");

  const realFailure = failures.find((reason) => !(reason instanceof ApiError && reason.isNotFound));
  if (realFailure) {
    return (
      <DataUnavailable
        title="Settings"
        description="Company profile and payroll rules."
        subject="Company settings"
        reason={realFailure instanceof ApiError ? realFailure.message : undefined}
      />
    );
  }

  const company: CompanyResponse | null = companyResult.status === "fulfilled" ? companyResult.value : null;
  const settings: CompanySettingsResponse | null = settingsResult.status === "fulfilled" ? settingsResult.value : null;

  return (
    <>
      <PageHeader title="Settings" description="Company profile and the rules payroll is calculated against." />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-gutter">
        {!company && !canWrite ? (
          <div className="rounded-card border border-dashed border-amber-main/40 bg-amber-main/5 p-6 text-center font-body-md text-body-md text-on-surface-variant">
            The company has not been set up yet. The Super Admin needs to complete it before payroll can run.
          </div>
        ) : (
          <CompanyForm initial={company} readOnly={!canWrite} />
        )}

        {company ? (
          <SettingsForm
            readOnly={!canWrite}
            saved={settings !== null}
            initial={{
              vatRate: settings?.vatRate ?? 16,
              defaultWorkingHoursPerDay: settings?.defaultWorkingHoursPerDay ?? 8,
              overtimeMultiplier: settings?.overtimeMultiplier ?? 1.5,
              weekendDays: settings?.weekendDays ?? "SATURDAY,SUNDAY",
            }}
          />
        ) : null}

        <div className="flex items-center gap-3 rounded-card bg-surface-container-lowest p-card-padding shadow-ambient-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
            <Icon name={canWrite ? "edit" : "lock"} className="text-lg" />
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {canWrite
              ? "Only the Super Admin can change these. Statutory rates (SHIF, NSSF, Housing Levy, PAYE, NITA) are currently set in the payroll engine, not here."
              : "Read-only. Company details and payroll rules are changed by the Super Admin."}
          </p>
        </div>
      </div>
    </>
  );
}