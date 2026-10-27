/**
 * Role definitions — the single source of truth for the frontend.
 *
 * Mirrors `entity/auth/Role.java` exactly. The `users.role` column is a single
 * VARCHAR(30), so a user holds exactly one role.
 *
 * The business runs on SIX dashboards:
 *   Admin · Branch Manager · Agent · Back Office · Payroll · Accounts Office
 * Admin also holds everything Super Admin could do (the backend grants that through a role
 * hierarchy), and the Finance Officer role is presented as "Accounts Office". HR Manager,
 * Auditor and Employee remain valid roles so existing accounts keep working, but they are no
 * longer part of the way the business is organised and are not offered when creating users.
 *
 * Related: security/AccessGuard, security/CustomUserDetailsService, security/RoleHierarchyConfig
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
  "BACK_OFFICE",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** The roles the business actually uses — what a user can be created as. */
export const ACTIVE_ROLES = [
  "ADMIN",
  "BRANCH_MANAGER",
  "AGENT",
  "BACK_OFFICE",
  "PAYROLL_OFFICER",
  "FINANCE_OFFICER",
] as const satisfies readonly Role[];

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
  BACK_OFFICE: "STAFF",
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
  BACK_OFFICE: "/backoffice",
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
  BACK_OFFICE: "/backoffice/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Administrator",
  ADMIN: "Administrator",
  HR_MANAGER: "HR Manager",
  PAYROLL_OFFICER: "Payroll Officer",
  BRANCH_MANAGER: "Branch Manager",
  AGENT: "Agent",
  EMPLOYEE: "Employee",
  FINANCE_OFFICER: "Accounts Office",
  AUDITOR: "Auditor",
  BACK_OFFICE: "Back Office",
};

/**
 * Permissions named `<module>:<action>`, mirroring the backend module layout.
 * Suffixes narrow the data scope:
 *   :self    only the caller's own rows
 *   :branch  rows within users.branch_id
 *   :team    rows the caller manages
 *
 * This drives menu visibility and optimistic UI only. The Spring AccessGuard
 * stays authoritative on every request.
 */
export const PERMISSIONS = [
  "company:read", "company:write", "company:settings",
  "branch:read", "branch:read:own", "branch:write",
  "department:read", "department:write",
  "employee:read", "employee:read:branch", "employee:read:self", "employee:write",
  "employee:request",
  "employee:document:read", "employee:document:write",
  "attendance:read", "attendance:read:branch", "attendance:read:self", "attendance:write",
  "biometric:read", "biometric:enroll", "biometric:device:manage",
  "dayswork:read", "dayswork:lock",
  "damage:read", "damage:record",
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
  /**
   * Admin — the top role. Everything Super Admin could do (company, settings, users, history
   * log, branches, departments, devices) plus day-to-day running: adding employees directly,
   * approving requests from Branch Managers and Agents, approving loans and advances.
   */
  ADMIN: [
    "company:read", "company:write", "company:settings",
    "branch:read", "branch:write",
    "department:read", "department:write",
    "employee:read", "employee:write", "employee:document:read", "employee:document:write",
    "attendance:read", "attendance:write",
    "biometric:read", "biometric:enroll", "biometric:device:manage",
    "dayswork:read", "damage:read",
    "shift:read", "shift:write", "shift:assign",
    "leave:read", "leave:approve:hr", "leave:type:manage",
    "loan:read", "loan:approve", "loan:repayment:read",
    "agent:read", "agent:write",
    "agentadvance:read", "agentadvance:approve",
    "payroll:read", "payroll:approve", "payslip:read", "agentsummary:read", "invoice:read",
    "report:read", "audit:read", "user:manage", "settings:manage",
    "notification:read:self",
  ],
  /** Legacy platform-owner role — identical to Admin; kept so existing accounts keep working. */
  SUPER_ADMIN: [
    "company:read", "company:write", "company:settings",
    "branch:read", "branch:write",
    "department:read", "department:write",
    "employee:read", "employee:write", "employee:document:read", "employee:document:write",
    "attendance:read", "attendance:write",
    "biometric:read", "biometric:enroll", "biometric:device:manage",
    "dayswork:read", "damage:read",
    "shift:read", "shift:write", "shift:assign",
    "leave:read", "leave:approve:hr", "leave:type:manage",
    "loan:read", "loan:approve", "loan:repayment:read",
    "agent:read", "agent:write",
    "agentadvance:read", "agentadvance:approve",
    "payroll:read", "payroll:approve", "payslip:read", "agentsummary:read", "invoice:read",
    "report:read", "audit:read", "user:manage", "settings:manage",
    "notification:read:self",
  ],
  /** Legacy people-operations role; its duties now sit with Admin and Branch Manager. */
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
  /** Runs payroll; applies loan and damage deductions; approves loans and agent advances. */
  PAYROLL_OFFICER: [
    "branch:read", "department:read",
    "employee:read", "attendance:read", "dayswork:read", "damage:read",
    "loan:read", "loan:approve", "loan:repayment:read",
    "agent:read", "agentadvance:read", "agentadvance:approve",
    "payroll:read", "payroll:run",
    "payslip:read", "agentsummary:read", "invoice:read",
    "report:read",
    "notification:read:self",
  ],
  /** Scoped to users.branch_id — manages that branch's employees and submits new ones. */
  BRANCH_MANAGER: [
    "branch:read:own", "department:read",
    "employee:read:branch", "employee:request",
    "attendance:read:branch", "attendance:write",
    "shift:read:branch", "shift:assign",
    "leave:read:branch", "leave:approve:manager",
    "report:read:branch",
    "notification:read:self",
  ],
  /** Supplies and pays outsourced staff (employees.agent_id). */
  AGENT: [
    "agent:read:self",
    "employee:request",
    "loan:request",
    "agentadvance:read:self", "agentadvance:request",
    "agentsummary:read:self", "invoice:read:self",
    "report:read:self",
    "notification:read:self",
  ],
  /** Legacy self-service role — employees no longer sign in; kept so existing accounts keep working. */
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
  /** Accounts Office: money out — disbursement, statutory remittance, agent invoices. */
  FINANCE_OFFICER: [
    "branch:read", "company:read",
    "payroll:read", "payslip:read",
    "agentsummary:read", "invoice:read",
    "loan:read", "loan:repayment:read",
    "agentadvance:read", "damage:read",
    "report:read", "audit:read",
    "notification:read:self",
  ],
  /** Legacy read-only role — its history-log duty now sits with Admin and the Accounts Office. */
  AUDITOR: [
    "company:read", "branch:read", "department:read",
    "employee:read", "attendance:read", "shift:read",
    "leave:read", "loan:read", "loan:repayment:read",
    "agent:read", "agentadvance:read",
    "payroll:read", "payslip:read", "agentsummary:read", "invoice:read",
    "report:read", "audit:read",
    "notification:read:self",
  ],
  /**
   * Back Office: runs the clock-in/out desktop application and the biometric devices, records
   * how many days each employee reports to work (payroll's input), and records damages.
   * All of that happens in the desktop application, not on the web.
   */
  BACK_OFFICE: [
    "branch:read",
    "employee:read",
    "attendance:read", "attendance:write",
    "biometric:read", "biometric:enroll", "biometric:device:manage",
    "dayswork:read", "dayswork:lock",
    "damage:read", "damage:record",
    "report:read",
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