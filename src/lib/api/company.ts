import "server-only";

import { api } from "@/app/lib/api-client";
import type { CompanyResponse, CompanySettingsResponse } from "@/types";

/**
 * `controller/company/CompanyController` and `CompanySettingsController`.
 *
 * Both are singleton reads — the deployment is single-tenant and the backend
 * resolves "the company" itself, so nothing here takes an id. That is also why
 * there is no company list to page.
 */

/** Company profile. Open to any authenticated principal — it feeds the header. */
export function getCompany(signal?: AbortSignal): Promise<CompanyResponse> {
  return api.get<CompanyResponse>("/company", { signal });
}

/**
 * Payroll and statutory settings — VAT rate, working hours, overtime
 * multiplier, weekend days, payroll period.
 *
 * SUPER_ADMIN, ADMIN and PAYROLL_OFFICER may read these. Only SUPER_ADMIN may
 * write them (`PUT /company/settings`), so an ADMIN sees this panel read-only.
 */
export function getCompanySettings(
  signal?: AbortSignal,
): Promise<CompanySettingsResponse> {
  return api.get<CompanySettingsResponse>("/company/settings", { signal });
}
