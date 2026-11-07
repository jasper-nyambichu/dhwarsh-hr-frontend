/** `entity/damage/Damage` status, as `DamageResponse.status` carries it. */
export type DamageStatus = "PENDING_CONSENT" | "APPROVED" | "CANCELLED" | "DEDUCTED";

/** How an APPROVED damage was agreed — the employee's fingerprint, or an officer's override. */
export type DamageApprovalMethod = "FINGERPRINT" | "OVERRIDE";

/** `DamageResponse` — one damage and where it stands. */
export type DamageResponse = {
  id: number;
  employeeId: number;
  employeeName: string | null;
  employeeNumber: string | null;
  branchId: number;
  amount: number;
  description: string;
  damageDate: string;
  status: DamageStatus;
  recordedByUserId: number;
  recordedByName: string | null;
  approvalMethod: DamageApprovalMethod | null;
  consentAt: string | null;
  /** True for good once an officer overrode fingerprint consent, even after the damage is deducted. */
  overridden: boolean;
  overrideReason: string | null;
  overriddenByName: string | null;
  overriddenAt: string | null;
  payrollRunId: number | null;
  createdAt: string;
  /** When the agent payment calculation deducted it. Null until then. */
  deductedAt?: string | null;
};

/** The body of `POST /damages` (`DamageRequest`). `damageDate` defaults to today server-side. */
export type DamagePayload = {
  employeeId: number;
  amount: number;
  description: string;
  damageDate?: string;
};

/** `DaysWorkedResponse` — one employee's days in one pay period. */
export type DaysWorkedResponse = {
  employeeId: number;
  employeeName: string;
  employeeNumber: string | null;
  branchId: number;
  periodStart: string;
  periodEnd: string;
  /** What the attendance records say. */
  systemDays: number;
  /** The figure agent payments use: `systemDays`, or a figure locked before locking was removed. */
  daysWorked: number;
  adjusted: boolean;
  adjustmentReason: string | null;
  locked: boolean;
  lockedAt: string | null;
};
