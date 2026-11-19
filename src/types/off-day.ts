/** Mirrors `dto/response/offday/OffDayResponse`. Dates are yyyy-MM-dd. */
export type OffDayResponse = {
  id: number;
  employeeId: number;
  employeeNumber: string | null;
  employeeName: string | null;
  branchId: number | null;
  branchName: string | null;
  /** Null for an employee without an agent. */
  agentId: number | null;
  agentName: string | null;
  startDate: string;
  endDate: string;
  reason: string | null;
};
