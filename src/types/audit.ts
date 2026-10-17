/** Mirrors `dto/response/audit/*`. */

export type AuditLogResponse = {
  id: number;
  performedByUserId: number | null;
  performedByUsername: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  /** Small JSON text: method, path, ip and a few labels — never a request body. */
  detailsJson: string | null;
  createdAt: string;
};

export type AuditCount = { label: string; count: number };
export type AuditUserCount = { userId: number; username: string | null; count: number };
export type AuditDayCount = { date: string; count: number };

export type AuditSummaryResponse = {
  from: string;
  to: string;
  totalEvents: number;
  loginSuccess: number;
  loginFailed: number;
  payrollRuns: number;
  byEntityType: AuditCount[];
  byAction: AuditCount[];
  topUsers: AuditUserCount[];
  daily: AuditDayCount[];
};

export type AuditFilterOptions = {
  actions: string[];
  entityTypes: string[];
  users: { id: number; username: string }[];
};