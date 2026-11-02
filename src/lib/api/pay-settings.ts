import "server-only";

import { api } from "@/app/lib/api-client";
import type { PaySettingsPayload, PaySettingsResponse } from "@/types/pay-model";

/**
 * `controller/company/CompanySettingsController` — base `/company/settings`.
 *
 * The Admin sets the daily rate, NSSF (a percentage of pay or a fixed amount), the VAT rate and the
 * deduction ceiling. Every field after `vatRate` is optional on the backend, so a save here leaves
 * the other settings alone.
 */

export function getPaySettings(signal?: AbortSignal): Promise<PaySettingsResponse> {
  return api.get<PaySettingsResponse>("/company/settings", { signal });
}

export function updatePaySettings(request: PaySettingsPayload): Promise<PaySettingsResponse> {
  return api.put<PaySettingsResponse>("/company/settings", request);
}