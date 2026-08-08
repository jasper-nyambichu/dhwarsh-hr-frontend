/**
 * Role definitions — the single source of truth for the frontend.
 *
 * Mirrors `entity/auth/Role.java` exactly. The `users.role` column is a single
 * VARCHAR(30), so a user holds exactly one role.
 *
 * Related: security/AccessGuard, security/CustomUserDetailsService
 */

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "HR_MANAGER",
  "PAYROLL_OFFICER",
  "BRANCH_MANAGER",
  "AGENT",
  "EMPLOYEE",
  "FINANCE_OFFICER",
  "AUDITOR",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Which login surface a principal authenticates through.
 *
 * Four surfaces, because the credential differs per population:
 *   STAFF    /login          username + password  (users.username)
 *   EMPLOYEE /employee-login employee no. + PIN   (employees.employee_number)
 *   AGENT    /agent-login    agent code + password
 *   DEVICE   /kiosk          device token         (biometric_devices)
 */
export const PRINCIPAL_TYPES = ["STAFF", "EMPLOYEE", "AGENT", "DEVICE"] as const;
export type PrincipalType = (typeof PRINCIPAL_TYPES)[number];

export const ROLE_PRINCIPAL: Record<Role, PrincipalType> = {
  SUPER_ADMIN: "STAFF",
  ADMIN: "STAFF",
  HR_MANAGER: "STAFF",
  PAYROLL_OFFICER: "STAFF",
  BRANCH_MANAGER: "STAFF",
  AGENT: "AGENT",
  EMPLOYEE: "EMPLOYEE",
  FINANCE_OFFICER: "STAFF",
  AUDITOR: "STAFF",
};

/** Where to send an unauthenticated principal of each type. */
export const PRINCIPAL_LOGIN_ROUTE: Record<PrincipalType, string> = {
  STAFF: "/login",
  EMPLOYEE: "/employee-login",
  AGENT: "/agent-login",
  DEVICE: "/kiosk/clock",
};

/** Login route matching a known role — used when re-authenticating. */
export function loginRouteFor(role: Role): string {
  return PRINCIPAL_LOGIN_ROUTE[ROLE_PRINCIPAL[role]];
}

/**
 * URL namespace owned by each role. Every authenticated route sits under
 * exactly one prefix, so two roles can never collide on a path.
 */
export const ROLE_NAMESPACE: Record<Role, string> = {
  SUPER_ADMIN: "/admin",
  ADMIN: "/admin",
  HR_MANAGER: "/hr",
  PAYROLL_OFFICER: "/payroll",
  BRANCH_MANAGER: "/branch",
  AGENT: "/agent",
  EMPLOYEE: "/me",
  FINANCE_OFFICER: "/finance",
  AUDITOR: "/audit",
};

/** Landing route after a successful login. */
export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  HR_MANAGER: "/hr/dashboard",
  PAYROLL_OFFICER: "/payroll/dashboard",
  BRANCH_MANAGER: "/branch/dashboard",
  AGENT: "/agent/dashboard",
  EMPLOYEE: "/me/dashboard",
  FINANCE_OFFICER: "/finance/dashboard",
  AUDITOR: "/audit/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  HR_MANAGER: "HR Manager",
  PAYROLL_OFFICER: "Payroll Officer",
  BRANCH_MANAGER: "Branch Manager",
  AGENT: "Agent",
  EMPLOYEE: "Employee",
  FINANCE_OFFICER: "Finance Officer",
  AUDITOR: "Auditor",
};

/**
 * Permissions named `<module>:<action>`, mirroring the backend module layout.
 * Suffixes narrow the data scope:
 *   :self   — only the caller's own rows
 *   :branch — rows within users.branch_id
 *   :team   — rows the caller manages
 *
 * This drives menu visibility and optimistic UI only. The Spring AccessGuard
 * stays authoritative on every request.
 */
