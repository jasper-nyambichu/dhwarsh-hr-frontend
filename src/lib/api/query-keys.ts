/**
 * React Query cache keys, one namespace per backend module.
 *
 * Mirrors the `event/` package: when a domain event fires server-side, the
 * matching key below is what the client invalidates. Keeping them in one file
 * makes "what goes stale when payroll completes?" answerable by reading, not
 * grepping.
 */

export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },

  company: {
    all: ["company"] as const,
    detail: (id: number) => ["company", id] as const,
    settings: (id: number) => ["company", id, "settings"] as const,
  },

  branch: {
    all: ["branch"] as const,
    list: (filters?: unknown) => ["branch", "list", filters ?? {}] as const,
    detail: (id: number) => ["branch", id] as const,
  },

  department: {
    all: ["department"] as const,
    list: (filters?: unknown) => ["department", "list", filters ?? {}] as const,
    detail: (id: number) => ["department", id] as const,
  },

  employee: {
    all: ["employee"] as const,
    list: (filters?: unknown) => ["employee", "list", filters ?? {}] as const,
    detail: (id: number) => ["employee", id] as const,
    documents: (id: number) => ["employee", id, "documents"] as const,
  },

  attendance: {
    all: ["attendance"] as const,
    list: (filters?: unknown) => ["attendance", "list", filters ?? {}] as const,
    byEmployee: (employeeId: number, filters?: unknown) =>
      ["attendance", "employee", employeeId, filters ?? {}] as const,
  },

  biometric: {
    devices: ["biometric", "devices"] as const,
    templates: (employeeId: number) =>
      ["biometric", "templates", employeeId] as const,
  },

  shift: {
    all: ["shift"] as const,
    list: (filters?: unknown) => ["shift", "list", filters ?? {}] as const,
    assignments: (filters?: unknown) =>
      ["shift", "assignments", filters ?? {}] as const,
  },

  leave: {
    all: ["leave"] as const,
    types: ["leave", "types"] as const,
    list: (filters?: unknown) => ["leave", "list", filters ?? {}] as const,
    detail: (id: number) => ["leave", id] as const,
    pendingApprovals: ["leave", "pending-approvals"] as const,
  },

  loan: {
    all: ["loan"] as const,
    list: (filters?: unknown) => ["loan", "list", filters ?? {}] as const,
    detail: (id: number) => ["loan", id] as const,
    repayments: (loanId: number) => ["loan", loanId, "repayments"] as const,
  },

  agent: {
    all: ["agent"] as const,
    list: (filters?: unknown) => ["agent", "list", filters ?? {}] as const,
    detail: (id: number) => ["agent", id] as const,
    staff: (id: number) => ["agent", id, "staff"] as const,
  },

  agentAdvance: {
    all: ["agent-advance"] as const,
    list: (filters?: unknown) =>
      ["agent-advance", "list", filters ?? {}] as const,
    detail: (id: number) => ["agent-advance", id] as const,
  },

  payroll: {
    all: ["payroll"] as const,
    runs: (filters?: unknown) => ["payroll", "runs", filters ?? {}] as const,
    run: (id: number) => ["payroll", "run", id] as const,
    /** Polled while a run is PROCESSING. */
    runStatus: (id: number) => ["payroll", "run", id, "status"] as const,
    payslips: (runId: number) => ["payroll", "run", runId, "payslips"] as const,
    payslip: (id: number) => ["payroll", "payslip", id] as const,
    agentSummaries: (runId: number) =>
      ["payroll", "run", runId, "agent-summaries"] as const,
  },

  notification: {
    all: ["notification"] as const,
    unreadCount: ["notification", "unread-count"] as const,
  },

  audit: {
    all: ["audit"] as const,
    list: (filters?: unknown) => ["audit", "list", filters ?? {}] as const,
  },

  report: {
    all: ["report"] as const,
    dashboard: (role: string) => ["report", "dashboard", role] as const,
  },
} as const;

/**
 * Cache tags for `revalidateTag` in Server Actions. Kept parallel to the keys
 * above so a mutation can bust both layers consistently.
 */
export const cacheTags = {
  employees: "employees",
  branches: "branches",
  departments: "departments",
  agents: "agents",
  agentAdvances: "agent-advances",
  attendance: "attendance",
  shifts: "shifts",
  leave: "leave",
  loans: "loans",
  payrollRuns: "payroll-runs",
  payslips: "payslips",
  notifications: "notifications",
  auditLogs: "audit-logs",
} as const;
