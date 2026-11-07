import Link from "next/link";

import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { MetricCard } from "@/components/shared/metric-card";
import { earningsOf, payTotals, type PayPeriod } from "@/lib/agent-pay";
import { formatDateRange, formatMoney, formatNumber } from "@/lib/format";
import type { EmployeeDirectoryResponse } from "@/types";
import type { EmployeePayslip } from "@/types/payslip";

/** Chooses the pay period. A plain GET form, so the period stays in the URL. */
export function PeriodPicker({ periods, selected, action }: { periods: PayPeriod[]; selected: PayPeriod | null; action: string }) {
  if (periods.length < 2) return null;

  return (
    <form method="get" action={action} className="bento-card mb-gutter flex flex-col gap-3 p-3 sm:flex-row sm:items-end">
      <FilterSelect
        name="period"
        label="Pay period"
        className="flex-1"
        defaultValue={selected?.key ?? ""}
        options={periods.map((period) => ({ value: period.key, label: formatDateRange(period.start, period.end) }))}
      />
      <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container">Show</button>
    </form>
  );
}

/** The period's totals. Same four figures on the branch cards page and on each branch's page. */
export function PayMetrics({ payslips, period }: { payslips: EmployeePayslip[]; period: PayPeriod | null }) {
  const totals = payTotals(payslips);
  const hint = period ? formatDateRange(period.start, period.end) : "No payment calculated yet";

  return (
    <div className="mb-gutter grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total Employees Should Receive" value={formatMoney(totals.amountDue)} icon="payments" tone="primary" hint={hint} />
      <MetricCard label="Earnings" value={formatMoney(totals.earnings)} icon="add_card" tone="tertiary" hint="Pay, PAYE, NSSF and NITA" />
      <MetricCard label="Deductions" value={formatMoney(totals.deductions)} icon="remove_circle" tone={totals.deductions > 0 ? "error" : "primary"} hint="Loans and damages" />
      <MetricCard label="Not Yet Recorded" value={formatMoney(totals.notRecorded)} icon="pending_actions" tone={totals.notRecorded > 0 ? "amber" : "primary"} hint={`${formatMoney(totals.recorded)} recorded by M-Pesa`} />
    </div>
  );
}

function Deduction({ amount }: { amount: number }) {
  return amount > 0 ? <span className="text-error">({formatMoney(amount, { showCurrency: false })})</span> : <span className="text-outline">—</span>;
}

