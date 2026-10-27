import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PayModelForm } from "@/components/features/settings/pay-model-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getPaySettings } from "@/lib/api/pay-settings";
import type { PaySettingsResponse } from "@/types/pay-model";

/** What a fresh install starts with — the same values the database migration seeds. */
const DEFAULTS: PaySettingsResponse = {
  id: 0,
  vatRate: 0,
  defaultWorkingHoursPerDay: 8,
  overtimeMultiplier: 1.5,
  weekendDays: "SATURDAY,SUNDAY",
  payrollPeriod: "MONTHLY",
  dailyRate: 1000,
  shifMode: "PERCENT",
  shifValue: 2.75,
  nssfMode: "PERCENT",
  nssfValue: 6,
  applyHousingLevy: false,
  applyPaye: false,
  applyNita: false,
  deductionCeilingPercent: 66.67,
};

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && (error as { status: unknown }).status === 404;
}

/** The Admin's pay rates: daily rate, SHIF and NSSF, the optional statutory items and the deduction limit. */
export default async function PaySettingsPage() {
  await requirePermission("settings:manage");

  let settings: PaySettingsResponse;
  let notSetUp = false;

  try {
    settings = await getPaySettings();
  } catch (error) {
    if (!isNotFound(error)) {
      return (
        <DataUnavailable
          title="Pay rates"
          subject="The pay settings"
          reason={error instanceof ApiError ? error.message : undefined}
        />
      );
    }
    settings = DEFAULTS;
    notSetUp = true;
  }

  return (
    <>
      <PageHeader
        title="Pay rates"
        description="Pay is worked out from the days the Back Office locks and the daily rate you set here. SHIF and NSSF are added on top."
      />

      {notSetUp ? (
        <p className="mb-4 rounded-card bg-surface-container-low p-3 text-sm text-on-surface-variant" role="status">
          Settings have not been saved yet, so the usual starting values are shown. Saving creates them.
        </p>
      ) : null}

      <PayModelForm initial={settings} />
    </>
  );
}