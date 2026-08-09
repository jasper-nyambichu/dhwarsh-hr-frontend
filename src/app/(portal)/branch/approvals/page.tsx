// src/app/(portal)/branch/approvals/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { ApprovalQueue, type ApprovalRequest } from "@/components/features/branch/approval-queue";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<ApprovalRequest[]>("/branch/approvals")`.
 * Approve/Reject buttons currently just remove the card locally — wire to
 * `POST /branch/approvals/{id}/approve` and `/reject` when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */
const REQUESTS: ApprovalRequest[] = [
  { id: "1", employeeName: "Sarah Jenkins", avatarUrl: "/avatars/sarah.jpg", type: "Leave", detailIcon: "event", detailText: "Annual Leave: 3 days (Oct 12 - Oct 14)", submittedAt: "Submitted 2 hours ago" },
  { id: "2", employeeName: "David Ochieng", avatarUrl: "/avatars/david-o.jpg", type: "Overtime", detailIcon: "schedule", detailText: "Weekend Shift: 6 hours (Project Delta Delivery)", submittedAt: "Submitted yesterday" },
  { id: "3", employeeName: "Mercy Njoroge", initials: "MN", type: "Advance", detailIcon: "payments", detailText: "Salary Advance: KES 15,000 (Medical Emergency)", submittedAt: "", highPriority: true },
  { id: "4", employeeName: "James Kamau", avatarUrl: "/avatars/james.jpg", type: "Leave", detailIcon: "sick", detailText: "Sick Leave: 2 days (Recovering from flu)", submittedAt: "Submitted 3 days ago" },
];

export default async function ApprovalsPage() {
  await requirePermission("leave:approve:manager");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold text-on-surface">Approval Queue</h1>
          <p className="text-sm text-on-surface-variant">Review and manage pending requests from your branch team.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 rounded-md border border-outline-variant/50 bg-white px-3 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="flex items-center gap-1 rounded-md border border-outline-variant/50 bg-white px-3 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            Sort
          </button>
        </div>
      </div>

      <ApprovalQueue requests={REQUESTS} />
    </div>
  );
}