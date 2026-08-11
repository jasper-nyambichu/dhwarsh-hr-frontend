import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";

/**
 * New Payroll Run — Step 3 (Preview Calculations) of the wizard.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * UI ONLY, step 3 of 4 rendered. Steps 1 (Select Period & Scope), 2 (Review
 * Inputs), and 4 (Confirm) are not yet built — this page will need routing
 * state (query param or client component) to move between steps once wired.
 * Preview rows are placeholder — swap for the response of
 * `POST /payroll/run` in preview/dry-run mode once that exists.
 * ─────────────────────────────────────────────────────────────────────────
 */

type PreviewRow = {
  id: number;
  name: string;
  code: string;
  gross: number;
  paye: number;
  nssf: number;
  shif: number;
  housingLevy: number;
  loanDeduction: number;
  net: number;
};

const PREVIEW_ROWS: readonly PreviewRow[] = [
  { id: 1, name: "John Omondi", code: "EMP-1042", gross: 150_000, paye: 32_500, nssf: 1_080, shif: 4_125, housingLevy: 2_250, loanDeduction: 0, net: 110_045 },
  { id: 2, name: "Mary Wanjiku", code: "EMP-1088", gross: 95_000, paye: 18_200, nssf: 1_080, shif: 2_612.5, housingLevy: 1_425, loanDeduction: 5_000, net: 66_682.5 },
  { id: 3, name: "David Kiprono", code: "EMP-1102", gross: 210_000, paye: 51_300, nssf: 1_080, shif: 5_775, housingLevy: 3_150, loanDeduction: 12_500, net: 136_195 },
  { id: 4, name: "Sarah Anyango", code: "EMP-1145", gross: 120_000, paye: 24_700, nssf: 1_080, shif: 3_300, housingLevy: 1_800, loanDeduction: 0, net: 89_120 },
  { id: 5, name: "Peter Ndungu", code: "EMP-1190", gross: 85_000, paye: 15_600, nssf: 1_080, shif: 2_337.5, housingLevy: 1_275, loanDeduction: 2_500, net: 62_207.5 },
  { id: 6, name: "Lucy Mutua", code: "EMP-1205", gross: 280_000, paye: 75_800, nssf: 1_080, shif: 7_700, housingLevy: 4_200, loanDeduction: 0, net: 191_220 },
  { id: 7, name: "Emmanuel Kiptoo", code: "EMP-1234", gross: 115_000, paye: 23_400, nssf: 1_080, shif: 3_162.5, housingLevy: 1_725, loanDeduction: 8_500, net: 77_132.5 },
  { id: 8, name: "Alice Waweru", code: "EMP-1288", gross: 175_000, paye: 39_500, nssf: 1_080, shif: 4_812.5, housingLevy: 2_625, loanDeduction: 0, net: 126_982.5 },
];

const TOTALS = PREVIEW_ROWS.reduce(
  (acc, row) => ({
    gross: acc.gross + row.gross,
    paye: acc.paye + row.paye,
    nssf: acc.nssf + row.nssf,
    shif: acc.shif + row.shif,
    housingLevy: acc.housingLevy + row.housingLevy,
    loanDeduction: acc.loanDeduction + row.loanDeduction,
    net: acc.net + row.net,
  }),
  { gross: 0, paye: 0, nssf: 0, shif: 0, housingLevy: 0, loanDeduction: 0, net: 0 },
);

const STEPS = [
  { label: "Scope", state: "done" as const },
  { label: "Inputs", state: "done" as const },
  { label: "Preview", state: "active" as const },
  { label: "Confirm", state: "upcoming" as const },
];

