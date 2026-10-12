import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requireRole } from "@/app/lib/dal";
import { RequestDetails } from "@/components/features/employee/request-details";
import { RequestReviewPanel } from "@/components/features/employee/request-review-panel";
import { RequestStatusPill } from "@/components/features/employee/request-status-pill";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getEmployeeRequest } from "@/lib/api/employee-request";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EmployeeCreationRequestResponse } from "@/types/employee-request";

/**
 * One employee request, in full, with the decision controls beside it.
 *
 * Every value HR submitted is shown before the buttons, because approving writes
 * exactly these values — salary and statutory numbers included — into a new
 * employee record. Once a request is decided the controls give way to a summary
 * of who decided it and when.
 *
 * Layout: 8/4 split from `lg` up, with the Decision card sticky so it stays in
 * reach while the admin scrolls the details. Below `lg` the grid is one column
 * and the Decision card falls underneath the details; while the request is
 * pending a bar pinned to the bottom of the screen jumps straight to it, so the
 * decision is never a long scroll away on a phone.
 */
export default async function EmployeeRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const { id } = await params;
  const requestId = Number(id);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    notFound();
  }

  let request: EmployeeCreationRequestResponse;

  try {
    request = await getEmployeeRequest(requestId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isNotFound) notFound();
      if (error.isUnauthorized) throw error;

      return (
        <DataUnavailable
          title="Employee request"
          description="Review a new employee HR has asked to add."
          subject="This request"
          reason={error.message}
        />
      );
    }

    throw error;
  }

  const pending = request.status === "PENDING";

  return (
    <>
      <PageHeader
        title={
          <>
            <Link
              href="/admin/employee-requests"
              aria-label="Back to employee approvals"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-primary shadow-ambient-1 transition-colors hover:bg-primary hover:text-on-primary"
            >
              <Icon name="arrow_back" className="text-[20px]" />
            </Link>
            <span className="min-w-0 break-words">{request.details.fullName}</span>
          </>
        }
        description={`Request #${request.id} · submitted ${formatDateTime(request.requestedAt)} by ${request.requestedByName ?? "HR"}`}
        pill={<RequestStatusPill status={request.status} />}
      />

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <RequestDetails request={request} />
        </div>

        <div className="flex min-w-0 flex-col gap-gutter lg:col-span-4 lg:sticky lg:top-4">
          <BentoCard
            title={
              <span className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                  <Icon name="gavel" className="text-[20px]" />
                </span>
                <span className="text-[13px] font-bold uppercase tracking-wide">
                  Review &amp; decision
                </span>
              </span>
            }
            action={
              pending ? (
                <span className="rounded-full bg-primary-fixed/40 px-2 py-0.5 text-[10px] font-bold text-primary-container">
                  Admin action
                </span>
              ) : undefined
            }
            className={cn(
              "scroll-mt-4 border-2",
              pending
                ? "border-primary/20"
                : request.status === "APPROVED"
                  ? "border-tertiary-container/30"
                  : "border-error/30",
            )}
          >
            <div id="decision" className="scroll-mt-4">
              {pending ? (
                <>
                  <p className="mb-4 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                    Approving creates {request.details.fullName} as an employee
                    with the values shown here.
                  </p>

                  <div className="mb-4 space-y-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 text-[11px]">
                    <SummaryRow label="Requested by" value={request.requestedByName ?? "HR"} />
                    <SummaryRow label="Branch" value={request.branchName ?? "—"} />
                    <SummaryRow
                      label="Submitted"
                      value={formatDateTime(request.requestedAt)}
                    />
                  </div>

                  <RequestReviewPanel
                    requestId={request.id}
                    fullName={request.details.fullName}
                  />
                </>
              ) : (
                <Decided request={request} />
              )}
            </div>
          </BentoCard>

          <BentoCard title="Request history">
            <Timeline request={request} />
          </BentoCard>
        </div>
      </div>

      {pending ? (
        // `data-live-region` exempts this bar from the unwired-control net: the
        // link is a plain in-page anchor, which that net would otherwise treat
        // as a dead `href="#…"` and swallow.
        <div
          data-live-region
          className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-outline-variant/30 bg-surface-container-lowest px-4 py-3 shadow-[0_-4px_16px_rgba(11,42,69,0.08)] sm:-mx-6 sm:px-6 lg:hidden"
        >
          <a
            href="#decision"
            className={buttonVariants({ block: true, size: "lg" })}
          >
            <Icon name="gavel" className="text-[18px]" />
            Review &amp; decide
          </a>
        </div>
      ) : null}
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-outline">{label}</span>
      <span className="min-w-0 break-words text-right font-bold text-on-surface">
        {value}
      </span>
    </div>
  );
}