/** Each employee's pay and deductions, as the Admin's calculation gave them. Name opens the full payslip. */
export function EmployeePayTable({
  employees,
  payslips,
  period,
}: {
  employees: EmployeeDirectoryResponse[];
  payslips: EmployeePayslip[];
  period: PayPeriod | null;
}) {
  if (employees.length === 0) {
    return <EmptyState symbol="group" title="No employees" description="You have no employees at this branch." />;
  }

  const byEmployee = new Map(payslips.map((payslip) => [payslip.employeeId, payslip]));
  const sorted = [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const money = (value: number) => formatMoney(value, { showCurrency: false });
  const header = "pb-3 font-table-header text-table-header uppercase text-outline";
  const numeric = `${header} text-right`;
  const totals = payTotals(payslips);

  return (
    <BentoCard
      title="Employees"
      subtitle={`${formatNumber(employees.length)} at this branch${period ? ` · ${formatDateRange(period.start, period.end)}` : ""}. Amounts in KES, from the Admin's calculation.`}
    >
      <ul className="flex flex-col gap-3 lg:hidden">
        {sorted.map((person) => {
          const payslip = byEmployee.get(person.id);
          return (
            <li key={person.id} className="min-w-0 rounded-lg border border-outline-variant/40 p-3">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  {payslip ? (
                    <Link href={`/agent/payslips/${payslip.id}`} className="break-words font-semibold text-primary hover:underline">{person.fullName}</Link>
                  ) : (
                    <p className="break-words font-semibold text-on-surface">{person.fullName}</p>
                  )}
                  <p className="font-mono text-xs text-outline">{person.employeeNumber}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-outline">Should receive</p>
                  <p className="font-bold tabular-nums text-on-surface">{payslip ? money(payslip.amountDue) : "—"}</p>
                </div>
              </div>
              {payslip ? (
                <dl className="mt-3 grid grid-cols-1 gap-x-3 gap-y-1.5 border-t border-outline-variant/30 pt-3 text-xs min-[400px]:grid-cols-2">
                  {[
                    ["Days worked", formatNumber(payslip.daysWorked)],
                    ["Pay", money(payslip.pay)],
                    ["PAYE", money(payslip.paye)],
                    ["NSSF", money(payslip.nssf)],
                    ["NITA", money(payslip.nita)],
                    ["Recorded", money(payslip.amountRecorded)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2">
                      <dt className="text-outline">{label}</dt>
                      <dd className="tabular-nums text-on-surface">{value}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-2">
                    <dt className="text-outline">Loan</dt>
                    <dd className="tabular-nums"><Deduction amount={payslip.loan} /></dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-outline">Damage</dt>
                    <dd className="tabular-nums"><Deduction amount={payslip.damage} /></dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-xs text-on-surface-variant">Not in this pay period.</p>
              )}
            </li>
          );
        })}
        {payslips.length > 0 ? (
          <li className="flex items-center justify-between rounded-lg bg-surface-container-low p-3 font-bold text-on-surface">
            <span>Total should receive</span>
            <span className="tabular-nums">{money(totals.amountDue)}</span>
          </li>
        ) : null}
      </ul>

      <div className="hidden w-full overflow-x-auto lg:block">
        <table className="data-table w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr>
              <th className={`${header} pl-2`}>Employee</th>
              <th className={numeric}>Days</th>
              <th className={numeric}>Pay</th>
              <th className={numeric}>PAYE</th>
              <th className={numeric}>NSSF</th>
              <th className={numeric}>NITA</th>
              <th className={numeric}>Loan</th>
              <th className={numeric}>Damage</th>
              <th className={numeric}>Should Receive</th>
              <th className={`${numeric} pr-2`}>Recorded</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {sorted.map((person) => {
              const payslip = byEmployee.get(person.id);
              return (
                <tr key={person.id} className="border-b border-outline-variant/20 hover:bg-surface">
                  <td className="py-3 pl-2">
                    {payslip ? (
                      <Link href={`/agent/payslips/${payslip.id}`} className="block font-semibold text-primary hover:underline">{person.fullName}</Link>
                    ) : (
                      <span className="block font-semibold">{person.fullName}</span>
                    )}
                    <span className="block font-mono text-[11px] text-outline">{person.employeeNumber}</span>
                  </td>
                  {payslip ? (
                    <>
                      <td className="py-3 text-right tabular-nums">{formatNumber(payslip.daysWorked)}</td>
                      <td className="py-3 text-right tabular-nums">{money(payslip.pay)}</td>
                      <td className="py-3 text-right tabular-nums">{money(payslip.paye)}</td>
                      <td className="py-3 text-right tabular-nums">{money(payslip.nssf)}</td>
                      <td className="py-3 text-right tabular-nums">{money(payslip.nita)}</td>
                      <td className="py-3 text-right tabular-nums"><Deduction amount={payslip.loan} /></td>
                      <td className="py-3 text-right tabular-nums"><Deduction amount={payslip.damage} /></td>
                      <td className="py-3 text-right font-bold tabular-nums">{money(payslip.amountDue)}</td>
                      <td className="py-3 pr-2 text-right tabular-nums">{money(payslip.amountRecorded)}</td>
                    </>
                  ) : (
                    <td colSpan={9} className="py-3 pr-2 text-right text-xs text-on-surface-variant">Not in this pay period</td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {payslips.length > 0 ? (
            <tfoot>
              <tr className="font-bold text-on-surface">
                <td colSpan={6} className="pt-3 pl-2">Total</td>
                <td colSpan={2} className="pt-3 text-right tabular-nums text-error">({money(totals.deductions)})</td>
                <td className="pt-3 text-right tabular-nums">{money(totals.amountDue)}</td>
                <td className="pt-3 pr-2 text-right tabular-nums">{money(totals.recorded)}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <p className="mt-4 text-xs text-on-surface-variant">
        Should Receive is Pay plus PAYE, NSSF and NITA, less any loan and damage. Advances and your agent fee are on your statement, not on any one employee.
      </p>
    </BentoCard>
  );
}
