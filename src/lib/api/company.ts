import "server-only";

import { api } from "@/app/lib/api-client";
import type { CompanyResponse, CompanySettingsResponse } from "@/types";

/**
 * `controller/company/CompanyController` and `CompanySettingsController`.
 *
 * Both are singleton resources — the deployment is single-tenant and the backend
 * resolves "the company" itself, so nothing here takes an id. Both return 404 on
 * a database where they have not been set up yet; saving the company the first
 * time also creates the default settings row.
 */

/** Company profile. Open to any authenticated principal — it feeds the header. */
export function getCompany(signal?: AbortSignal): Promise<CompanyResponse> {
  return api.get<CompanyResponse>("/company", { signal });
}

/**
 * Payroll settings — VAT rate, working hours, overtime multiplier, weekend days,
 * payroll period. Admin reads and writes.
 */
export function getCompanySettings(signal?: AbortSignal): Promise<CompanySettingsResponse> {
  return api.get<CompanySettingsResponse>("/company/settings", { signal });
}

export type CompanyInput = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  kraPin?: string;
  shifNumber?: string;
  nssfNumber?: string;
  nitaNumber?: string;
  currency?: string;
  timezone?: string;
};

/** Creates or updates the company. Admin. Replaces every field except the logo. */
export function saveCompany(payload: CompanyInput): Promise<CompanyResponse> {
  return api.put<CompanyResponse>("/company", payload);
}

export type CompanySettingsInput = {
  vatRate: number;
  defaultWorkingHoursPerDay?: number;
  overtimeMultiplier?: number;
  /** Comma-separated day names, at most two — e.g. "SATURDAY,SUNDAY". */
  weekendDays?: string;
  /** Only MONTHLY is supported by the payroll engine. */
  payrollPeriod?: string;
};

/** Saves the logo. Multipart, so `api.post` leaves the Content-Type to the runtime. */
export function uploadCompanyLogo(body: FormData): Promise<CompanyResponse> {
  return api.post<CompanyResponse>("/company/logo", body);
}

export function removeCompanyLogo(): Promise<CompanyResponse> {
  return api.delete<CompanyResponse>("/company/logo");
}

/** Updates the settings (creating them on first use). Admin. */
export function updateCompanySettings(
  payload: CompanySettingsInput,
): Promise<CompanySettingsResponse> {
  return api.put<CompanySettingsResponse>("/company/settings", payload);
}