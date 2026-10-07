import "server-only";

import { fetchDocument } from "@/app/lib/api-client";

/**
 * `controller/report/ReportController` — base `/reports`.
 *
 * All three of these return a PDF, not JSON: the controller writes
 * `ResponseEntity<byte[]>` with `Content-Type: application/pdf` and
 * `Content-Disposition: attachment`, deliberately bypassing the
 * `ApiResponse<T>` envelope (wrapping a file's bytes in JSON would corrupt it).
 * So they go through `fetchDocument` rather than `api.get`, and the result is a
 * `Blob` plus the filename the backend chose.
 *
 * Every function here is `hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER',
 * 'PAYROLL_OFFICER', 'FINANCE_OFFICER', 'AUDITOR')` on the Spring side, and
 * `attendance/{branchId}` additionally admits a BRANCH_MANAGER on their own
 * branch. There is no report an EMPLOYEE or AGENT may generate.
 *
 * These are called from a Route Handler, never from a page: a Server Component
 * cannot hand a `Blob` to the browser, and the bytes must not pass through the
 * RSC payload.
 */

/** Clock activity for one branch over a range. Both bounds are required. */
export function getAttendanceReport(
  branchId: number,
  params: { start: string; end: string },
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  return fetchDocument(`/reports/attendance/${branchId}`, {
    query: { start: params.start, end: params.end },
    signal,
  });
}

/**
 * The register for one completed payroll run.
 *
 * HR may generate this but has no way to *find* a run id: `GET /payroll/runs`
 * does not exist and every `/payroll/runs/{id}` read is restricted to
 * SUPER_ADMIN, ADMIN, PAYROLL_OFFICER, FINANCE_OFFICER and AUDITOR — HR_MANAGER
 * is not in that list. The id has to be supplied from outside.
 */
export function getPayrollRegisterReport(
  payrollRunId: number,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  return fetchDocument(`/reports/payroll-register/${payrollRunId}`, { signal });
}

/**
 * The employee directory as a PDF, for one or more branches.
 *
 * `branchIds` goes on the wire as a repeated query param. Spring binds both
 * that and the comma-separated form the controller's own comment describes to
 * `List<Long>`, and repeating the key is what `buildUrl` does natively.
 */
export function getEmployeeListReport(
  branchIds: number[],
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  return fetchDocument("/reports/employee-list", {
    query: { branchIds },
    signal,
  });
}
