import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getPendingHrApprovals } from "@/lib/api/leave";
import { formatDate, formatNumber } from "@/lib/format";
import type { LeaveRequestResponse } from "@/types";

import { LeaveDecision } from "./_components/leave-decision";

/**
 * HR's leave approval queue.
 *
 * The only company-wide leave view the API offers is `/leave/pending/hr`, which
 * is by definition one stage of one status: requests the branch manager has
 * already signed off and that now need HR's decision. There is no `GET /leave`
 * list and no way to browse approved or rejected history company-wide, so this
 * screen does not pretend to offer one — approving a request removes it from
 * this queue, and nothing here can show you where it went.
 *
 * Per-employee history *is* available, on the employee's own page.
 */
export default async function HrLeavePage() {
  await requirePermission("leave:read");

  let requests: LeaveRequestResponse[];

  try {
    requests = await getPendingHrApprovals();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Leave Approvals"
        description="Requests the branch manager has forwarded for HR's decision."
        subject="The HR approval queue"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Leave Approvals"
        description="Requests the branch manager has forwarded for HR's decision."
      />

      <BentoCard
        title={
          <span className="flex items-center gap-2">
            <Icon name="pending_actions" className="text-[20px] text-primary" />
            Awaiting HR
          </span>
        }
        action={
          <span className="font-body-md text-[11px] text-outline">
            {formatNumber(requests.length)}{" "}
            {requests.length === 1 ? "request" : "requests"}
          </span>
        }
      >
        {requests.length === 0 ? (
          <EmptyState
            symbol="task_alt"
            title="Nothing is waiting on you"
            description="Requests appear here once a branch manager has forwarded them."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Dates</th>
                  <th className="pb-3 pr-4">Reason</th>
                  <th className="pb-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-outline-variant/25 align-top last:border-0"
                  >
                    <td className="py-4 pr-4">
                      <Link
                        href={`/hr/employees/${request.employeeId}`}
                        className="font-semibold text-on-surface hover:text-primary"
                      >
                        {request.employeeName ?? `Employee #${request.employeeId}`}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-on-surface-variant">
                      {request.leaveTypeName ?? "—"}
                    </td>
                    <td className="py-4 pr-4 whitespace-nowrap text-on-surface-variant">
                      {formatDate(request.startDate)} – {formatDate(request.endDate)}
                    </td>
                    <td className="max-w-xs py-4 pr-4 text-on-surface-variant">
                      {request.reason || (
                        <span className="text-outline">No reason given</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <LeaveDecision request={request} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>

      <p className="mt-4 text-[11px] text-outline">
        Leave has a two-stage approval. A request reaches this queue only after a
        branch manager has approved it; the API exposes no company-wide view of
        approved or rejected history.
      </p>
    </>
  );
}
