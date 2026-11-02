import Link from "next/link";

import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate, humanizeEnum } from "@/lib/format";
import type { StaffRequestResponse, StaffRequestStatus } from "@/types/staff";

const STATUS_STYLE: Record<StaffRequestStatus, { label: string; chip: string }> = {
  PENDING: { label: "Waiting for Administrator", chip: "bg-surface-container-low text-on-surface-variant" },
  APPROVED: { label: "Approved", chip: "bg-primary/10 text-primary" },
  REJECTED: { label: "Rejected", chip: "bg-error/10 text-error" },
};

function placement(request: StaffRequestResponse): string {
  return [request.branchName, request.departmentName, request.agentName ? `Agent: ${request.agentName}` : null]
    .filter(Boolean)
    .join(" • ");
}

function Step({ done, current, label }: { done?: boolean; current?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 sm:flex-col sm:gap-1 sm:text-center">
      <span
        aria-hidden="true"
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          done
            ? "bg-primary text-on-primary"
            : current
              ? "border-2 border-primary text-primary"
              : "border border-outline-variant text-outline"
        }`}
      >
        {done ? "✓" : current ? "•" : ""}
      </span>
      <span className={`text-xs ${done || current ? "font-medium text-on-surface" : "text-outline"}`}>{label}</span>
    </li>
  );
}

function StatusChip({ status }: { status: StaffRequestStatus }) {
  const style = STATUS_STYLE[status];
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${style.chip}`}>{style.label}</span>;
}

/**
 * "My requests" for a Branch Manager or an Agent, shared by both portals.
 *
 * `sent` is true when the person has just submitted an employee: a clear confirmation is shown
 * first, with what happens next and a button to add another.
 */
export function StaffRequestsView({
  requests,
  basePath,
  addHref,
  sent,
  title = "My requests",
  description = "Employees you have asked the Administrator to add. Nothing is added until the Administrator approves.",
}: {
  requests: StaffRequestResponse[];
  basePath: string;
  addHref: string;
  sent: boolean;
  title?: string;
  description?: string;
}) {
  const sorted = [...requests].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const latest = sorted[0];

  const counts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
      />

      {sent ? (
        <section
          role="status"
          aria-live="polite"
          className="mb-6 rounded-card border border-primary/30 bg-primary/10 p-4 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="material-symbols-outlined text-3xl text-primary">
              check_circle
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-on-surface">Request sent successfully</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {latest ? (
                  <>
                    Your request to add <strong className="text-on-surface">{latest.details.fullName}</strong> has been
                    sent to the Administrator for approval.
                  </>
                ) : (
                  "Your request has been sent to the Administrator for approval."
                )}{" "}
                You will get a notification as soon as it is approved or rejected.
              </p>
            </div>
          </div>

          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            <Step done label="Request sent" />
            <Step current label="Administrator reviews" />
            <Step label="Employee is added" />
          </ol>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href={addHref}
              className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container"
            >
              Add another employee
            </Link>
            <Link
              href={basePath}
              className="flex min-h-11 items-center justify-center rounded-lg border border-outline-variant px-5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
            >
              Dismiss
            </Link>
          </div>
        </section>
      ) : null}

      <div className="mb-4 grid grid-cols-3 gap-3">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <div key={status} className="rounded-card bg-surface-container-lowest p-3 text-center shadow-ambient-1">
            <p className="text-2xl font-bold tabular-nums text-on-surface">{counts[status]}</p>
            <p className="text-xs text-on-surface-variant">{humanizeEnum(status)}</p>
          </div>
        ))}
      </div>

      <BentoCard title="Requests" subtitle={`${requests.length} submitted`}>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <EmptyState
              symbol="pending_actions"
              title="No requests yet"
              description="When you add an employee, the request appears here with the Administrator's decision."
            />
            <Link
              href={addHref}
              className="flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container"
            >
              Add an employee
            </Link>
          </div>
        ) : (
          <>
            {/* Phones and small tablets: one card per request */}
            <ul className="flex flex-col gap-3 md:hidden">
              {sorted.map((request) => (
                <li key={request.id} className="rounded-lg border border-outline-variant/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-on-surface">{request.details.fullName}</p>
                      <p className="text-xs text-on-surface-variant">
                        {[request.details.position, humanizeEnum(request.details.employmentType)]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <StatusChip status={request.status} />
                  </div>
                  {placement(request) ? <p className="mt-2 text-xs text-on-surface-variant">{placement(request)}</p> : null}
                  <p className="mt-1 text-xs text-outline">Sent {formatDate(request.requestedAt.slice(0, 10))}</p>
                  {request.status === "REJECTED" && request.rejectionReason ? (
                    <p className="mt-2 rounded-lg bg-error/10 p-2 text-xs text-error">
                      Reason: {request.rejectionReason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>

            {/* Tablets and desktops: a table */}
            <div className="hidden w-full overflow-x-auto md:block">
              <table className="data-table w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Placement</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Sent</th>
                    <th className="pb-3 pr-2 font-table-header text-table-header uppercase text-outline">Decision</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {sorted.map((request) => (
                    <tr key={request.id} className="border-b border-outline-variant/20 align-top last:border-0">
                      <td className="py-3 pl-2">
                        <span className="block font-semibold">{request.details.fullName}</span>
                        <span className="block text-xs text-on-surface-variant">
                          {[request.details.position, humanizeEnum(request.details.employmentType)]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      </td>
                      <td className="py-3 text-on-surface-variant">{placement(request) || "—"}</td>
                      <td className="py-3 text-on-surface-variant">{formatDate(request.requestedAt.slice(0, 10))}</td>
                      <td className="py-3 pr-2">
                        <StatusChip status={request.status} />
                        {request.status === "REJECTED" && request.rejectionReason ? (
                          <span className="mt-1 block max-w-xs text-xs text-error">Reason: {request.rejectionReason}</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </BentoCard>
    </>
  );
}