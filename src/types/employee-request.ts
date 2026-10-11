/**
 * Mirrors `dto/response/employee/EmployeeCreationRequestResponse.java` and
 * `entity/employee/EmployeeRequestStatus.java`.
 *
 * HR_MANAGER submits a request; ADMIN/SUPER_ADMIN approves or rejects it.
 * Approval is what actually creates the Employee row — the form never calls
 * POST /employees directly.
 */

export const EMPLOYEE_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export type EmployeeRequestStatus =
  (typeof EMPLOYEE_REQUEST_STATUSES)[number];

/**
 * `details` is the original `EmployeeRequest` payload echoed back by the
 * backend — the same fields the form submitted, so the success panel can
 * display the employee's name without a second fetch.
 */
export type EmployeeCreationRequestDetails = {
  fullName: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  kraPin: string | null;
  shifNumber: string | null;
  nssfNumber: string | null;
  nitaNumber: string | null;
  branchId: number;
  departmentId: number | null;
  agentId: number | null;
  position: string | null;
  employmentType: string;
  basicSalary: number;
  dateHired: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};

/** `dto/response/employee/EmployeeCreationRequestResponse`. */
export type EmployeeCreationRequestResponse = {
  id: number;
  status: EmployeeRequestStatus;
  requestedByUserId: number;
  requestedByName: string | null;
  requestedAt: string | null;
  reviewedByUserId: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdEmployeeId: number | null;
  branchName: string | null;
  departmentName: string | null;
  agentName: string | null;
  details: EmployeeCreationRequestDetails;
};
