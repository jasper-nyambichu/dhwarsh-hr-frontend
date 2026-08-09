//src/app/(portal)/employee/leave/new/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";

/**
 * New leave request form.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * "Total Days" and "Projected Balance" are computed client-side from the
 * date pickers in the original design — kept as static placeholders here
 * since wiring that up needs a client component with real balance data.
 * Convert this to "use client" with useState once the balances API exists.
 * ─────────────────────────────────────────────────────────────────────────
 */

const CURRENT_ANNUAL_BALANCE_DAYS = 14;

const UPCOMING_HOLIDAYS = [
  { id: 1, month: "DEC", day: "25", name: "Christmas Day", note: "Public Holiday" },
  { id: 2, month: "JAN", day: "01", name: "New Year's Day", note: "Public Holiday" },
] as const;

export default async function NewLeaveRequestPage() {
  await requirePermission("leave:request");

  return (
    <>
      <PageHeader
        title="New Leave Request"
        description="Submit your time-off details for manager approval."
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── main form ─────────────────── */}
        <div className="col-span-12 lg:col-span-8">
          <form className="bento-shadow flex flex-col gap-6 rounded-card bg-surface-container-lowest p-card-padding">
            <div>
              <label htmlFor="leave-type" className="mb-2 block font-body-md text-body-md font-semibold text-on-surface">
                Leave Type <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  id="leave-type"
                  defaultValue=""
                  required
                  className="w-full cursor-pointer appearance-none rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                >
                  <option value="" disabled>
                    Select leave type
                  </option>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
                <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="from-date" className="mb-2 block font-body-md text-body-md font-semibold text-on-surface">
                  From Date <span className="text-error">*</span>
                </label>
                <input
                  id="from-date"
                  type="date"
                  required
                  className="w-full cursor-pointer rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                />
              </div>
              <div>
                <label htmlFor="to-date" className="mb-2 block font-body-md text-body-md font-semibold text-on-surface">
                  To Date <span className="text-error">*</span>
                </label>
                <input
                  id="to-date"
                  type="date"
                  required
                  className="w-full cursor-pointer rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-body-md text-body-md font-semibold text-on-surface">Total Days</label>
              <div className="flex items-center justify-between rounded-lg border border-surface-variant bg-surface-container-low px-4 py-3">
                <span className="font-body-md text-body-md text-on-surface-variant">Calculated working days</span>
                <span className="font-semibold text-primary">0 Days</span>
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="mb-2 block font-body-md text-body-md font-semibold text-on-surface">
                Reason <span className="text-error">*</span>
              </label>
              <textarea
                id="reason"
                rows={4}
                required
                placeholder="Please provide details for your request..."
                className="w-full resize-none rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
              />
            </div>

            <div>
              <label htmlFor="attachment" className="mb-2 block font-body-md text-body-md font-semibold text-on-surface">
                Attachment (Optional)
              </label>
              <label
                htmlFor="attachment"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant p-8 text-center transition-colors hover:border-primary hover:bg-surface-container-low"
              >
                <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-secondary-container text-primary-container">
                  <Icon name="cloud_upload" />
                </div>
                <p className="font-body-md text-body-md font-semibold text-on-surface">Click to upload or drag and drop</p>
                <p className="font-body-md text-xs text-outline">SVG, PNG, JPG or PDF (max. 5MB)</p>
                <input id="attachment" type="file" className="sr-only" accept=".svg,.png,.jpg,.jpeg,.pdf" />
              </label>
            </div>

            <div className="mt-2 flex justify-end gap-3 border-t border-surface-variant pt-4">
              <button
                type="button"
                className="rounded-lg border border-surface-variant px-6 py-2.5 font-semibold text-primary-container transition-colors hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-on-primary-fixed px-6 py-2.5 font-semibold text-on-primary transition-opacity hover:opacity-90"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* ────────────────────────────── side column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <div className="bento-shadow rounded-card bg-gradient-to-br from-surface-container-lowest to-surface-bright p-card-padding">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">
                <Icon name="account_balance_wallet" />
              </div>
              <h4 className="text-base font-semibold text-on-surface">Balance Preview</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-dashed border-surface-variant pb-4">
                <span className="font-body-md text-body-md text-on-surface-variant">Current Annual Balance</span>
                <span className="font-card-stat text-card-stat text-on-surface">
                  {CURRENT_ANNUAL_BALANCE_DAYS} <span className="text-sm font-normal text-outline">days</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-surface-variant pb-4">
                <span className="font-body-md text-body-md text-on-surface-variant">Requested Days</span>
                <span className="font-card-stat text-lg font-semibold text-error">
                  - 0 <span className="text-sm font-normal">days</span>
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-body-md text-body-md font-semibold text-on-surface">Projected Balance</span>
                <span className="font-card-stat text-card-stat text-primary-container">
                  {CURRENT_ANNUAL_BALANCE_DAYS} <span className="text-sm font-normal">days</span>
                </span>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-lg bg-secondary-fixed/50 p-3">
              <Icon name="info" className="mt-0.5 text-sm text-primary-container" />
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Leave balances are updated immediately upon manager approval. Unpaid leave does not affect this
                balance.
              </p>
            </div>
          </div>

          <BentoCard title="Upcoming Company Holidays">
            <ul className="space-y-3">
              {UPCOMING_HOLIDAYS.map((holiday, index) => (
                <li key={holiday.id} className={`flex items-center gap-3 ${index > 0 ? "border-t border-surface-variant pt-3" : ""}`}>
                  <div className="w-10 text-center">
                    <span className="block text-xs font-bold text-primary-container">{holiday.month}</span>
                    <span className="block text-lg font-bold text-on-surface">{holiday.day}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{holiday.name}</p>
                    <p className="text-xs text-on-surface-variant">{holiday.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </BentoCard>
        </div>
      </div>
    </>
  );
}