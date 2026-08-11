import { requirePermission } from "@/app/lib/dal";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";

/**
 * Settings — Payroll Rules panel active.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * UI ONLY — no server action wired yet. Only the "Payroll Rules" panel
 * renders content; the other sub-nav links (Company Profile, Leave Policy,
 * Attendance Rules, Statutory Rates, Notifications, Security) are static
 * links with no panel behind them yet. Wire to
 * `GET/PUT /company/settings` when ready — note the backend's
 * `CompanySettings` type already has `payrollPeriod` and
 * `overtimeMultiplier` fields; `cutOffDay` and `roundingRule` may need to
 * be added.
 * ─────────────────────────────────────────────────────────────────────────
 */

const SECTIONS = [
  { label: "Company Profile", icon: "apartment", active: false },
  { label: "Payroll Rules", icon: "payments", active: true },
  { label: "Leave Policy", icon: "event_note", active: false },
  { label: "Attendance Rules", icon: "schedule", active: false },
  { label: "Statutory Rates", icon: "account_balance", active: false },
  { label: "Notifications", icon: "campaign", active: false },
  { label: "Security", icon: "security", active: false },
] as const;

const PAYROLL_RULES = {
  payCycle: "monthly",
  cutOffDay: 25,
  overtimeMultiplier: 1.5,
  roundingRule: "nearest",
};

export default async function AdminSettingsPage() {
  await requirePermission("company:write");

  return (
    <>
      <PageHeader title="Settings" />

      <div className="mx-auto flex max-w-6xl flex-col gap-gutter md:flex-row">
        {/* ───────────────────────────────── sub-nav ─────────────────── */}
        <div className="w-full flex-shrink-0 md:w-64">
          <div className="sticky top-24 rounded-card bg-surface-container-lowest p-4 shadow-ambient-1">
            <h2 className="mb-4 pl-3 font-table-header text-table-header uppercase text-on-surface-variant">
              Settings Menu
            </h2>
            <ul className="flex flex-col gap-1">
              {SECTIONS.map((section) => (
                <li key={section.label}>
                  <a
                    href="#"
                    className={
                      section.active
                        ? "flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 font-semibold text-primary transition-colors"
                        : "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                    }
                  >
                    <Icon name={section.icon} className={`text-lg ${section.active ? "text-primary" : "text-outline"}`} />
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ───────────────────────────────── active panel ─────────────────── */}
        <div className="flex flex-1 flex-col gap-gutter">
          <form id="payroll-rules-form" className="flex flex-1 flex-col rounded-card bg-surface-container-lowest p-card-padding shadow-ambient-1 transition-all hover:shadow-ambient-2">
            <div className="mb-8 border-b border-surface-variant pb-4">
              <h1 className="flex items-center gap-2 font-card-stat text-card-stat text-on-surface">
                <Icon name="manage_accounts" className="text-primary" />
                Payroll Rules
              </h1>
              <p className="mt-1 text-on-surface-variant">
                Configure automated calculations and processing cycles for employee compensation.
              </p>
            </div>

            <div className="mb-8 grid flex-1 grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-table-header text-table-header uppercase text-on-surface-variant" htmlFor="pay_cycle">
                  Pay Cycle
                </label>
                <div className="relative">
                  <select
                    id="pay_cycle"
                    name="payCycle"
                    defaultValue={PAYROLL_RULES.payCycle}
                    className="w-full appearance-none rounded-lg border border-outline-variant px-4 py-2.5 font-medium text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-table-header text-table-header uppercase text-on-surface-variant" htmlFor="cutoff_day">
                  Cut-off Day
                </label>
                <input
                  id="cutoff_day"
                  name="cutOffDay"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue={PAYROLL_RULES.cutOffDay}
                  className="w-full rounded-lg border border-outline-variant px-4 py-2.5 font-medium text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-table-header text-table-header uppercase text-on-surface-variant" htmlFor="ot_multiplier">
                  Overtime Multiplier
                </label>
                <input
                  id="ot_multiplier"
                  name="overtimeMultiplier"
                  type="number"
                  min={1}
                  step={0.1}
                  defaultValue={PAYROLL_RULES.overtimeMultiplier}
                  className="w-full rounded-lg border border-outline-variant px-4 py-2.5 font-medium text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-table-header text-table-header uppercase text-on-surface-variant" htmlFor="rounding_rule">
                  Rounding Rule
                </label>
                <div className="relative">
                  <select
                    id="rounding_rule"
                    name="roundingRule"
                    defaultValue={PAYROLL_RULES.roundingRule}
                    className="w-full appearance-none rounded-lg border border-outline-variant px-4 py-2.5 font-medium text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="nearest">Nearest KES</option>
                    <option value="up">Round Up</option>
                    <option value="down">Round Down</option>
                  </select>
                  <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant" />
                </div>
              </div>

              <div className="col-span-1 mt-4 flex flex-col gap-4 border-t border-surface-variant pt-6 md:col-span-2">
                <h3 className="mb-2 font-table-header text-table-header uppercase text-on-surface-variant">Automations</h3>

                <ToggleRow
                  name="autoRecoverAdvances"
                  label="Auto-recover salary advances from next run"
                  description="Automatically deduct outstanding advances during payroll generation."
                  defaultChecked
                />
                <ToggleRow
                  name="autoRecoverLoans"
                  label="Auto-recover loans"
                  description="Apply scheduled loan deductions automatically."
                  defaultChecked
                />
                <ToggleRow
                  name="emailPayslips"
                  label="Send payslips automatically via email"
                  description="Dispatch PDFs to verified employee email addresses upon approval."
                />
              </div>
            </div>

            <div className="mt-auto flex justify-end gap-3 border-t border-surface-variant pt-6">
              <button type="button" className="rounded-lg px-6 py-2.5 font-medium text-primary transition-colors hover:bg-primary/5">
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-primary"
              >
                <Icon name="save" className="text-sm" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="group -mx-3 flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-surface-container-low">
      <span className="flex flex-col">
        <span className="font-medium text-on-surface">{label}</span>
        <span className="mt-0.5 text-xs text-on-surface-variant">{description}</span>
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-surface-variant transition-colors after:absolute after:left-[2px] after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5" />
    </label>
  );
}