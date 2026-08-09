import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate, initials } from "@/lib/format";
import type { LeaveRequest } from "@/types";

/**
 * Leave request detail — approval timeline.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.LeaveRequest`. Swap for
 * `await api.get<LeaveRequest>(`/leave/${id}`)`. Approve/Reject buttons are
 * not yet wired to `PUT /leave/{id}/approve-by-hr` / `.../reject`.
 * ─────────────────────────────────────────────────────────────────────────
 */

const REQUEST: LeaveRequest & { requestedDate: string; managerApprovedDate: string } = {
  id: 1,
  employeeId: 101,
  employeeName: "Amina Yusuf",
  leaveTypeId: 1,
  leaveTypeName: "Annual Leave",
  startDate: "2026-10-12",
  endDate: "2026-10-16",
  days: 5,
  reason: "Family engagement in Mombasa requiring travel and a few days off work.",
  status: "PENDING_HR",
  approvedByManagerId: 22,
  approvedByHrId: null,
  rejectionReason: null,
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
  requestedDate: "2026-10-01",
  managerApprovedDate: "2026-10-02",
};

export default async function LeaveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("leave:approve:hr");
  const { id } = await params;
  const req = REQUEST; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link href="/hr/leave" className="text-on-surface-variant hover:text-primary">
              <Icon name="chevron_left" />
            </Link>
            {`Leave Request — ${req.employeeName}`}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter md:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="timeline" className="text-primary" />
                Approval Timeline
              </span>
            }
          >
            <div className="relative flex flex-col gap-8 py-2 pl-2">
              <TimelineStep
                icon="check"
                iconTone="bg-tertiary text-on-tertiary"
                title="Requested"
                detail={`Submitted by ${req.employeeName} on ${formatDate(req.requestedDate)}`}
                connector
              />
              <TimelineStep
                icon="check"
                iconTone="bg-tertiary text-on-tertiary"
                title="Manager Approval"
                detail={`Approved on ${formatDate(req.managerApprovedDate)}`}
                connector
              />
              <TimelineStep
                icon="hourglass_empty"
                iconTone="bg-amber-main text-on-primary animate-pulse"
                title="HR Approval"
                titleTone="text-amber-main"
                detail="Pending your review"
                highlighted
                connector
              />
              <TimelineStep
                icon={null}
                iconTone="border-2 border-outline-variant bg-surface"
                title="Outcome"
                titleTone="text-outline"
                detail="Awaiting final decision"
                muted
              />
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="description" className="text-primary" />
                Request Details
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-xl border border-surface-variant bg-surface-container-low p-4">
                <span className="mb-1 block font-table-header text-table-header uppercase text-on-surface-variant">
                  Leave Type
                </span>
                <span className="flex items-center gap-2 font-body-md text-[14px] font-bold text-primary">
                  <span className="size-2 rounded-full bg-primary" />
                  {req.leaveTypeName}
                </span>
              </div>
              <div className="rounded-xl border border-surface-variant bg-surface-container-low p-4">
                <span className="mb-1 block font-table-header text-table-header uppercase text-on-surface-variant">
                  Duration
                </span>
                <span className="font-body-md text-[14px] font-bold text-on-surface">{req.days} Days</span>
              </div>
              <div className="col-span-2 rounded-xl border border-surface-variant bg-surface-container-low p-4">
                <span className="mb-1 block font-table-header text-table-header uppercase text-on-surface-variant">
                  Dates
                </span>
                <span className="flex items-center gap-2 font-body-md text-[14px] font-bold text-on-surface">
                  <Icon name="event" className="text-[18px] text-on-surface-variant" />
                  {formatDate(req.startDate)} – {formatDate(req.endDate)}
                </span>
              </div>
              <div className="col-span-2 rounded-xl border border-surface-variant bg-surface-container-low p-4">
                <span className="mb-2 block font-table-header text-table-header uppercase text-on-surface-variant">
                  Reason
                </span>
                <p className="font-body-md text-body-md leading-relaxed text-on-surface">{req.reason}</p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter md:col-span-4">
          <BentoCard title={null} className="flex flex-col items-center text-center">
            <span
              aria-hidden
              className="mb-4 flex size-20 items-center justify-center rounded-full border-4 border-surface-container-lowest bg-primary-container text-2xl font-bold text-on-primary-container shadow-sm"
            >
              {initials(req.employeeName ?? "?")}
            </span>
            <h3 className="text-[18px] font-bold text-on-surface">{req.employeeName}</h3>
            <p className="mb-4 font-body-md text-body-md text-on-surface-variant">Senior UX Designer</p>
            <div className="flex w-full justify-between rounded-lg border border-surface-variant bg-surface-container-low px-4 py-3">
              <div className="text-left">
                <span className="block font-table-header text-table-header uppercase text-on-surface-variant">
                  Balance
                </span>
                <span className="font-body-md text-[14px] font-bold text-tertiary">14 Days</span>
              </div>
              <div className="text-right">
                <span className="block font-table-header text-table-header uppercase text-on-surface-variant">
                  Used
                </span>
                <span className="font-body-md text-[14px] font-bold text-on-surface">7 Days</span>
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="handshake" className="text-secondary" />
                Coverage Plan
              </span>
            }
          >
            <div className="flex items-start gap-3 rounded-lg bg-inverse-on-surface p-3">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[12px] font-bold text-secondary"
              >
                JM
              </span>
              <div>
                <h4 className="font-body-md text-body-md font-bold text-on-surface">John Mutua</h4>
                <p className="mb-2 font-table-header text-table-header text-secondary">Team Lead</p>
                <p className="text-[11px] leading-tight text-on-surface-variant">
                  Will handle critical project approvals and client communications during this period.
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard title="HR Decision" className="bg-surface-container-lowest text-center">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-body-md text-[14px] font-bold text-on-primary shadow-md transition-colors hover:bg-on-primary-fixed-variant"
              >
                <Icon name="thumb_up" className="text-[18px]" />
                Approve Request
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-error px-4 py-3 font-body-md text-[14px] font-bold text-error transition-colors hover:bg-error-container/50"
              >
                <Icon name="block" className="text-[18px]" />
                Reject Request
              </button>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function TimelineStep({
  icon,
  iconTone,
  title,
  titleTone,
  detail,
  connector,
  highlighted,
  muted,
}: {
  icon: string | null;
  iconTone: string;
  title: string;
  titleTone?: string;
  detail: string;
  connector?: boolean;
  highlighted?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`relative z-10 flex items-start gap-4 ${muted ? "opacity-50" : ""}`}>
      {connector && (
        <span className="absolute left-[11px] top-6 -z-10 h-[calc(100%+8px)] w-0.5 bg-surface-container-high" />
      )}
      <span className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
        {icon && <Icon name={icon} className="text-[16px]" />}
      </span>
      {highlighted ? (
        <div className="ml-2 flex-1 rounded-lg border border-amber-main/20 bg-surface-container-low p-3">
          <h3 className={`font-body-md text-body-md font-bold ${titleTone ?? "text-on-surface"}`}>{title}</h3>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{detail}</p>
        </div>
      ) : (
        <div>
          <h3 className={`font-body-md text-body-md font-bold ${titleTone ?? "text-on-surface"}`}>{title}</h3>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{detail}</p>
        </div>
      )}
    </div>
  );
}