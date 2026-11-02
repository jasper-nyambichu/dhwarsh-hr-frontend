import "server-only";

import { fetchDocument } from "@/app/lib/api-client";

/**
 * `controller/report/ReportController` — base `/reports`.
 *
 * Both of these return a PDF, not JSON: the controller writes
 * `ResponseEntity<byte[]>` with `Content-Type: application/pdf` and
 * `Content-Disposition: attachment`, deliberately bypassing the
 * `ApiResponse<T>` envelope (wrapping a file's bytes in JSON would corrupt it).
 * So they go through `fetchDocument` rather than `api.get`, and the result is a
 * `Blob` plus the filename the backend chose.
 *
 * Every function here is Admin-only on the Spring side, and
 * `attendance/{branchId}` additionally admits a BRANCH_MANAGER on their own
 * branch. There is no report an AGENT may generate.
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
