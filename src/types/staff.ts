import type { EmploymentType } from "@/types";

/** A company-wide department (`departments.branch_id` is no longer used). */
export type CompanyDepartment = {
  id: number;
  name: string;
  branchId: number | null;
  branchName: string | null;
  headOfDepartmentId: number | null;
  headOfDepartmentName: string | null;
};

/** `GET /agents/options` — enough to pick an agent on a form. */
export type AgentOption = { id: number; name: string };

/**
 * The body of `POST /employees` and `POST /employee-requests` (`EmployeeRequest`).
 *
 * Pay is worked out from the days worked in attendance and the daily rate the Admin sets. Basic
 * salary is optional and for reference only; only an Admin's form offers it.
 */
export type EmployeeEntryPayload = {
  fullName: string;
  nationalId?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  branchId: number;
  departmentId?: number;
  agentId?: number;
  shifNumber?: string;
  nssfNumber?: string;
  kraPin?: string;
  basicSalary?: number;
  dateHired?: string;
  bankName?: string;
  bankAccountNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

export type StaffRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/** `EmployeeCreationRequestResponse` — one proposed employee and what became of it. */
export type StaffRequestResponse = {
  id: number;
  status: StaffRequestStatus;
  requestedByUserId: number;
  requestedByName: string | null;
  requestedAt: string;
  reviewedByUserId: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdEmployeeId: number | null;
  branchName: string | null;
  departmentName: string | null;
  agentName: string | null;
  details: { fullName: string; position: string | null; employmentType: EmploymentType | null };
};