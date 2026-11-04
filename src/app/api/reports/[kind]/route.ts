import type { NextRequest } from "next/server";

import { ApiError } from "@/app/lib/api-error";
import { SYSTEM_UNREACHABLE } from "@/lib/api-messages";
import { getSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";
import {
  getAttendanceReport,
  getEmployeeListReport,
} from "@/lib/api/report";

/**
 * Serves the generated PDFs from `controller/report/ReportController`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * `lib/api/report` is `server-only` and returns a `Blob`, which a Server
 * Component cannot hand to the browser and must not push through the RSC
 * payload. The reports page therefore submits a plain
 * `<form method="get" target="_blank">` straight at this route, which does the
 * authenticated hop server-side and streams the file back. No client
 * JavaScript is involved on either side of it.
 *
 * The backend already sets `Content-Disposition: attachment`. This route
 * deliberately overrides that to `inline`, so clicking a report opens it in the
 * browser's PDF viewer — where downloading is one click — instead of saving a
 * file into a downloads folder the user then has to find. `?download=1` puts
 * the original behaviour back for a real "Download" button.
 *
 * Errors are answered as plain text, not JSON: the caller is a browser tab
 * showing a document, and a stack of JSON there reads as a broken page. Any
 * status other than 200 leaves the failure legible.
 *
 * `src/proxy.ts` excludes `/api` from its matcher, so this handler is the only
 * gate — `requirePermission` would redirect, which is right for a page and
 * wrong here, so the check is repeated without it. Same reasoning as
 * `/api/attendance/live`.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** The reports the backend serves, by the name that appears in the URL. */
const KINDS = ["attendance", "employee-list"] as const;

type ReportKind = (typeof KINDS)[number];

/**
 * Narrows a path segment to a known report.
 *
 * The tuple has to be widened to `readonly string[]` to call `.includes` on a
 * plain `string` — the same shape `isRole` uses in `config/roles.ts`.
 */
function isReportKind(value: string): value is ReportKind {
  return (KINDS as readonly string[]).includes(value);
}

function fail(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** A positive integer id, or `undefined`. A bad id must not become `NaN`. */
function parseId(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

/** `yyyy-MM-dd` only — the controller's `LocalDate` binding rejects anything else. */
function parseDate(raw: string | null): string | undefined {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
}

/** Repeated ids, deduplicated, with anything malformed dropped. */
function parseIds(values: string[]): number[] {
  const ids = values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  return [...new Set(ids)];
}

/**
 * Quote-safe filename for the header. The backend chooses it, but it reaches us
 * as an unvalidated string and a `"` in it would truncate the header.
 */
function safeFilename(name: string): string {
  const cleaned = name.replace(/["\\\r\n]/g, "").trim();
  return cleaned || "report.pdf";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const session = await getSession();

  if (!session) {
    return fail("Your session has expired. Please sign in again.", 401);
  }

  if (!hasPermission(session.role, "report:read")) {
    return fail("You do not have permission to generate reports.", 403);
  }

  const { kind } = await params;

  if (!isReportKind(kind)) {
    return fail(
      `Unknown report "${kind}". Expected one of: ${KINDS.join(", ")}.`,
      404,
    );
  }

  const search = request.nextUrl.searchParams;

  let file: { blob: Blob; filename: string };

  try {
    switch (kind) {
      case "attendance": {
        const branchId = parseId(search.get("branchId"));
        const start = parseDate(search.get("start"));
        const end = parseDate(search.get("end"));

        if (!branchId || !start || !end) {
          return fail(
            "An attendance report needs `branchId`, `start` and `end` — the date bounds are required, not defaulted.",
            400,
          );
        }

        file = await getAttendanceReport(branchId, { start, end });
        break;
      }

      case "employee-list": {
        const branchIds = parseIds(search.getAll("branchIds"));

        if (branchIds.length === 0) {
          return fail("An employee list needs at least one `branchIds`.", 400);
        }

        file = await getEmployeeListReport(branchIds);
        break;
      }
    }
  } catch (error) {
    // A 403 here is real, not a stale token: HR is in `REPORT_ROLES` on all
    // three, so a refusal means the parameters named a resource the caller
    // cannot see — a branch manager asking for another branch, most often.
    const status = error instanceof ApiError ? error.status : 502;
    const message =
      error instanceof ApiError
        ? error.message
        : SYSTEM_UNREACHABLE;

    return fail(message, status);
  }

  return new Response(file.blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${search.get("download") === "1" ? "attachment" : "inline"}; filename="${safeFilename(file.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}
