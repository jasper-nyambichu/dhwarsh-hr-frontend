import { differenceInCalendarDays, parseISO } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { LeaveDecisionForm } from "@/components/features/leave/leave-decision-form";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getPendingHrApprovals } from "@/lib/api/leave";
import { formatDateRange } from "@/lib/format";

function days(start: string, end: string): number {
  try {
    return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
  } catch {
    return 0;
  }
}

/** Leave the Branch Manager has approved, awaiting the Admin's final decision. */
export default async function AdminLeavePage() {
  await requirePermission("leave:approve:hr");

  let pending: Awaited<ReturnType<typeof getPendingHrApprovals>>;
  try {
    pending = await getPendingHrApprovals();
  } catch (error) {
    return <DataUnavailable title="Leave" subject="The leave queue" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader title="Leave" description="Requests a Branch Manager has approved, waiting for your final decision." />

      <BentoCard title="Awaiting final approval" subtitle={`${pending.length} request${pending.length === 1 ? "" : "s"}`}>
        {pending.length === 0 ? (
          <EmptyState symbol="task_alt" title="Nothing waiting" description="Approved-by-manager requests appear here." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Leave</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Dates</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Reason</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Decision</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {pending.map((request) => (
                  <tr key={request.id} className="border-b border-outline-variant/20 align-top last:border-0">
                    <td className="py-3 pl-2 font-semibold">{request.employeeName ?? `Employee #${request.employeeId}`}</td>
                    <td className="py-3 text-on-surface-variant">{request.leaveTypeName ?? "Leave"}</td>
                    <td className="py-3 text-on-surface-variant">
                      {formatDateRange(request.startDate, request.endDate)}
                      <span className="block text-[11px] text-outline">{days(request.startDate, request.endDate)} day(s)</span>
                    </td>
                    <td className="max-w-xs py-3 text-on-surface-variant">{request.reason?.trim() || "—"}</td>
                    <td className="py-3 pr-2">
                      <div className="flex justify-end">
                        <LeaveDecisionForm leaveRequestId={request.id} stage="final" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </>
  );
}