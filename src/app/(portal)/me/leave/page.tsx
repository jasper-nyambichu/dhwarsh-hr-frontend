//src/app/(portal)/employee/leave/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";

/**
 * Employee leave management overview (balances + request history).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.LeaveBalance` and
 * `types.LeaveRequest`. Balance rings render used/remaining as a simple SVG
 * arc rather than the shared DonutChart, since these need a compact inline
 * layout the donut component's fixed sizing wasn't built for — confirm
 * DonutChart's API and I can switch these over if it supports a size prop.
 * ─────────────────────────────────────────────────────────────────────────
 */

type LeaveBalance = {
  id: number;
  label: string;
  used: number;
  total: number;
  icon: string;
  ringColorClassName: string;
  valueColorClassName: string;
};

type LeaveRequestRow = {
  id: number;
  type: string;
  icon: string;
  iconBgClassName: string;
  iconColorClassName: string;
  from: string;
  to: string;
  days: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
};

type Holiday = { id: number; month: string; day: string; name: string; note: string; muted?: boolean };

const BALANCES: readonly LeaveBalance[] = [
  { id: 1, label: "Annual Leave", used: 12, total: 21, icon: "flight_takeoff", ringColorClassName: "text-primary", valueColorClassName: "text-primary" },
  { id: 2, label: "Sick Leave", used: 10, total: 14, icon: "medical_services", ringColorClassName: "text-emerald-500", valueColorClassName: "text-emerald-600" },
  { id: 3, label: "Compassionate", used: 5, total: 5, icon: "volunteer_activism", ringColorClassName: "text-orange-400", valueColorClassName: "text-orange-500" },
];

const REQUESTS: readonly LeaveRequestRow[] = [
  { id: 1, type: "Annual Leave", icon: "flight_takeoff", iconBgClassName: "bg-primary/10", iconColorClassName: "text-primary", from: "Oct 12, 2023", to: "Oct 15, 2023", days: 4, status: "APPROVED" },
  { id: 2, type: "Sick Leave", icon: "medical_services", iconBgClassName: "bg-emerald-100", iconColorClassName: "text-emerald-600", from: "Sep 01, 2023", to: "Sep 02, 2023", days: 2, status: "APPROVED" },
  { id: 3, type: "Annual Leave", icon: "flight_takeoff", iconBgClassName: "bg-primary/10", iconColorClassName: "text-primary", from: "Dec 20, 2023", to: "Jan 02, 2024", days: 10, status: "PENDING" },
];

const HOLIDAYS: readonly Holiday[] = [
  { id: 1, month: "Oct", day: "20", name: "Mashujaa Day", note: "Friday - Long weekend potential" },
  { id: 2, month: "Dec", day: "12", name: "Jamhuri Day", note: "Tuesday" },
  { id: 3, month: "Dec", day: "25", name: "Christmas Day", note: "Monday", muted: true },
];

const STATUS_BADGE: Record<LeaveRequestRow["status"], string> = {
  APPROVED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-orange-100 text-orange-800",
  REJECTED: "bg-error-container text-on-error-container",
};

function circumferenceOffset(used: number, total: number) {
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return `${percent}, 100`;
}

export default async function EmployeeLeavePage() {
  await requirePermission("leave:read:self");

  return (
    <>
      <PageHeader
        title="Leave Management"
        description="View balances and request time off"
        actions={
          <Link
            href="/me/leave/new"
            className="flex items-center gap-2 rounded-lg bg-[#0B2A45] px-6 py-2.5 font-body-md font-bold text-white shadow-sm transition-colors hover:bg-[#154673]"
          >
            <Icon name="add" className="text-sm" />
            Request Leave
          </Link>
        }
      />

      {/* ─────────────────────────────── balance cards ─────────────────── */}
      <div className="mb-gutter grid grid-cols-1 gap-gutter md:grid-cols-3">
        {BALANCES.map((balance) => (
          <BentoCard key={balance.id} flush>
            <div className="flex items-center justify-between p-card-padding">
              <div>
                <h3 className="mb-2 font-table-header text-table-header uppercase text-on-surface-variant">{balance.label}</h3>
                <div className={`mb-1 font-card-stat text-card-stat ${balance.valueColorClassName}`}>
                  {balance.used} <span className="text-sm font-normal text-on-surface-variant">/ {balance.total} Days</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Remaining balance</p>
              </div>
              <div className="relative size-20">
                <svg viewBox="0 0 36 36" className={`block max-h-[250px] max-w-full ${balance.ringColorClassName}`}>
                  <path
                    className="fill-none stroke-[#eee]"
                    strokeWidth={3.8}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="fill-none stroke-current"
                    strokeWidth={2.8}
                    strokeLinecap="round"
                    strokeDasharray={circumferenceOffset(balance.used, balance.total)}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name={balance.icon} className={`text-xl ${balance.valueColorClassName}`} />
                </div>
              </div>
            </div>
          </BentoCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ─────────────────────────────── main column ───────────────── */}
        <div className="lg:col-span-8">
          <BentoCard
            title="Request History"
            flush
            action={
              <Link href="/me/leave/history" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View All
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-variant bg-surface-bright">
                    <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Type</th>
                    <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">From</th>
                    <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">To</th>
                    <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Days</th>
                    <th className="px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {REQUESTS.map((request) => (
                    <tr key={request.id} className="border-b border-surface-variant transition-colors last:border-0 hover:bg-surface-bright">
                      <td className="px-6 py-4 font-body-md text-body-md font-medium text-on-surface">
                        {/* Flex on a wrapper, not the <td> — a flex cell drops
                            out of the table layout and desyncs from its
                            header. */}
                        <div className="flex items-center gap-2">
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${request.iconBgClassName} ${request.iconColorClassName}`}>
                            <Icon name={request.icon} className="text-[16px]" />
                          </div>
                          <span className="min-w-0 truncate">{request.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">{request.from}</td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">{request.to}</td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">{request.days}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[request.status]}`}>
                          {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <div className="rounded-card bg-gradient-to-br from-primary to-primary-container p-card-padding text-white">
            <h3 className="mb-2 font-page-title text-page-title">Leave Policy Update</h3>
            <p className="mb-4 font-body-md text-sm text-white/80">
              Please review the updated corporate leave policy for 2024 regarding carry-over days.
            </p>
            <button className="flex w-fit items-center gap-2 rounded-md bg-white/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/30">
              Read Document
              <Icon name="open_in_new" className="text-sm" />
            </button>
          </div>

          <BentoCard title="Upcoming Public Holidays">
            <div className="space-y-4">
              {HOLIDAYS.map((holiday, index) => (
                <div
                  key={holiday.id}
                  className={`flex items-start gap-4 ${index > 0 ? "border-t border-surface-variant pt-4" : ""} ${holiday.muted ? "opacity-50" : ""}`}
                >
                  <div className="min-w-[50px] rounded-lg bg-surface-container-high p-2 text-center">
                    <div className="text-[10px] font-bold uppercase text-on-surface-variant">{holiday.month}</div>
                    <div className="text-lg font-bold text-primary">{holiday.day}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">{holiday.name}</h4>
                    <p className="text-xs text-on-surface-variant">{holiday.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}