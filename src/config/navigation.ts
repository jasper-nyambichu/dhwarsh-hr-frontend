import type { Role } from "@/config/roles";

/**
 * Rail navigation per role.
 *
 * The business runs on six dashboards — Admin, Branch Manager, Agent, Back Office, Payroll and
 * the Accounts Office (the Finance Officer role). HR Manager, Auditor and Employee keep working
 * menus below so accounts created before this change still function, but nothing links to them.
 *
 * The Back Office does its work in the desktop clock-in application, so its web menu stays minimal.
 *
 * The Stitch shell is a 96px icon rail, not a 256px sidebar, so there is no
 * room for section headings — the tree is flat and the rail scrolls when a
 * role owns more routes than fit. Icons are Material Symbols ligatures
 * (rendered by <Icon />), not Lucide components, because the rail, the topbar
 * and every Stitch screen use the icon font.
 *
 * Every href sits inside the namespace that role owns (ROLE_NAMESPACE), so two
 * roles can never link to the same path.
 *
 * Menu visibility only — not an authorization boundary. The DAL re-checks on
 * every page and the Spring AccessGuard is authoritative.
 */

export type NavItem = {
  /** Rail label. Wraps to two lines at 96px, so keep it to two words. */
  title: string;
  href: string;
  /** Material Symbols Outlined ligature, e.g. "dashboard". */
  icon: string;
};

// Admin holds every Super Admin power, so both roles share one menu.
const ADMIN_NAV: readonly NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { title: "Employees", href: "/admin/employees", icon: "group" },
  { title: "Approvals", href: "/admin/employee-requests", icon: "fact_check" },
  { title: "Money Requests", href: "/admin/money-requests", icon: "price_check" },
  { title: "Leave", href: "/admin/leave", icon: "event_available" },
  { title: "Attendance", href: "/admin/attendance", icon: "schedule" },
  { title: "Days Worked", href: "/admin/days-worked", icon: "date_range" },
  { title: "Branches", href: "/admin/branches", icon: "account_balance" },
  { title: "Departments", href: "/admin/departments", icon: "workspaces" },
  { title: "Agents", href: "/admin/agents", icon: "handshake" },
  { title: "Companies", href: "/admin/companies", icon: "corporate_fare" },
  { title: "Users", href: "/admin/users", icon: "manage_accounts" },
  { title: "Devices", href: "/admin/devices", icon: "fingerprint" },
  { title: "Audit", href: "/admin/audit", icon: "policy" },
  { title: "Pay Rates", href: "/admin/pay-settings", icon: "request_quote" },
  { title: "Settings", href: "/admin/settings", icon: "settings" },
    { title: "Payslips", href: "/admin/payslips", icon: "receipt_long" },
];