export const PERMISSIONS = [
  "company:read", "company:write", "company:settings",
  "branch:read", "branch:read:own", "branch:write",
  "department:read", "department:write",
  "employee:read", "employee:read:branch", "employee:read:self", "employee:write",
  "employee:document:read", "employee:document:write",
  "attendance:read", "attendance:read:branch", "attendance:read:self", "attendance:write",
  "biometric:read", "biometric:enroll", "biometric:device:manage",
  "shift:read", "shift:read:branch", "shift:read:self", "shift:write", "shift:assign",
  "leave:read", "leave:read:branch", "leave:read:self",
  "leave:request", "leave:approve:manager", "leave:approve:hr", "leave:type:manage",
  "loan:read", "loan:read:self", "loan:request", "loan:approve", "loan:repayment:read",
  "agent:read", "agent:read:self", "agent:write",
  "agentadvance:read", "agentadvance:read:self", "agentadvance:request", "agentadvance:approve",
  "payroll:read", "payroll:run", "payroll:approve",
  "payslip:read", "payslip:read:self",
  "agentsummary:read", "agentsummary:read:self",
  "invoice:read", "invoice:read:self",
  "report:read", "report:read:branch", "report:read:self",
  "audit:read",
  "notification:read:self",
  "user:manage",
  "settings:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  /** Platform owner: multi-company, system config, no day-to-day HR. */
  SUPER_ADMIN: [
    "company:read", "company:write", "company:settings",
    "branch:read", "branch:write",
    "department:read", "department:write",
    "biometric:device:manage",
    "report:read", "audit:read", "user:manage", "settings:manage",
    "notification:read:self",
  ],

  /** Company-wide administrator. */
  ADMIN: [
    "company:read", "company:settings",
    "branch:read", "branch:write",
    "department:read", "department:write",
    "employee:read", "employee:write", "employee:document:read",
    "attendance:read", "biometric:read", "biometric:device:manage",
    "shift:read", "leave:read", "loan:read",
    "agent:read", "agent:write", "agentadvance:read",
    "payroll:read", "payroll:approve", "payslip:read", "agentsummary:read", "invoice:read",
    "report:read", "audit:read", "user:manage", "settings:manage",
    "notification:read:self",
  ],

  /** People operations: staff records, time, leave. */
  HR_MANAGER: [
    "branch:read", "department:read", "department:write",
    "employee:read", "employee:write",
    "employee:document:read", "employee:document:write",
    "attendance:read", "attendance:write",
    "biometric:read", "biometric:enroll",
    "shift:read", "shift:write", "shift:assign",
    "leave:read", "leave:approve:hr", "leave:type:manage",
    "loan:read",
    "agent:read", "agent:write",
    "payroll:read", "payslip:read",
    "report:read",
    "notification:read:self",
  ],

  /** Runs payroll batches; approves loans and agent advances. */
  PAYROLL_OFFICER: [
    "branch:read", "department:read",
    "employee:read", "attendance:read",
    "loan:read", "loan:approve", "loan:repayment:read",
    "agent:read", "agentadvance:read", "agentadvance:approve",
    "payroll:read", "payroll:run",
    "payslip:read", "agentsummary:read", "invoice:read",
    "report:read",
    "notification:read:self",
  ],

  /** Scoped to users.branch_id — first-stage leave approver. */
  BRANCH_MANAGER: [
    "branch:read:own", "department:read",
    "employee:read:branch",
    "attendance:read:branch", "attendance:write",
    "shift:read:branch", "shift:assign",
    "leave:read:branch", "leave:approve:manager",
    "report:read:branch",
    "notification:read:self",
  ],

  /** External supplier of outsourced staff (employees.agent_id). */
  AGENT: [
    "agent:read:self",
    "agentadvance:read:self", "agentadvance:request",
    "agentsummary:read:self", "invoice:read:self",
    "report:read:self",
    "notification:read:self",
  ],

  /** Self-service only. */
  EMPLOYEE: [
    "employee:read:self",
    "attendance:read:self",
    "shift:read:self",
    "leave:read:self", "leave:request",
    "loan:read:self", "loan:request",
    "payslip:read:self",
    "report:read:self",
    "notification:read:self",
  ],

  /** Money out: disbursement, statutory remittance, agent invoices. */
  FINANCE_OFFICER: [
    "branch:read", "company:read",
    "payroll:read", "payslip:read",
    "agentsummary:read", "invoice:read",
    "loan:read", "loan:repayment:read",
    "agentadvance:read",
    "report:read",
    "notification:read:self",
  ],

  /** Read-only across the board. Never mutates. */
  AUDITOR: [
    "company:read", "branch:read", "department:read",
    "employee:read", "attendance:read", "shift:read",
    "leave:read", "loan:read", "loan:repayment:read",
    "agent:read", "agentadvance:read",
    "payroll:read", "payslip:read", "agentsummary:read", "invoice:read",
    "report:read", "audit:read",
    "notification:read:self",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: Role,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** True when `pathname` falls inside the namespace this role owns. */
export function canAccessPath(role: Role, pathname: string): boolean {
  const namespace = ROLE_NAMESPACE[role];
  return pathname === namespace || pathname.startsWith(`${namespace}/`);
}
