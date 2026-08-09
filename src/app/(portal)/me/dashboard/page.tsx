import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BentoCard } from "@/components/shared/bento-card";
import { ProgressRows } from "@/components/shared/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";

/**
 * Employee self-service dashboard.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/dashboard/me` endpoint yet. Replace with
 * `await api.get<MeDashboard>("/dashboard/me")` when it lands.
 * ─────────────────────────────────────────────────────────────────────────
 */

const KPI = {
  leaveBalanceDays: 12,
  netPayJul: 68_400,
  loanBalance: 24_000,
} as const;

/** Daily attendance status over the last 14 days, oldest first. */
const ATTENDANCE_14D = [
  { day: 1, status: "present" as const },
  { day: 2, status: "present" as const },
  { day: 3, status: "present" as const },
  { day: 4, status: "present" as const },
  { day: 5, status: "late" as const },
  { day: 6, status: "present" as const },
  { day: 7, status: "absent" as const },
];
const ATTENDANCE_COLOR: Record<(typeof ATTENDANCE_14D)[number]["status"], string> = {
  present: "bg-primary/20",
  late: "bg-error/40",
  absent: "bg-surface-variant",
};

const LEAVE_ENTITLEMENT = [
  { label: "Annual Leave", value: 57, color: "var(--color-primary)" },
  { label: "Sick Leave", value: 14, color: "var(--color-tertiary-container)" },
  { label: "Study Leave", value: 0, color: "var(--color-secondary)" },
] as const;

const RECENT_PAYSLIPS = [
  { id: 1, period: "July 2026", gross: 85_000, deductions: 16_600, net: 68_400 },
  { id: 2, period: "June 2026", gross: 85_000, deductions: 16_600, net: 68_400 },
  { id: 3, period: "May 2026", gross: 85_000, deductions: 16_600, net: 68_400 },
];

const MY_DOCUMENTS = [
  { id: 1, name: "Employment Contract", note: "Valid till 2027", icon: "picture_as_pdf" },
  { id: 2, name: "SHIF Card", note: "Active", icon: "health_and_safety" },
  { id: 3, name: "KRA Pin Certificate", note: "No Expiry", icon: "account_balance" },
  { id: 4, name: "National ID Copy", note: "Verified", icon: "badge" },
] as const;

export default async function MeDashboardPage() {
  await requirePermission("attendance:read:self");

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard
            label="Leave Balance"
            value={`${KPI.leaveBalanceDays} Days`}
            icon="event_available"
            tone="primary"
          />
          <MetricCard label="Net Pay (Jul)" value={formatMoney(KPI.netPayJul)} icon="account_balance_wallet" tone="tertiary" />
          <MetricCard label="Loan Balance" value={formatMoney(KPI.loanBalance)} icon="credit_score" tone="error" />
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <BentoCard title="My Attendance" subtitle="Last 14 days" className="flex h-56 flex-col">
            <div className="flex flex-1 items-end justify-between gap-2 rounded-lg bg-surface-container-low/50 p-2">
              {ATTENDANCE_14D.map((d) => (
                <div
                  key={d.day}
                  className={`h-full w-full rounded-t-sm ${ATTENDANCE_COLOR[d.status]}`}
                  style={{ height: d.status === "absent" ? "20%" : d.status === "late" ? "50%" : "85%" }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-center gap-4 font-body-md text-[10px] text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-primary/20" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-error/40" /> Late
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-surface-variant" /> Absent
              </span>
            </div>
          </BentoCard>

          <BentoCard title="Leave Used vs Entitlement" className="flex h-56 flex-col" bodyClassName="flex flex-1 flex-col justify-center">
            <ProgressRows rows={LEAVE_ENTITLEMENT} className="flex-1" />
          </BentoCard>
        </div>

        <BentoCard
          title="Recent Payslips"
          action={
            <Link href="/me/payslips" className="text-[10px] text-primary-container hover:underline">
              View All
            </Link>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Period</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Gross</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Deductions</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Net</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Download</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {RECENT_PAYSLIPS.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pl-2 font-medium text-on-surface">{p.period}</td>
                    <td className="py-3 text-right tabular-nums text-on-surface-variant">{formatMoney(p.gross)}</td>
                    <td className="py-3 text-right tabular-nums text-on-surface-variant">{formatMoney(p.deductions)}</td>
                    <td className="py-3 text-right font-bold tabular-nums text-on-surface">{formatMoney(p.net)}</td>
                    <td className="py-3 pr-2 text-right">
                      <Link href={`/me/payslips/${p.id}`} className="text-primary hover:text-primary-container">
                        <Icon name="download" className="text-[18px]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* ──────────────────────────────── side column ──────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-4">
        <BentoCard className="flex flex-col items-center py-6 text-center">
          <span className="font-body-md text-body-md text-on-surface-variant">Current Time</span>
          <span className="mt-1 font-page-title text-[36px] leading-none text-primary">08:42 AM</span>
          <span className="mt-3 rounded-full bg-surface-container px-3 py-1 font-body-md text-[10px] text-on-surface-variant">
            Shift: 08:00 – 17:00
          </span>
          <button
            type="button"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-on-primary-fixed-variant px-6 py-3 font-body-md text-body-md font-bold text-on-primary transition-colors hover:bg-primary"
          >
            <Icon name="fingerprint" className="text-[18px]" />
            Clock In
          </button>
        </BentoCard>

        <AlertSpotlight
          eyebrow="Reminder"
          title="Contract renews in 21 days"
          message="Please review HR guidelines for renewal."
          cta="Review Contract"
          href="/me/documents"
        />

        <BentoCard title="My Documents">
          <ul className="flex flex-col gap-1">
            {MY_DOCUMENTS.map((doc) => (
              <li key={doc.id}>
                <Link
                  href="/me/documents"
                  className="group -mx-2 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-container-low"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary-fixed text-primary">
                    <Icon name={doc.icon} className="text-[16px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body-md text-body-md font-medium text-on-surface group-hover:text-primary-container">
                      {doc.name}
                    </span>
                    <span className="block text-[10px] text-on-surface-variant">{doc.note}</span>
                  </span>
                  <Icon name="chevron_right" className="text-outline-variant transition-colors group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </BentoCard>
      </div>
    </div>
  );
}