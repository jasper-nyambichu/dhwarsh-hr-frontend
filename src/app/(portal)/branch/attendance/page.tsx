// src/app/(portal)/branch/attendance/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { AttendanceTable, type AttendanceRow } from "@/components/features/branch/attendance-table";
import { PageHeader } from "@/components/shared/page-header";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — swap for `await api.get<AttendanceRow[]>("/branch/attendance")`.
 * Status changes are client-side only (see AttendanceTable) — nothing is
 * persisted until the mark-attendance endpoint exists.
 * ─────────────────────────────────────────────────────────────────────────
 */
const ATTENDANCE: AttendanceRow[] = [
  { id: "EMP-001", name: "Alice Johnson", initials: "AJ", role: "Cashier", shift: "08:00 - 16:00", status: "Present" },
  { id: "EMP-002", name: "Bob Smith", initials: "BS", role: "Stock Clerk", shift: "08:00 - 16:00", status: "Late" },
  { id: "EMP-003", name: "Carol White", initials: "CW", role: "Supervisor", shift: "15:00 - 23:00", status: "Present" },
  { id: "EMP-004", name: "David Brown", initials: "DB", role: "Cashier", shift: "15:00 - 23:00", status: "Absent" },
  { id: "EMP-005", name: "Eve Davis", initials: "ED", role: "Security", shift: "23:00 - 07:00", status: "Pending" },
];

export default async function BranchAttendancePage() {
  await requirePermission("attendance:read:branch");

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Mark and review today's attendance for your branch."
      />

      <AttendanceTable rows={ATTENDANCE} />
    </>
  );
}
