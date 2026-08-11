import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";

/**
 * Request Advance form (agent-initiated, on behalf of deployed staff).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * UI ONLY — no server action wired yet. Wire to `POST /agent-advances`
 * once ready. Eligibility figures are placeholder — the outstanding
 * balance and max-eligible-amount would need to come from the backend at
 * request time.
 * ─────────────────────────────────────────────────────────────────────────
 */

const ELIGIBILITY = {
  eligible: true,
  outstandingBalance: 0,
  maxEligibleAmount: 150_000,
};

export default async function NewAgentAdvancePage() {
  await requirePermission("agentadvance:request");

  return (
    <>
      <PageHeader
        title="Request Salary Advance"
        actions={
          <button type="button" className="flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low">
            <Icon name="arrow_back" />
          </button>
        }
      />

      <form id="new-advance-form" className="mx-auto grid max-w-6xl grid-cols-1 gap-gutter md:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="md:col-span-8">
          <BentoCard title="Advance Details">
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-on-surface-variant" htmlFor="amount">
                  Amount (KES)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-semibold text-on-surface-variant/70">
                    KES
                  </span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-outline-variant/60 py-3 pl-12 pr-3 text-on-surface transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-on-surface-variant" htmlFor="purpose">
                  Purpose
                </label>
                <textarea
                  id="purpose"
                  name="purpose"
                  rows={4}
                  placeholder="Briefly describe the reason for this advance request..."
                  className="block w-full resize-none rounded-lg border border-outline-variant/60 p-3 text-on-surface transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-on-surface-variant" htmlFor="recovery">
                  Recovery Period (Months)
                </label>
                <select
                  id="recovery"
                  name="recovery"
                  className="block w-full appearance-none rounded-lg border border-outline-variant/60 p-3 text-on-surface transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="1">1 Month</option>
                  <option value="2">2 Months</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                </select>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
                <Icon name="info" className="mt-0.5 shrink-0 text-primary" />
                <p className="text-sm text-on-surface-variant">
                  Advances are subject to approval by your HR manager. Deductions will begin from your next payroll
                  cycle automatically.
                </p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="md:col-span-4">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="verified_user" className="text-lg" />
                Eligibility Preview
              </span>
            }
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between rounded-lg border border-tertiary-fixed/30 bg-tertiary-fixed/20 p-3">
                <span className="flex items-center gap-2">
                  <Icon name="check_circle" className="font-bold text-tertiary" />
                  <span className="font-medium text-tertiary">
                    {ELIGIBILITY.eligible ? "Eligible" : "Not Eligible"}
                  </span>
                </span>
                <span className="text-xs text-on-surface-variant">Good Standing</span>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-on-surface-variant">Outstanding Balance</p>
                <span className="font-card-stat text-card-stat text-on-surface">
                  {formatMoney(ELIGIBILITY.outstandingBalance)}
                </span>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary" style={{ width: "0%" }} />
                </div>
              </div>

              <div className="h-px w-full bg-outline-variant/30" />

              <div>
                <p className="mb-1 text-xs font-medium text-on-surface-variant">Maximum Eligible Amount</p>
                <span className="font-card-stat text-card-stat text-primary">
                  {formatMoney(ELIGIBILITY.maxEligibleAmount)}
                </span>
                <p className="mt-2 text-right text-xs text-on-surface-variant">Based on 50% of net salary</p>
              </div>
            </div>
          </BentoCard>
        </div>
      </form>

      {/* Sticky within the content column rather than fixed to the viewport,
          which would sit on top of the sidebar at every width. */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-gutter flex flex-wrap justify-end gap-3 border-t border-outline-variant bg-surface/90 p-4 backdrop-blur-md sm:-mx-6 lg:-mx-container-margin">
        <button type="button" className="rounded-lg px-6 py-2.5 font-medium text-primary transition-colors hover:bg-primary/5">
          Cancel
        </button>
        <button
          type="submit"
          form="new-advance-form"
          className="flex items-center gap-2 rounded-lg bg-orange px-6 py-2.5 font-medium text-white shadow-md transition-colors hover:bg-orange-deep"
        >
          Submit Request
          <Icon name="send" className="text-sm" />
        </button>
      </div>
    </>
  );
}