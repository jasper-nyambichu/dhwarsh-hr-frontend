import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { QuickAccessGroups, type QuickAccessItem } from "@/components/features/dashboard/quick-access";
import { BranchCards, existingEmployees } from "@/components/features/employee/branch-directory";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Icon } from "@/components/ui/icon";
import { navigationFor } from "@/config/navigation";
import { loadAccountsPayments } from "@/lib/accounts";
import { getAdvances } from "@/lib/api/agent-money";
import { getBranches } from "@/lib/api/branch";
import { getBranchDirectory } from "@/lib/api/employee";
import { formatDate, formatDateRange, formatNumber } from "@/lib/format";
import { formatKes } from "@/lib/money-format";

/**
 * Accounts Office dashboard, laid out like the Admin's: the headline cards (to pay, paid this month, employees,
 * branches), a shortcut card for every place on the sidebar under a heading, the payments waiting, and every
 * branch as a card with its employees.
 */

const QUICK_ACCESS_GROUPS: readonly { title: string; hrefs: readonly string[] }[] = [
  { title: "Money", hrefs: ["/accounts/payments", "/accounts/invoices", "/accounts/advances"] },
  { title: "People", hrefs: ["/accounts/employees/new", "/accounts/employees"] },
];

const CARD_LINK =
  "flex rounded-card transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export default async function AccountsDashboardPage() {
  const session = await requirePermission("paymentrequest:pay");

  let payments: Awaited<ReturnType<typeof loadAccountsPayments>>;
  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    [payments, branches] = await Promise.all([loadAccountsPayments(), getBranches()]);
  } catch (error) {
    return <DataUnavailable title="Dashboard" subject="The dashboard" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const [lists, advancesResult] = await Promise.all([
    Promise.allSettled(branches.map((branch) => getBranchDirectory(branch.id))),
    getAdvances().catch(() => null),
  ]);

  const headcount = branches.map((branch, index) => {
    const list = lists[index];
    return { branch, employeeCount: list?.status === "fulfilled" ? existingEmployees(list.value).length : null };
  });
  const totalEmployees = headcount.reduce((sum, item) => sum + (item.employeeCount ?? 0), 0);
  const activeBranches = branches.filter((branch) => branch.status === "ACTIVE").length;

  const toPayTotal = payments.toPay.reduce((sum, item) => sum + item.request.amount, 0);
  const thisMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date()).slice(0, 7);
  const paidThisMonth = payments.paid.filter((item) => (item.request.paidOn ?? item.request.releasedAt ?? "").startsWith(thisMonth));
  const paidThisMonthTotal = paidThisMonth.reduce((sum, item) => sum + item.request.amount, 0);
  const owedAdvances = (advancesResult ?? [])
    .filter((advance) => advance.status === "OUTSTANDING" || advance.status === "PARTIALLY_RECOVERED")
    .reduce((sum, advance) => sum + advance.outstandingBalance, 0);

  const hints: Record<string, Pick<QuickAccessItem, "hint" | "attention">> = {
    "/accounts/payments": { hint: `${formatNumber(payments.toPay.length)} to pay · ${formatKes(toPayTotal)}`, attention: payments.toPay.length },
    "/accounts/invoices": { hint: "Every agent invoice, to view or print" },
    "/accounts/advances": { hint: advancesResult ? `${formatKes(owedAdvances)} still owed` : "Advances given to agents" },
    "/accounts/employees": { hint: `${formatNumber(totalEmployees)} employees in ${formatNumber(branches.length)} branches` },
    "/accounts/profile": { hint: "Your login and password" },
  };

  const quickAccess: QuickAccessItem[] = [
    { href: "/accounts/employees/new", title: "Add Employee", icon: "person_add", hint: "Register a new employee" },
    ...navigationFor(session.role)
      .filter((item) => item.href !== "/accounts/dashboard")
      .map((item) => ({ href: item.href, title: item.title, icon: item.icon, ...(hints[item.href] ?? { hint: `Open ${item.title}` }) })),
  ];
  const inGroup = (href: string) => QUICK_ACCESS_GROUPS.some((group) => group.hrefs.includes(href));
  const quickAccessGroups = [
    ...QUICK_ACCESS_GROUPS.map((group) => ({
      title: group.title,
      items: group.hrefs.flatMap((href) => quickAccess.filter((item) => item.href === href)),
    })),
    { title: "More", items: quickAccess.filter((item) => !inGroup(item.href)) },
  ];

  return (
    <div className="flex flex-col gap-gutter">
      {/* ─────────────────────────────── headline cards ─────────────────── */}
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/accounts/payments" className={CARD_LINK}>
          <StatCard
            className="w-full"
            label="To Pay"
            value={formatKes(toPayTotal)}
            icon="request_quote"
            badgeIcon="arrow_forward"
            hint={`${formatNumber(payments.toPay.length)} invoice(s) waiting`}
          />
        </Link>
        <Link href="/accounts/payments?tab=paid" className={CARD_LINK}>
          <StatCard
            className="w-full"
            label="Paid This Month"
            value={formatKes(paidThisMonthTotal)}
            icon="paid"
            badgeIcon="arrow_forward"
            hint={`${formatNumber(paidThisMonth.length)} payment(s)`}
          />
        </Link>
        <Link href="/accounts/employees" className={CARD_LINK}>
          <StatCard
            className="w-full"
            label="Total Employees"
            value={formatNumber(totalEmployees)}
            icon="group"
            badgeIcon="arrow_forward"
            hint="Across every branch"
          />
        </Link>
        <Link href="/accounts/employees" className={CARD_LINK}>
          <StatCard
            className="w-full"
            label="Branches"
            value={formatNumber(activeBranches)}
            icon="corporate_fare"
            badgeIcon="arrow_forward"
            hint="Open to see employees by branch"
          />
        </Link>
      </div>

      <QuickAccessGroups groups={quickAccessGroups} />

      {/* ─────────────────────────────── payments waiting ───────────────── */}
      <BentoCard
        title="Waiting to be paid"
        subtitle="Agent invoices from the Admin's payroll runs"
        action={
          <Link
            href="/accounts/payments"
            className="flex items-center gap-2 rounded border border-outline-variant/40 px-3 py-1.5 text-[10px] text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Icon name="arrow_forward" className="text-sm" />
            All payments
          </Link>
        }
      >
        {payments.toPay.length === 0 ? (
          <EmptyState symbol="task_alt" title="All paid" description="When the Admin runs the payroll, each agent's invoice appears here to pay." />
        ) : (
          <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            {payments.toPay.slice(0, 6).map(({ request, invoice }) => (
              <li key={request.id}>
                <Link
                  href={invoice ? `/accounts/invoices/${invoice.id}` : "/accounts/payments"}
                  className="group flex h-full min-w-0 flex-col gap-2 rounded-card border border-outline-variant/40 p-4 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 break-words font-bold text-on-surface group-hover:text-primary-container">
                      {request.agentName ?? `Agent #${request.agentId}`}
                    </span>
                    <span className="shrink-0 rounded-full bg-amber-main/15 px-2.5 py-0.5 text-xs font-semibold text-amber-main">To pay</span>
                  </span>
                  <span className="text-xl font-bold tabular-nums text-on-surface">{formatKes(request.amount)}</span>
                  <span className="text-xs text-on-surface-variant">
                    {invoice ? formatDateRange(invoice.periodStart, invoice.periodEnd) : request.purpose} · approved {formatDate(request.decidedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </BentoCard>

      {/* ─────────────────────────────── branches ───────────────────────── */}
      <section aria-label="Branches" className="flex flex-col gap-3">
        <h2 className="font-table-header text-table-header uppercase text-outline">Employees by branch</h2>
        <BranchCards basePath="/accounts/employees/branches" items={headcount} />
      </section>
    </div>
  );
}
