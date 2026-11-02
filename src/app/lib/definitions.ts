import { z } from "zod";

/**
 * Validation schemas mirroring the backend `dto/request` records.
 *
 * NOTE: this project has zod 3.25.x. Use `z.string().email({ message })`,
 * not the zod 4 `z.email({ error })` form — the latter is undefined here.
 *
 * These run client-side for fast feedback AND inside Server Actions before
 * hitting the API. Bean Validation on the Spring side stays authoritative.
 */

/* ------------------------------------------------------------------ auth -- */

export const loginSchema = z.object({
  // `users.username` is the credential, not email.
  username: z
    .string()
    .min(1, { message: "Username is required." })
    .max(100, { message: "Username is too long." })
    .trim(),
  password: z.string().min(1, { message: "Password is required." }),
  next: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Employee self-service credential: `employees.employee_number` + 4-digit PIN.
 *
 * A 4-digit PIN is only 10,000 combinations. Attempt throttling and lockout
 * must be enforced server-side — nothing here can rate-limit an attacker.
 */


/**
 * Agent portal credential.
 *
 * NOTE: `agents` has no code column in V1 — only id, name and kra_pin. The
 * backend needs a unique agent code before this can authenticate.
 */
export const agentLoginSchema = z.object({
  agentCode: z
    .string()
    .min(1, { message: "Agent code is required." })
    .max(50, { message: "Agent code is too long." })
    .trim(),
  password: z.string().min(1, { message: "Password is required." }),
});

export type AgentLoginInput = z.infer<typeof agentLoginSchema>;

const passwordRules = z
  .string()
  .min(8, { message: "Use at least 8 characters." })
  .max(72, { message: "Use at most 72 characters." })
  .regex(/[A-Z]/, { message: "Include an uppercase letter." })
  .regex(/[a-z]/, { message: "Include a lowercase letter." })
  .regex(/[0-9]/, { message: "Include a number." });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, { message: "Confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must differ from the current one.",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }).trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, { message: "Confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/* -------------------------------------------------------------- employee -- */

const optionalString = z
  .string()
  .trim()
  .max(255)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

// An HTML <select> submits "" when nothing is chosen, and an optional numeric
// id must arrive as absent rather than as 0 — `z.coerce.number()` turns "" into
// 0, which then trips `.positive()` and reports a validation error for a field
// the user deliberately left blank.
const optionalId = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().positive().optional()
);

// Same reasoning for optional enum selects, and for optional dates: the
// backend binds these to Java enums and LocalDate, so an empty string is a 400
// rather than a blank field.
const optionalEnum = (values: [string, ...string[]]) =>
  z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.enum(values).optional()
  );

const optionalDate = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

/* -------------------------------------------------------------- employee -- */

// Field-for-field against EmployeeRequest in the backend
// (dto/request/employee/EmployeeRequest.java). Only four fields are @NotNull
// there — fullName, branchId, employmentType, basicSalary — so everything else
// is genuinely optional.
//
// Two fields the backend owns and this schema must NOT contain:
//   employeeNumber  generated server-side as EMP-<branchCode>-<seq>, with a
//                   collision retry. Sending one is at best ignored.
//   employmentStatus not in the request DTO at all; the service defaults it.
export const employeeSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name is required." })
    .max(150, { message: "Full name is too long." })
    .trim(),
  nationalId: z.string().max(30).trim().optional(),
  dateOfBirth: optionalDate,
  gender: optionalEnum(["MALE", "FEMALE", "OTHER"]),
  maritalStatus: optionalEnum([
    "SINGLE",
    "MARRIED",
    "DIVORCED",
    "WIDOWED",
  ]),
  phone: optionalString,
  email: z
    .string()
    .email({ message: "Enter a valid email address." })
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  address: optionalString,
  kraPin: z.string().max(20).trim().optional(),
  shifNumber: z.string().max(20).trim().optional(),
  nssfNumber: z.string().max(20).trim().optional(),
  nitaNumber: z.string().max(20).trim().optional(),
  branchId: z.coerce.number().int().positive({ message: "Select a branch." }),
  departmentId: optionalId,
  agentId: optionalId,
  position: optionalString,
  // EmploymentType enum: PERMANENT, CONTRACT, CASUAL, OUTSOURCED.
  // There is no INTERN — offering it was a guaranteed 400.
  employmentType: z.enum(
    ["PERMANENT", "CONTRACT", "CASUAL", "OUTSOURCED"],
    { message: "Select an employment type." }
  ),
  basicSalary: z.coerce
    .number()
    .nonnegative({ message: "Salary cannot be negative." }),
  dateHired: optionalDate,
  bankName: optionalString,
  bankAccountNumber: optionalString,
  emergencyContactName: optionalString,
  emergencyContactPhone: optionalString,
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

/* ----------------------------------------------------------------- leave -- */

export const leaveRequestSchema = z
  .object({
    employeeId: z.coerce.number().int().positive().optional(),
    leaveTypeId: z.coerce
      .number()
      .int()
      .positive({ message: "Select a leave type." }),
    startDate: z.string().min(1, { message: "Start date is required." }),
    endDate: z.string().min(1, { message: "End date is required." }),
    reason: z.string().max(255).trim().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date cannot be before the start date.",
    path: ["endDate"],
  });