function Decided({ request }: { request: EmployeeCreationRequestResponse }) {
  const approved = request.status === "APPROVED";

  return (
    <div className="flex flex-col gap-3 font-body-md text-body-md">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          approved
            ? "bg-tertiary-container/15 text-tertiary"
            : "bg-error-container text-error",
        )}
      >
        <Icon
          name={approved ? "check_circle" : "cancel"}
          filled
          className="text-[24px]"
        />
      </span>

      <div>
        <p className="text-[13px] font-bold uppercase tracking-wide text-on-surface">
          {approved ? "Request approved" : "Request rejected"}
        </p>
        <p className="mt-1 text-on-surface-variant">
          {approved ? "Approved" : "Rejected"}
          {request.reviewedByName ? ` by ${request.reviewedByName}` : ""} on{" "}
          {formatDateTime(request.reviewedAt)}.
        </p>
      </div>

      {approved ? (
        <div className="space-y-2 rounded-xl border border-tertiary-container/30 bg-tertiary-container/10 p-3 text-[11px]">
          <SummaryRow
            label="Employee record"
            value={
              request.createdEmployeeId !== null
                ? `#${request.createdEmployeeId}`
                : "—"
            }
          />
          <SummaryRow label="Created from" value={`Request #${request.id}`} />
        </div>
      ) : (
        <div className="rounded-xl border border-error/20 bg-error-container/30 p-3">
          <p className="font-table-header text-table-header uppercase text-error">
            Reason given to HR
          </p>
          <p className="mt-1 border-l-2 border-error pl-2.5 italic text-on-surface">
            {request.rejectionReason ?? "—"}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * What has happened to this request, from timestamps the API already returns.
 * Nothing here is inferred — a step appears only if its data does.
 */
function Timeline({ request }: { request: EmployeeCreationRequestResponse }) {
  const decided = request.status !== "PENDING";

  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-0.5 before:bg-outline-variant/30">
      <TimelineStep
        dot="bg-primary"
        title="Request submitted"
        detail={`${formatDateTime(request.requestedAt)} · ${request.requestedByName ?? "HR"}`}
      />

      {decided ? (
        <TimelineStep
          dot={request.status === "APPROVED" ? "bg-green-main" : "bg-error"}
          title={
            request.status === "APPROVED"
              ? "Approved — employee created"
              : "Rejected"
          }
          detail={`${formatDateTime(request.reviewedAt)}${
            request.reviewedByName ? ` · ${request.reviewedByName}` : ""
          }`}
        />
      ) : (
        <TimelineStep
          dot="bg-amber-main"
          title="Awaiting admin review"
          detail="Nobody has approved or rejected this yet."
        />
      )}
    </ol>
  );
}

function TimelineStep({
  dot,
  title,
  detail,
}: {
  dot: string;
  title: string;
  detail: string;
}) {
  return (
    <li className="relative pl-6">
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0.5 block size-4 rounded-full ring-4 ring-surface-container-lowest",
          dot,
        )}
      />
      <p className="font-body-md text-body-md font-bold text-on-surface">{title}</p>
      <p className="font-body-md text-[11px] text-on-surface-variant">{detail}</p>
    </li>
  );
}