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

/**
 * `branch.status` and `agent.status` — a plain `String` column on both entities,
 * defaulting to "ACTIVE".
 *
 * There is no SUSPENDED. Deactivation writes "INACTIVE" and nothing writes
 * anything else (`BranchServiceImpl.deactivateBranch:73`,
 * `AgentServiceImpl.deactivateAgent:68`), so a third member would only ever
 * describe a state the backend cannot produce.
 */
export const STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type Status = (typeof STATUSES)[number];

// Mirrors EmploymentType in the backend entity package:
// PERMANENT, CONTRACT, CASUAL, OUTSOURCED. There is no INTERN.
export const EMPLOYMENT_TYPES = [
  "PERMANENT",
  "CONTRACT",
  "CASUAL",
  "OUTSOURCED",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

// Employee.employmentStatus is a plain String in the backend, defaulted to
// "ACTIVE" and documented there as ACTIVE, INACTIVE, TERMINATED — that comment
// is the only definition of the domain, and terminateEmployee() sets
// "TERMINATED". PROBATION / ON_LEAVE / SUSPENDED do not exist anywhere in the
// backend; ON_LEAVE is an *attendance* status, not an employment one.
export const EMPLOYMENT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
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

/**
 * `agents.charge_type` — mirrors `entity/agent/ChargeType.java` exactly.
 *
 * The previous list (`FIXED` / `PERCENTAGE`) named values the backend enum does
 * not have, so a form built from it would have POSTed a charge type the server
 * rejects. `AgentRequest.chargeType` is typed as the Java enum, so this is the
 * set that actually round-trips.
 */
export const CHARGE_TYPES = [
  "PER_EMPLOYEE",
  "PERCENTAGE_OF_GROSS",
  "FIXED_MONTHLY",
  "CUSTOM",
] as const;
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

/**
 * `entity/shift/ShiftType`.
 *
 * These are shift *types*, not shift names — the seeded demo shifts are called
 * "Day", "Night" and "Split", and their types are MORNING, NIGHT and EVENING.
 * A form that offers the names as the type sends values the Java enum rejects.
 */
export const SHIFT_TYPES = [
  "MORNING",
  "EVENING",
  "NIGHT",
  "ROTATING",
  "FLEXIBLE",
] as const;
export type ShiftType = (typeof SHIFT_TYPES)[number];

/**
 * Two-stage approval: `approved_by_manager_id` then `approved_by_hr_id`.
 * PENDING_HR means the branch manager has signed off and HR is next.
 *
 * `entity/leave/LeaveStatus` — the values are exactly these four. There is no
 * plain PENDING and no CANCELLED.
 */
export const LEAVE_STATUSES = [
  "PENDING_MANAGER",
  "PENDING_HR",
  "APPROVED",
  "REJECTED",
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

/* ------------------------------------------------- attendance dashboard -- */

/**
 * Read projections from `controller/attendance/AttendanceDashboardController`.
 *
 * These are NOT the `Attendance` entity above. That type mirrors the
 * `attendance` table; these mirror what the dashboard actually computes — an
 * employee who is still on shift is `IN_PROGRESS`, one who has clocked out is
 * `COMPLETED`, and a record's `hoursWorked` is a decimal number of hours. The
 * `ATTENDANCE_STATUSES` union above deliberately does not cover them: widening
 * it would let an entity-shaped row carry a projection status, and every
 * existing consumer would silently accept it.
 */

/** Which way the finger went. Decided on the terminal, not by the server. */
export const ATTENDANCE_ACTIVITY_TYPES = ["CLOCK_IN", "CLOCK_OUT"] as const;
export type AttendanceActivityType = (typeof ATTENDANCE_ACTIVITY_TYPES)[number];

export const ATTENDANCE_RECORD_STATUSES = ["IN_PROGRESS", "COMPLETED"] as const;
export type AttendanceRecordStatus = (typeof ATTENDANCE_RECORD_STATUSES)[number];

/** A device that has never reported. Distinct from OFFLINE, which has. */
export const BRANCH_DEVICE_STATUSES = ["ONLINE", "OFFLINE", "NO_DEVICE"] as const;
export type BranchDeviceStatus = (typeof BRANCH_DEVICE_STATUSES)[number];

export type AttendanceDashboardSummary = {
  /** The business-day the figures cover, in the company timezone. */
  date: string;
  generatedAt: string;
  expectedEmployees: number;
  reported: number;
  currentlyIn: number;
  clockedOut: number;
  notYetIn: number;
  /** On an off day and did not scan. Not counted in the expected figure. */
  offToday: number;
  attendanceRatePercent: number;
  devicesTotal: number;
  devicesOnline: number;
  branches: AttendanceBranchSummary[];
};

export type AttendanceBranchSummary = {
  branchId: number;
  branchName: string;
  branchCode: string | null;
  expected: number;
  reported: number;
  currentlyIn: number;
  clockedOut: number;
  notYetIn: number;
  offToday: number;
  attendanceRatePercent: number;
  lastActivityAt: string | null;
  deviceStatus: BranchDeviceStatus;
  deviceLastSyncAt: string | null;
};

/** One row of the live feed. A single attendance record yields up to two. */
export type AttendanceActivityItem = {
  attendanceId: number;
  employeeId: number;
  employeeName: string | null;
  employeeNumber: string | null;
  branchId: number;
  branchName: string | null;
  type: AttendanceActivityType;
  occurredAt: string;
  source: AttendanceSource;
};

export type AttendanceRecordItem = {
  id: number;
  employeeId: number;
  employeeName: string | null;
  employeeNumber: string | null;
  position: string | null;
  branchId: number;
  branchName: string | null;
  attendanceDate: string;
  clockIn: string | null;
  clockOut: string | null;
  /** Decimal hours. Not minutes — see `formatHours` in `lib/format`. */
  hoursWorked: number | null;
  status: AttendanceRecordStatus;
  source: AttendanceSource;
};

/**
 * `dto/response/attendance/AttendanceResponse` — what the plain attendance
 * endpoints return.
 *
 * Distinct from `AttendanceRecordItem` above, which is the *dashboard
 * controller's* projection. That one adds `employeeNumber`, `position`,
 * `branchName` and `hoursWorked`; this one has none of them. Rendering a record
 * from `/attendance/employee/{id}` through the dashboard type would show four
 * columns that are always null.
 *
 * `status` here is the raw `attendance.status` column, not the dashboard's
 * derived `AttendanceRecordStatus`. The Java DTO declares it as a plain
 * `String`, and the entity's own comment lists OVERTIME among the values while
 * `ATTENDANCE_STATUSES` does not — so a row can legitimately carry a value
 * outside the union below. Consumers must handle an unrecognised status rather
 * than assume the union is exhaustive.
 */
export type AttendanceResponse = {
  id: number;
  employeeId: number;
  employeeName: string | null;
  branchId: number;
  attendanceDate: string;
  clockIn: string | null;
  clockOut: string | null;
  source: AttendanceSource;
  status: AttendanceStatus;
};

export type AttendanceDeviceItem = {
  id: number;
  branchId: number;
  branchName: string | null;
  deviceSerial: string;
  status: string;
  lastSyncAt: string | null;
  /** Reported inside the backend's 5-minute freshness window. */
  online: boolean;
};

/**
 * A scan the backend refused — unmapped finger, wrong branch, employee on
 * leave, inactive employee. Kept on the dashboard because it is the only place
 * an administrator finds out that a clock-in silently did not happen.
 */
export type AttendanceSyncFailure = {
  id: number;
  createdAt: string;
  eventId: string;
  deviceSerial: string | null;
  employeeId: number | null;
  employeeName: string | null;
  reason: string;
};

/** Payload of the polling route at `/api/attendance/live`. */
export type AttendanceLiveSnapshot = {
  summary: AttendanceDashboardSummary;
  activity: AttendanceActivityItem[];
  fetchedAt: string;
};

/* ------------------------------------------------- wire response types -- */

/**
 * The shapes the backend actually returns, named after the Java records in
 * `dto/response/**`.
 *
 * These are deliberately separate from the entity-shaped types above. The
 * entities carry `AuditFields` and every column; the response records are
 * projections that drop most of them and add a few computed ones. Treating the
 * two as the same type is how a page ends up rendering `createdAt` as
 * `undefined` and calling a column "missing" when it was never sent.
 *
 * Where a record omits a field the entity has, that is intentional — those
 * widgets have no data source and must render an honest empty state rather
 * than a plausible-looking zero.
 */

/** `dto/response/company/CompanyResponse`. Note: no audit fields, no counts. */
export type CompanyResponse = {
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

/**
 * `dto/response/company/CompanySettingsResponse`.
 *
 * `companyId` is absent: the deployment is single-tenant and the backend
 * resolves the company itself, so the client never needs to send one.
 */
export type CompanySettingsResponse = {
  id: number;
  vatRate: number;
  defaultWorkingHoursPerDay: number | null;
  overtimeMultiplier: number | null;
  weekendDays: string | null;
  payrollPeriod: PayrollPeriod | null;
};

/**
 * `dto/response/branch/BranchResponse`.
 *
 * No region, headcount, attendance rate or payroll total — `branches` has no
 * region column at all and the rest are aggregates the backend does not
 * compute. The branch list must not show those columns.
 */
export type BranchResponse = {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  managerId: number | null;
  managerName: string | null;
  status: Status;
};

/**
 * `dto/response/department/DepartmentResponse`.
 *
 * Departments are company-wide (`departments.branch_id` is no longer used), so the
 * backend can return a null `branchId`. Kept in sync with `CompanyDepartment`.
 */
export type DepartmentResponse = {
  id: number;
  name: string;
  branchId: number | null;
  branchName: string | null;
  headOfDepartmentId: number | null;
  headOfDepartmentName: string | null;
};

/**
 * `dto/response/agent/AgentResponse`.
 *
 * `employeeCount` is the one aggregate the backend does supply, so the agent
 * list can show placements as a real number.
 */
export type AgentResponse = {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  directorName: string | null;
  directorIdOnFile: boolean;
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
  employeeCount: number | null;
};

/** `dto/response/employee/EmployeeSummaryResponse` — what the by-* lists return. */
export type EmployeeSummaryResponse = {
  id: number;
  fullName: string;
  employeeNumber: string;
  branchName: string | null;
  position: string | null;
  employmentStatus: EmploymentStatus;
};

/**
 * `dto/response/employee/EmployeeDirectoryResponse` — one row of a branch's list on the dashboards.
 */
export type EmployeeDirectoryResponse = {
  id: number;
  employeeNumber: string;
  fullName: string;
  phone: string | null;
  departmentName: string | null;
  agentName: string | null;
  basicSalary: number | null;
  position: string | null;
  employmentStatus: EmploymentStatus;
};

/** `dto/response/employee/EmployeeResponse` — the full record. */
export type EmployeeResponse = {
  id: number;
  fullName: string;
  employeeNumber: string;
  passportPhotoUrl: string | null;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  kraPin: string | null;
  shifNumber: string | null;
  nssfNumber: string | null;
  nitaNumber: string | null;
  branchId: number;
  branchName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  agentId: number | null;
  agentName: string | null;
  position: string | null;
  employmentType: EmploymentType | null;
  basicSalary: number | null;
  dateHired: string | null;
  employmentStatus: EmploymentStatus;
  bankName: string | null;
  bankAccountNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};

/** `dto/response/employee/EmployeeDocumentResponse`. */
export type EmployeeDocumentResponse = {
  id: number;
  employeeId: number;
  documentType: string;
  fileUrl: string;
  fileName: string | null;
  uploadedAt: string | null;
};

/* ------------------------------------------------------------------ shift -- */

/** `dto/response/shift/ShiftResponse`. Times are `HH:mm:ss`, or null. */
export type ShiftResponse = {
  id: number;
  name: string;
  type: ShiftType;
  startTime: string | null;
  endTime: string | null;
};

/**
 * `dto/response/shift/ShiftAssignmentResponse`.
 *
 * A shift is assigned to exactly one of an employee, a department or a branch —
 * `employeeId`, `departmentId` and `branchId` are three nullable columns, and
 * only one is normally set. `shiftName` is the only joined field.
 */
export type ShiftAssignmentResponse = {
  id: number;
  shiftId: number;
  shiftName: string;
  employeeId: number | null;
  departmentId: number | null;
  branchId: number | null;
};

/* ------------------------------------------------------------------ leave -- */

/** `dto/response/leave/LeaveTypeResponse`. */
export type LeaveTypeResponse = {
  id: number;
  name: string;
  defaultEntitlementDays: number | null;
  paid: boolean;
};

/**
 * `dto/response/leave/LeaveRequestResponse`.
 *
 * `status` is a plain String in the backend and is typed as the `LeaveStatus`
 * union here. There is no `days` field — a screen wanting the duration has to
 * compute it from `startDate` and `endDate`.
 */
export type LeaveRequestResponse = {
  id: number;
  employeeId: number;
  employeeName: string | null;
  leaveTypeId: number;
  leaveTypeName: string | null;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  rejectionReason: string | null;
};

/** `dto/response/leave/LeaveBalanceResponse`. */
export type LeaveBalanceResponse = {
  leaveTypeId: number;
  leaveTypeName: string;
  entitledDays: number;
  usedDays: number;
  remainingDays: number;
};

/**
 * `dto/response/attendance/BiometricDeviceResponse`.
 *
 * Only reachable per branch (`GET /attendance/devices/by-branch/{id}`). For the
 * whole fleet use `AttendanceDeviceItem` from the dashboard controller, which
 * also carries the server-computed `online` flag.
 */
export type BiometricDeviceResponse = {
  id: number;
  branchId: number;
  branchName: string | null;
  deviceSerial: string;
  lastSyncAt: string | null;
  status: Status;
};

/**
 * `dto/response/auth/UserSummaryResponse` — `GET /users`.
 *
 * Deliberately thin, and the thinness matters: there is **no** last-login and
 * **no** MFA field, because `users` has no `last_login_at` and no `mfa` column.
 * A user directory that shows either would be inventing it.
 *
 * `branchId` rather than a branch name — the row carries the foreign key only,
 * so a table showing the branch must resolve it against `GET /branches`.
 *
 * The backend declares `role` as a plain `String` (the column is a single
 * VARCHAR), while the frontend narrows to the `Role` union. The union is the
 * tighter of the two and matches `Role.java`, so it is used here; an
 * unrecognised value would be a backend contract change, not a client case.
 */
export type UserSummaryResponse = {
  id: number;
  username: string;
  role: Role;
  displayName: string | null;
  branchId: number | null;
  active: boolean;
};