export default async function NewPayrollRunPage() {
  await requirePermission("payroll:run");

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-gutter">
      {/* ───────────────────────────────── stepper ─────────────────── */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 rounded-full bg-surface-container-highest" />
        <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-2/3 -translate-y-1/2 rounded-full bg-primary transition-all duration-500" />
        {STEPS.map((step, i) => (
          <div key={step.label} className="relative flex flex-col items-center gap-2 bg-background px-4">
            <span
              className={
                step.state === "done"
                  ? "flex size-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm"
                  : step.state === "active"
                    ? "flex size-8 items-center justify-center rounded-full border-2 border-primary bg-primary text-on-primary shadow-md ring-4 ring-primary/20"
                    : "flex size-8 items-center justify-center rounded-full bg-surface-container-highest text-outline"
              }
            >
              {step.state === "done" ? <Icon name="check" className="text-[18px]" /> : i + 1}
            </span>
            <span
              className={`font-body-md text-body-md ${
                step.state === "upcoming" ? "text-outline" : step.state === "active" ? "font-bold text-primary" : "font-medium text-primary"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* ───────────────────────────────── main card ─────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-card border border-surface-container-highest bg-surface bento-shadow">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-surface-container-highest bg-surface-bright p-card-padding sm:flex-row sm:items-center">
          <div>
            <h2 className="mb-1 font-page-title text-page-title text-on-surface">Preview Calculations</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Verify gross-to-net calculations for the October 2026 cycle (Nairobi CBD branch).
            </p>
          </div>
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-soft px-4 font-body-md text-body-md font-medium text-primary-container transition-colors hover:bg-primary-container/20"
          >
            <Icon name="download" className="text-[18px]" />
            Export CSV
          </button>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest">
                <th className="sticky left-0 z-10 whitespace-nowrap bg-surface-container-lowest p-4 font-table-header text-table-header uppercase text-on-surface-variant shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  Employee
                </th>
                <th className="p-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Gross (KES)</th>
                <th className="p-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">PAYE</th>
                <th className="p-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">NSSF</th>
                <th className="p-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">SHIF</th>
                <th className="p-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Housing Levy</th>
                <th className="p-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Loan Ded.</th>
                <th className="bg-primary/5 p-4 text-right font-table-header text-table-header uppercase text-primary">Net (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {PREVIEW_ROWS.map((row) => (
                <tr key={row.id} className="group transition-colors hover:bg-background/80">
                  <td className="sticky left-0 z-10 bg-surface p-4 shadow-[2px_0_4px_rgba(0,0,0,0.02)] group-hover:bg-background/80">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                      >
                        {row.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div>
                        <div className="font-body-md text-body-md font-medium text-on-surface">{row.name}</div>
                        <div className="text-[10px] text-on-surface-variant">{row.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-body-md text-body-md tabular-nums">{formatMoney(row.gross, { showCurrency: false })}</td>
                  <td className="p-4 text-right font-body-md text-body-md tabular-nums text-error">{formatMoney(row.paye, { showCurrency: false })}</td>
                  <td className="p-4 text-right font-body-md text-body-md tabular-nums text-on-surface-variant">{formatMoney(row.nssf, { showCurrency: false })}</td>
                  <td className="p-4 text-right font-body-md text-body-md tabular-nums text-on-surface-variant">{formatMoney(row.shif, { showCurrency: false })}</td>
                  <td className="p-4 text-right font-body-md text-body-md tabular-nums text-on-surface-variant">{formatMoney(row.housingLevy, { showCurrency: false })}</td>
                  <td className="p-4 text-right font-body-md text-body-md tabular-nums text-on-surface-variant">{formatMoney(row.loanDeduction, { showCurrency: false })}</td>
                  <td className="bg-primary/5 p-4 text-right font-body-md text-body-md font-bold tabular-nums text-primary">
                    {formatMoney(row.net, { showCurrency: false })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-bright">
              <tr className="border-t-2 border-surface-container-highest">
                <td className="sticky left-0 z-10 bg-surface-bright p-4 font-body-md text-body-md font-bold uppercase tracking-wide text-on-surface">
                  Totals ({PREVIEW_ROWS.length} Employees)
                </td>
                <td className="p-4 text-right font-body-md text-body-md font-bold tabular-nums text-on-surface">{formatMoney(TOTALS.gross, { showCurrency: false })}</td>
                <td className="p-4 text-right font-body-md text-body-md font-bold tabular-nums text-error">{formatMoney(TOTALS.paye, { showCurrency: false })}</td>
                <td className="p-4 text-right font-body-md text-body-md font-bold tabular-nums text-on-surface-variant">{formatMoney(TOTALS.nssf, { showCurrency: false })}</td>
                <td className="p-4 text-right font-body-md text-body-md font-bold tabular-nums text-on-surface-variant">{formatMoney(TOTALS.shif, { showCurrency: false })}</td>
                <td className="p-4 text-right font-body-md text-body-md font-bold tabular-nums text-on-surface-variant">{formatMoney(TOTALS.housingLevy, { showCurrency: false })}</td>
                <td className="p-4 text-right font-body-md text-body-md font-bold tabular-nums text-on-surface-variant">{formatMoney(TOTALS.loanDeduction, { showCurrency: false })}</td>
                <td className="bg-primary/10 p-4 text-right font-card-stat text-card-stat text-primary">{formatMoney(TOTALS.net, { showCurrency: false })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="z-20 flex items-center justify-between border-t border-surface-container-highest bg-surface p-card-padding">
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <Icon name="verified" className="text-[16px] text-tertiary-fixed-dim" />
            Calculations verified against KRA 2026 guidelines
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              href="/payroll/runs/new"
              className="flex h-10 items-center rounded-lg border border-primary-container px-6 font-body-md text-body-md font-bold text-primary-container transition-colors hover:bg-blue-soft"
            >
              Back
            </Link>
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-6 font-body-md text-body-md font-bold text-on-primary shadow-md transition-colors hover:bg-primary"
            >
              Confirm & Run
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}