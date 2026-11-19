import { BentoCard } from "@/components/shared/bento-card";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatDateRange, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgentPaymentDetail } from "@/types/agent-portal";

const money = (value: number | null | undefined) => formatMoney(value ?? 0, { showCurrency: false });

function Row({ label, value, minus, strong, hint }: { label: string; value: number; minus?: boolean; strong?: boolean; hint?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-outline-variant/30 py-2 text-sm", strong && "font-bold")}>
      <span className="min-w-0">
        <span className={strong ? "text-on-surface" : "text-on-surface-variant"}>{label}</span>
        {hint ? <span className="block text-[11px] text-outline">{hint}</span> : null}
      </span>
      {/* Nothing taken reads 0.00, never − 0.00. */}
      <span className={cn("shrink-0 tabular-nums", minus && value > 0 ? "text-error" : "text-on-surface")}>
        {minus && value > 0 ? `− ${money(value)}` : money(value)}
      </span>
    </div>
  );
}

/**
 * One agent's payment line by line: every employee's salary, days, pay, loans and damages and net pay; what is
 * added for the agent (PAYE, NSSF, NITA, agent fee, VAT); and every deduction, each advance on its own line with
 * the date it was asked for and approved and a minus. The Admin's preview, the Admin's record of a payment and the
 * agent's invoice all show it through this, from the same server figures, so they always match.
 */
export function AgentPaymentDetailView({ detail, preview = false }: { detail: AgentPaymentDetail; preview?: boolean }) {
  const salary = detail.payBasis === "SALARY";
  const subtotal = detail.salaries + detail.paye + detail.nssf + detail.nita + detail.agentFee;
  const deductions = detail.loans + detail.damages + detail.advanceRecovered;

  return (
    <div className="flex flex-col gap-gutter">
      {detail.warnings.length > 0 ? (
        <ul className="flex flex-col gap-2 rounded-card border border-amber-main/40 bg-amber-main/5 p-3 text-sm text-on-surface" role="status">
          {detail.warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2">
              <Icon name="warning" className="mt-0.5 text-[18px] text-amber-main" />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <BentoCard
        title="Employees"
        subtitle={`${formatNumber(detail.employees.length)} employee${detail.employees.length === 1 ? "" : "s"} · ${formatDateRange(detail.periodStart, detail.periodEnd)} · ${
          salary ? "each paid from their own monthly salary for the days paid (worked + off days)" : "paid by days worked × the daily rate at the time"
        }`}
      >
        <ul className="flex flex-col gap-3 lg:hidden">
          {detail.employees.map((line) => (
            <li key={line.employeeId} className="rounded-lg border border-outline-variant/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-on-surface">{line.employeeName}</p>
                  <p className="text-xs text-outline">{[line.employeeNumber, line.branchName].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-outline">Net pay</p>
                  <p className="font-bold tabular-nums">{money(line.netPay)}</p>
                </div>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-outline-variant/30 pt-2 text-xs">
                <dt className="text-outline">{salary ? "Monthly salary" : "Daily rate"}</dt>
                <dd className="text-right tabular-nums">{money(salary ? line.monthlySalary : line.dailyRate)}</dd>
                <dt className="text-outline">Days paid</dt>
                <dd className="text-right tabular-nums">
                  {formatNumber(line.daysWorked)}
                  {line.offDaysPaid > 0 ? ` + ${formatNumber(line.offDaysPaid)} off` : ""}
                </dd>
                <dt className="text-outline">Pay</dt>
                <dd className="text-right tabular-nums">{money(line.pay)}</dd>
                <dt className="text-outline">Loans and damages</dt>
                <dd className="text-right tabular-nums text-error">{line.loan + line.damage > 0 ? `− ${money(line.loan + line.damage)}` : "—"}</dd>
              </dl>
            </li>
          ))}
        </ul>

        <div className="hidden w-full overflow-x-auto lg:block">
          <table className="data-table w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="font-table-header text-table-header uppercase text-outline">
                <th className="pb-3 pl-2">Employee</th>
                <th className="pb-3 text-right">{salary ? "Monthly salary" : "Daily rate"}</th>
                <th className="pb-3 text-right">Days paid</th>
                <th className="pb-3 text-right">Pay</th>
                <th className="pb-3 text-right">Loans</th>
                <th className="pb-3 text-right">Damages</th>
                <th className="pb-3 pr-2 text-right">Net pay</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface">
              {detail.employees.map((line) => (
                <tr key={line.employeeId} className="border-b border-outline-variant/20">
                  <td className="py-3 pl-2">
                    <span className="block font-semibold">{line.employeeName}</span>
                    <span className="block text-[11px] text-outline">{[line.employeeNumber, line.branchName].filter(Boolean).join(" · ")}</span>
                  </td>
                  <td className="py-3 text-right tabular-nums">{money(salary ? line.monthlySalary : line.dailyRate)}</td>
                  <td className="py-3 text-right tabular-nums">
                    {formatNumber(line.daysWorked)}
                    {line.offDaysPaid > 0 ? <span className="text-outline"> + {formatNumber(line.offDaysPaid)} off</span> : null}
                  </td>
                  <td className="py-3 text-right tabular-nums">{money(line.pay)}</td>
                  <td className="py-3 text-right tabular-nums text-error">{line.loan > 0 ? `− ${money(line.loan)}` : "—"}</td>
                  <td className="py-3 text-right tabular-nums text-error">{line.damage > 0 ? `− ${money(line.damage)}` : "—"}</td>
                  <td className="py-3 pr-2 text-right font-bold tabular-nums">{money(line.netPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <BentoCard title="Added for the agent" subtitle="What the agent is paid on top of the employees' pay">
          <Row label={salary ? "Salaries for the period" : "Pay for days worked"} value={detail.salaries} />
          <Row label="PAYE" value={detail.paye} />
          <Row label="NSSF" value={detail.nssf} />
          <Row label="NITA" value={detail.nita} />
          <Row label="Agent fee" value={detail.agentFee} />
          <Row label={`VAT (${formatPercent(detail.vatRate)})`} value={detail.vat} />
          <Row label="Total before deductions" value={subtotal + detail.vat} strong />
        </BentoCard>

        <BentoCard title="Deductions" subtitle="Taken off what the agent is paid">
          <Row label="Loans" value={detail.loans} minus />
          <Row label="Damages" value={detail.damages} minus />
          {detail.advances.length > 0 ? (
            detail.advances.map((advance) => (
              <Row
                key={advance.advanceId}
                label={`Advance #${advance.advanceId}${advance.advanceAmount !== null ? ` of ${money(advance.advanceAmount)}` : ""}`}
                hint={[
                  advance.requestedOn ? `Asked ${formatDate(advance.requestedOn)}` : null,
                  advance.approvedOn ? `approved ${formatDate(advance.approvedOn)}` : null,
                  `${money(advance.balanceAfter)} still owed after this`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                value={advance.deducted}
                minus
              />
            ))
          ) : (
            <Row label="Advances" value={detail.advanceRecovered} minus />
          )}
          <Row label="Total deductions" value={deductions} minus strong />
        </BentoCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary-fixed bg-primary-fixed-dim/20 px-5 py-4">
        <span className="font-semibold text-primary">
          {preview ? "The agent would be paid" : "Total amount due to the agent"} · {detail.agentName}
        </span>
        <span className="text-2xl font-bold tabular-nums text-primary">{formatMoney(detail.amountPayable)}</span>
      </div>
    </div>
  );
}
