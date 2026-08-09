import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatMoney } from "@/lib/format";

/**
 * Advance request detail.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no shared `Advance` type yet (see /payroll/advances
 * note). Approve/Reject buttons are not wired to any endpoint yet.
 * ─────────────────────────────────────────────────────────────────────────
 */

const REQUEST = {
  code: "ADV-2026-089",
  employeeName: "David Omondi",
  employeeCode: "ENG-402",
  department: "Engineering",
  dateJoined: "2024-01-15",
  currentNetPay: 120_500,
  amount: 45_000,
  reason: "Medical Emergency - Urgent surgery for family member.",
  recoveryMonth: "September 2026",
  recoveryAmount: 45_000,
  requestedDate: "2026-08-12",
  reviewedDate: "2026-08-13",
};

const TIMELINE: readonly {
  label: string;
  date: string;
  done: boolean;
  current?: boolean;
}[] = [
  { label: "Requested", date: REQUEST.requestedDate, done: true },
  { label: "Reviewed", date: REQUEST.reviewedDate, done: true },
  { label: "Pending Finance", date: "Current Step", done: false, current: true },
];

export default async function AdvanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Gated as `loan:approve` until the backend exposes an employee-advance
  // module — see the list page for why. Keeps approve stricter than read.
  await requirePermission("loan:approve");
  const { id } = await params;
  const request = REQUEST; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <button type="button" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high">
              <Icon name="arrow_back" />
            </button>
            <span>
              <span className="block">{`Advance Request - ${request.employeeName}`}</span>
              <span className="block font-body-md text-body-md font-medium text-on-surface-variant">
                Request #{request.code}
              </span>
            </span>
          </span>
        }
        actions={
          <span className="rounded-full border border-secondary-container bg-secondary-container px-3 py-1 font-body-md text-body-md font-medium text-on-secondary-container">
            Finance Officer
          </span>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard title="Approval Workflow">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 z-0 h-1 w-full -translate-y-1/2 bg-surface-container-highest" />
              <div className="absolute left-0 top-1/2 z-0 h-1 w-2/3 -translate-y-1/2 bg-primary" />
              {TIMELINE.map((step) => (
                <div key={step.label} className="relative z-10 flex flex-col items-center gap-2">
                  <span
                    className={
                      step.done
                        ? "flex size-8 items-center justify-center rounded-full bg-primary font-bold text-on-primary"
                        : "flex size-8 items-center justify-center rounded-full border-2 border-primary bg-surface-container-lowest font-bold text-primary"
                    }
                  >
                    {step.done ? (
                      <Icon name="check" className="text-sm" />
                    ) : (
                      <Icon name="schedule" className="animate-pulse text-sm" />
                    )}
                  </span>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${step.current ? "text-primary" : "text-on-surface"}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {step.done ? formatDate(step.date) : step.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <BentoCard
              title="Request Details"
              action={
                <span className="rounded-lg bg-secondary-container/30 p-2 text-primary">
                  <Icon name="description" />
                </span>
              }
            >
              <div className="mb-4">
                <p className="mb-1 font-table-header text-table-header uppercase text-on-surface-variant">
                  Reason for Advance
                </p>
                <p className="rounded-lg border border-surface-variant bg-surface-container-low p-3 font-medium leading-relaxed text-on-surface">
                  {request.reason}
                </p>
              </div>
              <div>
                <p className="mb-1 font-table-header text-table-header uppercase text-on-surface-variant">
                  Requested Amount
                </p>
                <p className="font-card-stat text-card-stat text-primary">{formatMoney(request.amount)}</p>
              </div>
            </BentoCard>

            <BentoCard
              title="Recovery Plan"
              action={
                <span className="rounded-lg bg-tertiary-container/10 p-2 text-tertiary-container">
                  <Icon name="event_repeat" />
                </span>
              }
              className="border-l-4 border-l-tertiary-container"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border border-surface-variant bg-surface-container-low p-3">
                  <span className="flex items-center gap-3">
                    <Icon name="calendar_month" className="text-on-surface-variant" />
                    <span>
                      <span className="block text-sm font-semibold text-on-surface">Recovery Month</span>
                      <span className="block text-xs text-on-surface-variant">Scheduled Deduction</span>
                    </span>
                  </span>
                  <span className="font-bold text-on-surface">{request.recoveryMonth}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-surface-variant bg-surface-container-low p-3">
                  <span className="flex items-center gap-3">
                    <Icon name="payments" className="text-on-surface-variant" />
                    <span>
                      <span className="block text-sm font-semibold text-on-surface">Recovery Amount</span>
                      <span className="block text-xs text-on-surface-variant">One-time deduction</span>
                    </span>
                  </span>
                  <span className="font-bold text-on-surface">{formatMoney(request.recoveryAmount)}</span>
                </div>
              </div>
            </BentoCard>
          </div>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title={null} className="flex flex-col gap-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-on-primary-fixed-variant px-4 py-3 font-bold text-on-primary transition-colors hover:bg-primary"
            >
              <Icon name="check_circle" />
              Approve Request
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-error/20 bg-error-container/30 px-4 py-3 font-bold text-error transition-colors hover:bg-error-container"
            >
              <Icon name="cancel" />
              Reject Request
            </button>
          </BentoCard>

          <BentoCard title="Employee Profile">
            <div className="mb-6 flex items-center gap-4">
              <span
                aria-hidden
                className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface-variant bg-secondary-container text-lg font-bold text-primary"
              >
                {request.employeeName.split(" ").map((n) => n[0]).join("")}
              </span>
              <div>
                <h3 className="text-lg font-bold text-on-surface">{request.employeeName}</h3>
                <p className="flex items-center gap-1 text-sm text-on-surface-variant">
                  <Icon name="badge" className="text-[16px]" />
                  {request.employeeCode}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/30 py-2">
                <span className="text-sm font-medium text-on-surface-variant">Department</span>
                <span className="text-sm font-semibold text-on-surface">{request.department}</span>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant/30 py-2">
                <span className="text-sm font-medium text-on-surface-variant">Date Joined</span>
                <span className="text-sm font-semibold text-on-surface">{formatDate(request.dateJoined)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-on-surface-variant">Current Net Pay</span>
                <span className="font-bold text-primary">{formatMoney(request.currentNetPay)}</span>
              </div>
            </div>
          </BentoCard>

          <div className="flex items-start gap-3 rounded-card border border-secondary-container/40 bg-secondary-container/20 p-4">
            <Icon name="info" className="mt-0.5 text-secondary" />
            <div>
              <h4 className="mb-1 text-sm font-bold text-secondary">Advance Policy Reminder</h4>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Employees are eligible for a salary advance up to 50% of their net pay. The requested amount of{" "}
                {formatMoney(request.amount)} is within the permissible limit for this employee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}