import type { Role } from "@/config/roles";

/**
 * Rail navigation per role.
 *
 * The business runs on four accounts: Admin, Branch Manager, Agent and Back Office.
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
  { title: "Off Days", href: "/admin/off-days", icon: "event_busy" },
  { title: "Attendance", href: "/admin/attendance", icon: "schedule" },
  { title: "Days Worked", href: "/admin/days-worked", icon: "date_range" },
  { title: "Branches", href: "/admin/branches", icon: "account_balance" },
  { title: "Departments", href: "/admin/departments", icon: "workspaces" },
  { title: "Agents", href: "/admin/agents", icon: "handshake" },
  { title: "Users", href: "/admin/users", icon: "manage_accounts" },
  { title: "Devices", href: "/admin/devices", icon: "fingerprint" },
  { title: "Audit", href: "/admin/audit", icon: "policy" },
  { title: "Pay Rates", href: "/admin/pay-settings", icon: "request_quote" },
  { title: "Payslips", href: "/admin/payslips", icon: "receipt_long" },
  { title: "Settings", href: "/admin/settings", icon: "settings" },
  { title: "Profile", href: "/admin/profile", icon: "account_circle" },
];

export const ROLE_NAVIGATION: Record<Role, readonly NavItem[]> = {
  SUPER_ADMIN: ADMIN_NAV,
  ADMIN: ADMIN_NAV,

  BRANCH_MANAGER: [
    { title: "Dashboard", href: "/branch/dashboard", icon: "dashboard" },
    { title: "Employees", href: "/branch/employees", icon: "group" },
    { title: "Attendance", href: "/branch/attendance", icon: "schedule" },
    { title: "Approvals", href: "/branch/approvals", icon: "checklist" },
    { title: "Payslips", href: "/branch/payslips", icon: "receipt_long" },
    { title: "Profile", href: "/branch/profile", icon: "account_circle" },
  ],

  AGENT: [
    { title: "Dashboard", href: "/agent/dashboard", icon: "dashboard" },
    { title: "Employees", href: "/agent/employees", icon: "group" },
    { title: "Requests", href: "/agent/requests", icon: "pending_actions" },
    { title: "Off Days", href: "/agent/off-days", icon: "event_busy" },
    { title: "Summaries", href: "/agent/summaries", icon: "summarize" },
    { title: "Invoices", href: "/agent/invoices", icon: "description" },
    { title: "Payslips", href: "/agent/payslips", icon: "receipt_long" },
    { title: "Loans", href: "/agent/loans", icon: "savings" },
    { title: "Advances", href: "/agent/advances", icon: "account_balance_wallet" },
    { title: "Payments", href: "/agent/payments", icon: "payments" },
    { title: "Profile", href: "/agent/profile", icon: "account_circle" },
  ],

  // Runs the clock-in/out application and biometric devices; records the days agents are paid on.
  BACK_OFFICE: [
    { title: "Dashboard", href: "/backoffice/dashboard", icon: "dashboard" },
    { title: "Attendance", href: "/backoffice/attendance", icon: "schedule" },
    { title: "Devices", href: "/backoffice/devices", icon: "fingerprint" },
    { title: "Profile", href: "/backoffice/profile", icon: "account_circle" },
  ],

};

export function navigationFor(role: Role): readonly NavItem[] {
  return ROLE_NAVIGATION[role];
}

/**
 * True when `pathname` is the item's route or sits beneath it.
 *
 * Matches on a `/` boundary so sibling routes that share a prefix stay
 * distinct.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
