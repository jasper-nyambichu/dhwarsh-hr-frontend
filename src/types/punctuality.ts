/** Mirrors `dto/response/attendance/PunctualityDtos`. Dates are yyyy-MM-dd, times are local (company time). */

export type PunctualityRating = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "NO_DATA";

export type PunctualityDay = {
  date: string;
  offDay: boolean;
  clockIn: string | null;
  clockOut: string | null;
  /** Arrived this many minutes after the work start. */
  minutesLate: number | null;
  /** Left this many minutes before the work end. */
  minutesLeftEarly: number | null;
  /** Back from lunch this many minutes after the 30 minutes. */
  lunchMinutesLate: number | null;
  hours: number | null;
};

export type EmployeePunctuality = {
  employeeId: number;
  employeeName: string;
  employeeNumber: string | null;
  position: string | null;
  branchId: number | null;
  branchName: string | null;
  expectedDays: number;
  daysReported: number;
  daysOff: number;
  daysMissed: number;
  onTimeArrivals: number;
  lateArrivals: number;
  minutesLateArrival: number;
  earlyLeaves: number;
  minutesLeftEarly: number;
  lunches: number;
  lateLunchReturns: number;
  minutesLateLunch: number;
  hoursWorked: number;
  attendancePercent: number | null;
  punctualityPercent: number | null;
  rating: PunctualityRating;
  /** Only when one employee was asked for. */
  days: PunctualityDay[] | null;
};

export type PunctualityReport = {
  start: string;
  end: string;
  /** "08:00:00" */
  workStart: string;
  workEnd: string;
  employees: EmployeePunctuality[];
};

export type LateLunch = {
  employeeId: number;
  employeeName: string | null;
  employeeNumber: string | null;
  branchId: number | null;
  branchName: string | null;
  date: string;
  checkedOutAt: string;
  expectedBackAt: string;
  /** Null: still out. */
  checkedInAt: string | null;
  minutesLate: number;
};
