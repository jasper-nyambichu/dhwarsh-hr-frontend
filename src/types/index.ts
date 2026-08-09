/**
 * Domain types mirroring `V1__baseline_schema.sql` and the backend
 * `dto/response` package.
 *
 * Conventions:
 *  - `id` is BIGSERIAL server-side → `number` here.
 *  - NUMERIC(15,2) money columns → `number`. Format at the edge, never compute
 *    in the browser; the payroll engine is authoritative.
 *  - DATE → "yyyy-MM-dd", TIMESTAMP → ISO-8601, TIME → "HH:mm:ss".
 */

import type { Role } from "@/config/roles";

export type { Role, Permission, PrincipalType } from "@/config/roles";

/* --------------------------------------------------------------- common -- */

/** BaseEntity columns present on every table. */
export type AuditFields = {
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

/**
 * Backend `dto/response/PageResponse` — a trimmed projection of Spring Data
 * `Page<T>`, not the raw Jackson serialization. There is no `first` flag;
 * derive it from `pageNumber === 0`.
 */
export type Paginated<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

/** Return shape for Server Actions wired to `useActionState`. */
export type ActionState<T = void> =
  | { status: "idle" }
  | { status: "success"; data: T }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

/* ---------------------------------------------------------- enumerations -- */

export const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export type Status = (typeof STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  "PERMANENT",
  "CONTRACT",
  "CASUAL",
  "INTERN",
  "OUTSOURCED",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_STATUSES = [
  "ACTIVE",
  "PROBATION",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];

export const MARITAL_STATUSES = [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const DOCUMENT_TYPES = [
  "CONTRACT",
  "NATIONAL_ID",
  "KRA_PIN",
  "CERTIFICATE",
  "CV",
  "OTHER",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** `agents.charge_type` — drives the agentformula VAT calculation. */
export const CHARGE_TYPES = ["FIXED", "PERCENTAGE", "PER_EMPLOYEE"] as const;
export type ChargeType = (typeof CHARGE_TYPES)[number];

export const ADVANCE_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "OUTSTANDING",
  "RECOVERED",
] as const;
export type AdvanceStatus = (typeof ADVANCE_STATUSES)[number];

/** `attendance.source` — MANUAL entries are auditable, BIOMETRIC are not editable. */
export const ATTENDANCE_SOURCES = ["BIOMETRIC", "MANUAL", "MOBILE", "WEB"] as const;
export type AttendanceSource = (typeof ATTENDANCE_SOURCES)[number];

export const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
  "HOLIDAY",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const DEVICE_STATUSES = ["ONLINE", "OFFLINE", "DISABLED"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const SHIFT_TYPES = ["DAY", "NIGHT", "SPLIT", "FLEXIBLE"] as const;
export type ShiftType = (typeof SHIFT_TYPES)[number];

/**
 * Two-stage approval: `approved_by_manager_id` then `approved_by_hr_id`.
 * PENDING_HR means the branch manager has signed off and HR is next.
 */
export const LEAVE_STATUSES = [
  "PENDING",
  "PENDING_HR",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LOAN_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "SETTLED",
] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const PAYROLL_RUN_STATUSES = [
  "DRAFT",
  "PROCESSING",
  "COMPLETED",
  "APPROVED",
  "FAILED",
  "CANCELLED",
] as const;
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export const PAYROLL_PERIODS = ["MONTHLY", "BIWEEKLY", "WEEKLY"] as const;
export type PayrollPeriod = (typeof PAYROLL_PERIODS)[number];

export const NOTIFICATION_CHANNELS = ["IN_APP", "EMAIL", "SMS"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/* ------------------------------------------------------------------ auth -- */

/** Projection of `users`, safe to hand to Client Components. */
export type CurrentUser = {
  id: number;
  username: string;
  displayName: string | null;
  role: Role;
  employeeId: number | null;
  agentId: number | null;
  branchId: number | null;
  active: boolean;
  mustChangePassword: boolean;
};

export type UserAccount = CurrentUser & AuditFields;

/* --------------------------------------------------------------- company -- */

export type Company = AuditFields & {
  id: number;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  kraPin: string | null;
  shifNumber: string | null;
  nssfNumber: string | null;
  nitaNumber: string | null;
  currency: string | null;
  timezone: string | null;
};

export type CompanySettings = AuditFields & {
  id: number;
  companyId: number;
  vatRate: number;
  defaultWorkingHoursPerDay: number | null;
  overtimeMultiplier: number | null;
  weekendDays: string | null;
  payrollPeriod: PayrollPeriod | null;
};

/* -------------------------------------------------- branch / department -- */

export type Branch = AuditFields & {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  managerId: number | null;
  status: Status;
};

export type Department = AuditFields & {
  id: number;
  name: string;
  branchId: number;
  branchName?: string;
  headOfDepartmentId: number | null;
};

/* ----------------------------------------------------------------- agent -- */

export type Agent = AuditFields & {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  kraPin: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  chargeType: ChargeType;
  chargeAmount: number | null;
  chargePercentage: number | null;
  vatRegistered: boolean;
  status: Status;
};

export type AgentAdvance = AuditFields & {
  id: number;
  agentId: number;
  agentName?: string;
  amount: number;
  advanceDate: string;
  purpose: string | null;
  outstandingBalance: number;
  status: AdvanceStatus;
};

/* -------------------------------------------------------------- employee -- */

/** List-row projection. Excludes salary — see `EmployeeDetail`. */
export type EmployeeSummary = {
  id: number;
  fullName: string;
  employeeNumber: string;
  passportPhotoUrl: string | null;
  position: string | null;
  branchId: number;
  branchName?: string;
  departmentId: number | null;
  departmentName?: string;
  agentId: number | null;
  agentName?: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  dateHired: string | null;
};

/**
 * Full record. `basicSalary`, `nationalId`, `kraPin` and bank fields are
 * PII/compensation — the DAL strips them for roles without `employee:read`.
 */
export type EmployeeDetail = EmployeeSummary &
  AuditFields & {
    nationalId: string | null;
    dateOfBirth: string | null;
    gender: Gender | null;
    maritalStatus: MaritalStatus | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    kraPin: string | null;
    shifNumber: string | null;
    nssfNumber: string | null;
    nitaNumber: string | null;
    basicSalary: number | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  };

export type EmployeeDocument = AuditFields & {
  id: number;
  employeeId: number;
  documentType: DocumentType;
  fileUrl: string;
  fileName: string | null;
};

/* ---------------------------------------------- attendance / biometrics -- */

export type Attendance = AuditFields & {
  id: number;
  employeeId: number;
  employeeName?: string;
  branchId: number;
  attendanceDate: string;
  clockIn: string | null;
  clockOut: string | null;
  source: AttendanceSource;
  status: AttendanceStatus;
  eventId: string | null;
  deviceId: number | null;
  matchConfidenceScore: number | null;
};

export type BiometricDevice = AuditFields & {
  id: number;
  branchId: number;
  branchName?: string;
  deviceSerial: string;
  lastSyncAt: string | null;
  status: DeviceStatus;
};

/** Never exposes `template_data` (BYTEA) to the client. */
export type BiometricTemplate = {
  id: number;
  employeeId: number;
  branchId: number;
  fingerIndex: number;
  qualityScore: number | null;
  enrolledAt: string;
};

/* ----------------------------------------------------------------- shift -- */

export type Shift = AuditFields & {
  id: number;
  name: string;
  type: ShiftType;
  startTime: string | null;
  endTime: string | null;
};

export type ShiftAssignment = AuditFields & {
  id: number;
  shiftId: number;
  shiftName?: string;
  employeeId: number | null;
  departmentId: number | null;
  branchId: number | null;
};

/* ----------------------------------------------------------------- leave -- */

export type LeaveTypeRecord = AuditFields & {
  id: number;
  name: string;
  defaultEntitlementDays: number | null;
  paid: boolean;
};

export type LeaveRequest = AuditFields & {
  id: number;
  employeeId: number;
  employeeName?: string;
  leaveTypeId: number;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  days?: number;
  reason: string | null;
  status: LeaveStatus;
  approvedByManagerId: number | null;
  approvedByHrId: number | null;
  rejectionReason: string | null;
};

/* ------------------------------------------------------------------ loan -- */

export type Loan = AuditFields & {
  id: number;
  employeeId: number;
  employeeName?: string;
  principalAmount: number;
  interestRate: number | null;
  installmentAmount: number;
  outstandingBalance: number;
  requestDate: string | null;
  approvalDate: string | null;
  status: LoanStatus;
};

export type LoanRepayment = AuditFields & {
  id: number;
  loanId: number;
  payrollRunId: number;
  amountPaid: number;
};

/* --------------------------------------------------------------- payroll -- */

export type PayrollRun = AuditFields & {
  id: number;
  periodStart: string;
  periodEnd: string;
  scopeBranchIds: string | null;
  scopeAgentIds: string | null;
  scopeDepartmentIds: string | null;
  status: PayrollRunStatus;
  totalGrossPayroll: number | null;
  totalNetPayroll: number | null;
  initiatedByUserId: number | null;
};

/** Poll target while `status === "PROCESSING"` (payroll/batch). */
export type PayrollRunStatusResponse = {
  id: number;
  status: PayrollRunStatus;
  processedCount: number;
  totalCount: number;
  message: string | null;
};

export type Payslip = AuditFields & {
  id: number;
  payrollRunId: number;
  employeeId: number;
  employeeName?: string;
  employeeNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  basicSalary: number;
  houseAllowance: number | null;
  transportAllowance: number | null;
  overtimePay: number | null;
  bonus: number | null;
  otherAllowances: number | null;
  grossPay: number;
  shifDeduction: number | null;
  nssfDeduction: number | null;
  housingLevyDeduction: number | null;
  payeDeduction: number | null;
  nitaDeduction: number | null;
  loanDeduction: number | null;
  otherDeductions: number | null;
  netPay: number;
};

/** Agent invoice line — output of service/payroll/agentformula. */
export type AgentPayrollSummary = AuditFields & {
  id: number;
  payrollRunId: number;
  agentId: number;
  agentName?: string;
  employeeCount: number | null;
  grossSalaries: number;
  serviceCharge: number;
  shifTotal: number | null;
  nssfTotal: number | null;
  housingLevyTotal: number | null;
  payeTotal: number | null;
  employeeLoanDeductionsTotal: number | null;
  advanceRecoveryTotal: number | null;
  subtotalBeforeVat: number;
  vatApplied: boolean;
  vatRateUsed: number | null;
  vatAmount: number | null;
  finalAmountPayable: number;
};

/* --------------------------------------------- notification / audit log -- */

export type Notification = AuditFields & {
  id: number;
  recipientUserId: number;
  channel: NotificationChannel;
  type: string;
  message: string;
  read: boolean;
};

export type AuditLog = AuditFields & {
  id: number;
  performedByUserId: number | null;
  performedByUsername?: string;
  action: string;
  entityType: string;
  entityId: number | null;
  detailsJson: string | null;
};
