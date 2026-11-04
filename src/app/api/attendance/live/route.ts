import type { NextRequest } from "next/server";

import { ApiError } from "@/app/lib/api-error";
import { SYSTEM_UNREACHABLE } from "@/lib/api-messages";
import { getSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";
import { getAttendanceActivity, getAttendanceSummary } from "@/lib/api/attendance";
import type { AttendanceLiveSnapshot } from "@/types";

/**
 * Polling endpoint behind the live attendance board.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * `lib/api/attendance` is `server-only` — it carries the backend JWT out of
 * the httpOnly session cookie — so a Client Component cannot call it. The
 * board needs to refresh without a full navigation, so it polls this route
 * instead, which does the authenticated hop server-side and hands back only
 * the two projections the board renders.
 *
 * It answers 401/403 as JSON rather than redirecting: `src/proxy.ts` excludes
 * `/api` from its matcher, so this handler is the only gate, and a 307 to
 * /login would arrive at the client as an HTML page it cannot parse.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * GET handlers are uncached by default; the `cookies()` read below makes that
 * explicit, since the response is per-session.
 */

/** Positive integers only — a branch id is a key, never a filter expression. */
function parseBranchId(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return Response.json(
      { message: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  // The DAL's `requirePermission` redirects, which is right for a page and
  // wrong for a JSON endpoint — so the check is repeated here, without it.
  if (!hasPermission(session.role, "attendance:read")) {
    return Response.json(
      { message: "You do not have permission to view attendance." },
      { status: 403 },
    );
  }

  // Passed straight through: BRANCH_MANAGER scoping is enforced in the backend
  // service (`AttendanceDashboardServiceImpl.scopeBranch`), which overrides
  // whatever branch id arrives here. Re-implementing that filter client-side
  // would be a second, weaker copy of an authorization rule.
  const branchId = parseBranchId(
    request.nextUrl.searchParams.get("branchId"),
  );

  try {
    const [summary, activity] = await Promise.all([
      getAttendanceSummary({ branchId }),
      getAttendanceActivity({ branchId, limit: 50 }),
    ]);

    const snapshot: AttendanceLiveSnapshot = {
      summary,
      activity,
      fetchedAt: new Date().toISOString(),
    };

    return Response.json(snapshot);
  } catch (error) {
    // A 401 here is the backend's token having expired mid-session; the client
    // refreshes on the next request rather than being signed out.
    const status = error instanceof ApiError ? error.status : 502;
    const message =
      error instanceof ApiError
        ? error.message
        : SYSTEM_UNREACHABLE;

    return Response.json({ message }, { status });
  }
}
