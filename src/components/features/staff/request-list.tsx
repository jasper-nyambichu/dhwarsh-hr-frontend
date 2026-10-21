import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, humanizeEnum } from "@/lib/format";
import type { StaffRequestResponse, StaffRequestStatus } from "@/types/staff";

const CHIP: Record<StaffRequestStatus, string> = {
  PENDING: "bg-amber-main/10 text-amber-main border border-amber-main/30",
  APPROVED: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30",
  REJECTED: "bg-error/10 text-error border border-error/30",
};

/** The caller's own employee requests and what an Admin decided. */
export function RequestList({ requests }: { requests: StaffRequestResponse[] }) {
  if (requests.length === 0) {
    return <EmptyState symbol="pending_actions" title="No requests yet" description="Employees you submit appear here with the Admin's decision." />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="data-table w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr>
            <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
            <th className="pb-3 font-table-header text-table-header uppercase text-outline">Branch</th>
            <th className="pb-3 font-table-header text-table-header uppercase text-outline">Department</th>
            <th className="pb-3 font-table-header text-table-header uppercase text-outline">Agent</th>
            <th className="pb-3 font-table-header text-table-header uppercase text-outline">Submitted</th>
            <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Decision</th>
          </tr>
        </thead>
        <tbody className="font-body-md text-body-md text-on-surface">
          {requests.map((request) => (
            <tr key={request.id} className="border-b border-outline-variant/20 last:border-0">
              <td className="py-3 pl-2">
                <span className="block font-semibold">{request.details.fullName}</span>
                <span className="block text-xs text-outline">{request.details.position ?? humanizeEnum(request.details.employmentType)}</span>
              </td>
              <td className="py-3 text-on-surface-variant">{request.branchName ?? "—"}</td>
              <td className="py-3 text-on-surface-variant">{request.departmentName ?? "—"}</td>
              <td className="py-3 text-on-surface-variant">{request.agentName ?? "—"}</td>
              <td className="py-3 text-on-surface-variant">{formatDate(request.requestedAt)}</td>
              <td className="py-3 pr-2 text-right">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CHIP[request.status]}`}>{humanizeEnum(request.status)}</span>
                {request.status === "REJECTED" && request.rejectionReason ? (
                  <span className="mt-1 block text-[11px] text-error">{request.rejectionReason}</span>
                ) : null}
                {request.status === "APPROVED" && request.reviewedByName ? (
                  <span className="mt-1 block text-[11px] text-outline">by {request.reviewedByName}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}