export const leaveDecisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z.string().max(255).trim().optional(),
  })
  .refine(
    (data) => data.decision !== "REJECT" || !!data.rejectionReason?.length,
    { message: "Give a reason for rejection.", path: ["rejectionReason"] },
  );

/* ------------------------------------------------------------------ loan -- */

export const loanRequestSchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  principalAmount: z.coerce
    .number()
    .positive({ message: "Enter an amount greater than zero." }),
  interestRate: z.coerce.number().min(0).max(100).optional(),
  installmentAmount: z.coerce
    .number()
    .positive({ message: "Enter an installment amount." }),
  requestDate: z.string().optional(),
});

/* ----------------------------------------------------- agent / advances -- */

export const agentSchema = z.object({
  name: z.string().min(2, { message: "Agent name is required." }).max(150).trim(),
  contactPerson: optionalString,
  phone: optionalString,
  email: z
    .string()
    .email({ message: "Enter a valid email address." })
    .optional()
    .or(z.literal("")),
  address: optionalString,
  bankName: optionalString,
  bankAccountNumber: optionalString,
  kraPin: z.string().max(20).trim().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  chargeType: z.enum(["FIXED", "PERCENTAGE", "PER_EMPLOYEE"]),
  chargeAmount: z.coerce.number().nonnegative().optional(),
  chargePercentage: z.coerce.number().min(0).max(100).optional(),
  vatRegistered: z.coerce.boolean(),
  // The column is a free String on the entity, but nothing ever writes a third
  // value — deactivateAgent sets "INACTIVE". Offering SUSPENDED here would let
  // a form store a state no other screen knows how to read.
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const agentAdvanceSchema = z.object({
  agentId: z.coerce.number().int().positive({ message: "Select an agent." }),
  amount: z.coerce.number().positive({ message: "Enter an amount." }),
  advanceDate: z.string().min(1, { message: "Advance date is required." }),
  purpose: z.string().max(255).trim().optional(),
});

/* --------------------------------------------------------------- payroll -- */

export const payrollRunSchema = z
  .object({
    periodStart: z.string().min(1, { message: "Period start is required." }),
    periodEnd: z.string().min(1, { message: "Period end is required." }),
    scopeBranchIds: z.array(z.coerce.number().int().positive()).optional(),
    scopeDepartmentIds: z.array(z.coerce.number().int().positive()).optional(),
    scopeAgentIds: z.array(z.coerce.number().int().positive()).optional(),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: "Period end cannot be before period start.",
    path: ["periodEnd"],
  });

/* -------------------------------------------------- branch / department -- */

export const branchSchema = z.object({
  name: z.string().min(2, { message: "Branch name is required." }).max(100).trim(),
  code: z.string().min(1, { message: "Branch code is required." }).max(20).trim(),
  address: optionalString,
  phone: optionalString,
  email: z
    .string()
    .email({ message: "Enter a valid email address." })
    .optional()
    .or(z.literal("")),
  managerId: z.coerce.number().int().positive().optional(),
  // Same as the agent schema above: deactivateBranch writes "INACTIVE" and
  // there is no third state to offer.
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const departmentSchema = z.object({
  name: z.string().min(2, { message: "Department name is required." }).max(100).trim(),
  branchId: z.coerce.number().int().positive({ message: "Select a branch." }),
  headOfDepartmentId: z.coerce.number().int().positive().optional(),
});

/* ----------------------------------------------------------------- shift -- */

// Mirrors ShiftRequest + entity/shift/ShiftType. The four values below are the
// Java enum exactly; "DAY" and "SPLIT" are shift *names* in the demo seed, not
// types, and would have been rejected on submit.
export const shiftSchema = z.object({
  name: z.string().min(2, { message: "Shift name is required." }).max(100).trim(),
  type: z.enum(["MORNING", "EVENING", "NIGHT", "ROTATING", "FLEXIBLE"], {
    message: "Select a shift type.",
  }),
  // LocalTime — "HH:mm" from <input type="time">, or absent.
  startTime: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  endTime: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

/** A shift assignment targets exactly one of employee, department or branch. */
export const shiftAssignmentSchema = z.object({
  shiftId: z.coerce.number().int().positive({ message: "Select a shift." }),
  employeeId: optionalId,
  departmentId: optionalId,
  branchId: optionalId,
});

/* ------------------------------------------------------------ attendance -- */

export const manualAttendanceSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  attendanceDate: z.string().min(1, { message: "Date is required." }),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  status: z.enum([
    "PRESENT",
    "ABSENT",
    "LATE",
    "HALF_DAY",
    "ON_LEAVE",
    "HOLIDAY",
  ]),
});

/* ------------------------------------------------------------------ user -- */

export const userAccountSchema = z.object({
  username: z.string().min(3, { message: "Username is required." }).max(100).trim(),
  displayName: z.string().max(150).trim().optional(),
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "BRANCH_MANAGER",
    "AGENT",
    "BACK_OFFICE",
  ]),
  employeeId: z.coerce.number().int().positive().optional(),
  agentId: z.coerce.number().int().positive().optional(),
  branchId: z.coerce.number().int().positive().optional(),
  active: z.coerce.boolean(),
});

/* --------------------------------------------------------------- filters -- */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
});

export const employeeFilterSchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  branchId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  agentId: z.coerce.number().int().positive().optional(),
  employmentStatus: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
});
