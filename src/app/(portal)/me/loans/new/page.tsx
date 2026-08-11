//src/app/(portal)/me/loans/new/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * New loan request — task-focused flow, nav shell suppressed per the
 * original design (back button instead of side rail). If your route group
 * layout always renders the shell, this page may need a layout override
 * (e.g. a `(focus)` route group) rather than relying on this page alone.
 *
 * "Repayment Schedule" preview is empty-state only here since amount/term
 * calculation needs client state — convert to "use client" once wired to
 * a real interest-rate calculation.
 */

export default async function NewLoanRequestPage() {
  await requirePermission("loan:request");

  return (
    <div className="bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-variant bg-surface/80 px-container-margin py-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/me/loans"
            className="flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <Icon name="arrow_back" />
          </Link>
          <div>
            <h1 className="font-page-title text-page-title text-primary">New Loan Request</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Apply for an employee loan and view repayment details.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl p-container-margin">
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          {/* ─────────────────────────────── form column ─────────────── */}
          <div className="space-y-gutter lg:col-span-8">
            <div className="rounded-card bg-white p-card-padding shadow-[0_2px_8px_rgba(11,42,69,.06)]">
              <h2 className="mb-6 flex items-center gap-2 font-page-title text-page-title text-on-surface">
                <Icon name="edit_document" className="text-primary" />
                Loan Details
              </h2>

              <form className="space-y-6">
                <div>
                  <label htmlFor="amount" className="mb-2 block font-label-rail uppercase text-on-surface-variant">
                    Loan Amount (KES)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-body-md text-on-surface-variant">
                      KES
                    </span>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      required
                      placeholder="e.g. 50,000"
                      className="w-full rounded-lg border border-[#E9EFF5] py-3 pl-12 pr-4 font-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="period" className="mb-2 block font-label-rail uppercase text-on-surface-variant">
                    Repayment Period
                  </label>
                  <div className="relative">
                    <select
                      id="period"
                      name="period"
                      required
                      defaultValue=""
                      className="w-full appearance-none rounded-lg border border-[#E9EFF5] py-3 pl-4 pr-10 font-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                    >
                      <option value="" disabled>
                        Select duration...
                      </option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="24">24 Months</option>
                    </select>
                    <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className="mb-2 block font-label-rail uppercase text-on-surface-variant">
                    Reason for Loan
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={4}
                    required
                    placeholder="Briefly describe the purpose of this loan..."
                    className="w-full resize-none rounded-lg border border-[#E9EFF5] p-4 font-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-surface-variant pt-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      required
                      className="size-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      I agree to the{" "}
                      <a href="/legal/loan-terms" className="text-primary hover:underline">
                        Loan Terms &amp; Conditions
                      </a>
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-[#0B2A45] px-8 py-3 font-bold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
                  >
                    Submit Request
                    <Icon name="send" className="text-sm" />
                  </button>
                </div>
              </form>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-secondary-fixed bg-secondary-fixed/50 p-4">
              <Icon name="info" className="mt-1 text-primary" />
              <div>
                <h4 className="mb-1 font-label-rail uppercase text-primary">Approval Process</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Loan requests are typically processed within 2-3 business days. Your line manager and HR will
                  review the application before final approval.
                </p>
              </div>
            </div>
          </div>

          {/* ────────────────────────────── schedule preview ────────────── */}
          <div className="space-y-gutter lg:col-span-4">
            <div className="flex h-full flex-col rounded-card bg-white p-card-padding shadow-[0_2px_8px_rgba(11,42,69,.06)]">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-page-title text-page-title text-on-surface">
                  <Icon name="calendar_month" className="text-primary" />
                  Repayment Schedule
                </h2>
                <span className="rounded-md bg-surface-container-low px-2 py-1 text-xs font-medium text-on-surface-variant">
                  Preview
                </span>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-surface-variant bg-surface-bright p-3">
                  <p className="mb-1 font-label-rail uppercase text-on-surface-variant">Est. Monthly</p>
                  <p className="font-card-stat text-card-stat text-primary">--</p>
                </div>
                <div className="rounded-lg border border-surface-variant bg-surface-bright p-3">
                  <p className="mb-1 font-label-rail uppercase text-on-surface-variant">Total Interest</p>
                  <p className="font-card-stat text-card-stat text-error">--</p>
                </div>
              </div>

              <div className="flex-1 overflow-auto rounded-lg border border-surface-variant">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-surface-container-low">
                    <tr>
                      <th className="p-3 font-table-header uppercase text-on-surface-variant">Month</th>
                      <th className="p-3 font-table-header uppercase text-on-surface-variant">Principal</th>
                      <th className="p-3 text-right font-table-header uppercase text-on-surface-variant">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-on-surface-variant">
                        <Icon name="calculate" className="mb-2 text-4xl text-outline-variant" />
                        <p className="font-body-md text-body-md">
                          Enter amount and period
                          <br />
                          to view schedule preview.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-center font-body-md text-xs text-on-surface-variant">
                *This is an estimate. Actual figures may vary based on exact approval date and interest rates.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}