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
export const employeeLoginSchema = z.object({
  employeeNumber: z
    .string()
    .min(1, { message: "Employee number is required." })
    .max(30, { message: "Employee number is too long." })
    .trim(),
  pin: z
    .string()
    .length(4, { message: "Enter all 4 digits." })
    .regex(/^\d{4}$/, { message: "PIN must be 4 digits." }),
});

export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>;

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

export const employeeSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name is required." })
    .max(150, { message: "Full name is too long." })
    .trim(),
  employeeNumber: z
    .string()
    .min(1, { message: "Employee number is required." })
    .max(30)
    .trim(),
  nationalId: z.string().max(30).trim().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
  phone: optionalString,
  email: z
    .string()
    .email({ message: "Enter a valid email address." })
    .optional()
    .or(z.literal("")),
  address: optionalString,
  kraPin: z.string().max(20).trim().optional(),
  shifNumber: z.string().max(20).trim().optional(),
  nssfNumber: z.string().max(20).trim().optional(),
  nitaNumber: z.string().max(20).trim().optional(),
  branchId: z.coerce.number().int().positive({ message: "Select a branch." }),
  departmentId: z.coerce.number().int().positive().optional(),
  agentId: z.coerce.number().int().positive().optional(),
  position: optionalString,
  employmentType: z.enum([
    "PERMANENT",
    "CONTRACT",
    "CASUAL",
    "INTERN",
    "OUTSOURCED",
  ]),
  basicSalary: z.coerce
    .number()
    .nonnegative({ message: "Salary cannot be negative." }),
  dateHired: z.string().optional(),
  employmentStatus: z.enum([
    "ACTIVE",
    "PROBATION",
    "ON_LEAVE",
    "SUSPENDED",
    "TERMINATED",
  ]),
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
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
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
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const departmentSchema = z.object({
  name: z.string().min(2, { message: "Department name is required." }).max(100).trim(),
  branchId: z.coerce.number().int().positive({ message: "Select a branch." }),
  headOfDepartmentId: z.coerce.number().int().positive().optional(),
});

/* ----------------------------------------------------------------- shift -- */

export const shiftSchema = z.object({
  name: z.string().min(2, { message: "Shift name is required." }).max(100).trim(),
  type: z.enum(["DAY", "NIGHT", "SPLIT", "FLEXIBLE"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
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
    "HR_MANAGER",
    "PAYROLL_OFFICER",
    "BRANCH_MANAGER",
    "AGENT",
    "EMPLOYEE",
    "FINANCE_OFFICER",
    "AUDITOR",
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
  employmentStatus: z
    .enum(["ACTIVE", "PROBATION", "ON_LEAVE", "SUSPENDED", "TERMINATED"])
    .optional(),
});
