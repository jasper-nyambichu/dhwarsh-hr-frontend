import "server-only";

import { api } from "@/app/lib/api-client";
import type { Paginated } from "@/types";
import type {
  AuditFilterOptions,
  AuditLogResponse,
  AuditSummaryResponse,
} from "@/types/audit";

/**
 * `controller/audit/AuditController` — base `/audit-logs`.
 *
 * Read-only: the controller has no write endpoint and the table is append-only.
 * SUPER_ADMIN, AUDITOR and FINANCE_OFFICER may read; no one may change it.
 */

export type AuditSearch = {
  action?: string;
  entityType?: string;
  userId?: number;
  /** yyyy-MM-dd, inclusive. */
  from?: string;
  to?: string;
  page?: number;
  size?: number;
};

/** The full history log, newest first. Every filter is optional. */
export function getAuditLogs(
  search: AuditSearch = {},
  signal?: AbortSignal,
): Promise<Paginated<AuditLogResponse>> {
  return api.get<Paginated<AuditLogResponse>>("/audit-logs", { query: { ...search }, signal });
}

export function getAuditLog(id: number, signal?: AbortSignal): Promise<AuditLogResponse> {
  return api.get<AuditLogResponse>(`/audit-logs/${id}`, { signal });
}

/** Everything that happened to one record, e.g. `("PayrollRun", 12)`. */
export function getAuditLogsForEntity(
  entityType: string,
  entityId: number,
  size = 20,
  signal?: AbortSignal,
): Promise<Paginated<AuditLogResponse>> {
  return api.get<Paginated<AuditLogResponse>>(`/audit-logs/entity/${encodeURIComponent(entityType)}/${entityId}`, {
    query: { size },
    signal,
  });
}

/** Totals, the login picture and activity breakdowns for a period (max 92 days). */
export function getAuditSummary(
  range: { from?: string; to?: string } = {},
  signal?: AbortSignal,
): Promise<AuditSummaryResponse> {
  return api.get<AuditSummaryResponse>("/audit-logs/summary", { query: { ...range }, signal });
}

/** The actions, record types and users that actually appear in the log. */
export function getAuditFilterOptions(signal?: AbortSignal): Promise<AuditFilterOptions> {
  return api.get<AuditFilterOptions>("/audit-logs/filters", { signal });
}