export const ROLE_NAVIGATION: Record<Role, readonly NavItem[]> = {
  SUPER_ADMIN: ADMIN_NAV,
  ADMIN: ADMIN_NAV,

  BRANCH_MANAGER: [
    { title: "Dashboard", href: "/branch/dashboard", icon: "dashboard" },
    { title: "Team", href: "/branch/team", icon: "group" },
    { title: "Requests", href: "/branch/requests", icon: "pending_actions" },
    { title: "Attendance", href: "/branch/attendance", icon: "schedule" },
    { title: "Roster", href: "/branch/roster", icon: "calendar_month" },
    { title: "Approvals", href: "/branch/approvals", icon: "checklist" },
  ],

  AGENT: [
    { title: "Dashboard", href: "/agent/dashboard", icon: "dashboard" },
    { title: "Staff", href: "/agent/staff", icon: "group" },
    { title: "Requests", href: "/agent/requests", icon: "pending_actions" },
    { title: "Summaries", href: "/agent/summaries", icon: "summarize" },
    { title: "Invoices", href: "/agent/invoices", icon: "receipt_long" },
    { title: "Loans", href: "/agent/loans", icon: "savings" },
    { title: "Advances", href: "/agent/advances", icon: "account_balance_wallet" },
    { title: "Payments", href: "/agent/payments", icon: "payments" },
    { title: "Profile", href: "/agent/profile", icon: "account_circle" },
  ],

  // Runs the clock-in/out application and biometric devices; records attendance for payroll.
  BACK_OFFICE: [
    { title: "Dashboard", href: "/backoffice/dashboard", icon: "dashboard" },
    { title: "Attendance", href: "/backoffice/attendance", icon: "schedule" },
    { title: "Devices", href: "/backoffice/devices", icon: "fingerprint" },
  ],

  PAYROLL_OFFICER: [
    { title: "Dashboard", href: "/payroll/dashboard", icon: "dashboard" },
    { title: "Readiness", href: "/payroll/readiness", icon: "task_alt" },
    { title: "Runs", href: "/payroll/runs", icon: "payments" },
    { title: "Payslips", href: "/payroll/payslips", icon: "receipt_long" },
    { title: "Loans", href: "/payroll/loans", icon: "savings" },
    { title: "Advances", href: "/payroll/advances", icon: "account_balance_wallet" },
    { title: "Documents", href: "/payroll/documents", icon: "description" },
    { title: "Reports", href: "/payroll/reports", icon: "analytics" },
  ],

  // The Accounts Office: payments out, statutory remittance, agent invoices, the history log.
  FINANCE_OFFICER: [
    { title: "Dashboard", href: "/finance/dashboard", icon: "dashboard" },
    { title: "Releases", href: "/finance/releases", icon: "outbox" },
    { title: "Disbursements", href: "/finance/disbursements", icon: "payments" },
    { title: "Invoices", href: "/finance/invoices", icon: "receipt_long" },
    { title: "Statutory", href: "/finance/statutory", icon: "account_balance" },
    { title: "Loans", href: "/finance/loans", icon: "savings" },
    { title: "Advances", href: "/finance/advances", icon: "account_balance_wallet" },
    { title: "Reports", href: "/finance/reports", icon: "analytics" },
    { title: "Audit", href: "/finance/audit", icon: "policy" },
  ],

  // ---- Legacy roles: kept working for existing accounts, not part of the six dashboards ----

  HR_MANAGER: [
    { title: "Dashboard", href: "/hr/dashboard", icon: "dashboard" },
    { title: "Employees", href: "/hr/employees", icon: "group" },
    { title: "Requests", href: "/hr/employees/requests", icon: "pending_actions" },
    { title: "Attendance", href: "/hr/attendance", icon: "schedule" },
    { title: "Biometric", href: "/hr/biometric", icon: "fingerprint" },
    { title: "Shifts", href: "/hr/shifts", icon: "calendar_month" },
    { title: "Leave", href: "/hr/leave", icon: "event_available" },
    { title: "Leave Types", href: "/hr/leave-types", icon: "rule" },
    { title: "Agents", href: "/hr/agents", icon: "handshake" },
    { title: "Reports", href: "/hr/reports", icon: "analytics" },
  ],

  EMPLOYEE: [
    { title: "Dashboard", href: "/me/dashboard", icon: "dashboard" },
    { title: "Attendance", href: "/me/attendance", icon: "schedule" },
    { title: "Leave", href: "/me/leave", icon: "event_available" },
    { title: "Loans", href: "/me/loans", icon: "savings" },
    { title: "Payslips", href: "/me/payslips", icon: "receipt_long" },
    { title: "Documents", href: "/me/documents", icon: "folder" },
    { title: "Profile", href: "/me/profile", icon: "account_circle" },
  ],

  AUDITOR: [
    { title: "Dashboard", href: "/audit/dashboard", icon: "dashboard" },
    { title: "Audit Logs", href: "/audit/logs", icon: "policy" },
    { title: "Payroll", href: "/audit/payroll", icon: "payments" },
    { title: "Loans", href: "/audit/loans", icon: "savings" },
    { title: "Advances", href: "/audit/advances", icon: "account_balance_wallet" },
    { title: "Employees", href: "/audit/employees", icon: "group" },
    { title: "Reports", href: "/audit/reports", icon: "analytics" },
  ],
};

export function navigationFor(role: Role): readonly NavItem[] {
  return ROLE_NAVIGATION[role];
}

/**
 * True when `pathname` is the item's route or sits beneath it.
 *
 * Matches on a `/` boundary so sibling routes that share a prefix stay
 * distinct — `/hr/leave-types` must not light up the `/hr/leave` item.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  // A route that has its own rail item but lives under another item's prefix
  // must not light up both. `/hr/employees/requests` is "Requests", not "Employees".
  const carvedOut = NESTED_RAIL_ROUTES[href]?.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (carvedOut) return false;

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Parent rail href -> child routes that belong to a different rail item. */
const NESTED_RAIL_ROUTES: Record<string, readonly string[]> = {
  "/hr/employees": ["/hr/employees/requests"],
};