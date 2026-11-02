import type { NextRequest } from "next/server";

import { ApiError } from "@/app/lib/api-error";
import { getSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";
import { getAuditLogs, type AuditCategory } from "@/lib/api/audit";
import { parseDate, parseId } from "@/lib/search-params";
import { parseDetails } from "@/lib/audit-format";

/**
 * Exports the (filtered) audit log as CSV — "filterable and exportable" per the proposal.
 *
 * Takes the same filters as the log page. `src/proxy.ts` excludes `/api`, so the gate is
 * repeated here; the backend still decides who may actually read the log. Capped at
 * 5,000 rows so a click can never pull the whole table.
 */

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

const COLUMNS = ["Timestamp", "User", "User ID", "Action", "Record type", "Record ID", "Method", "Path", "From address", "Identifier", "Reason"];

// A leading = + - @ makes spreadsheets execute the cell as a formula; defuse it.
function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function fail(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) return fail("Your session has expired. Please sign in again.", 401);
  if (!hasPermission(session.role, "audit:read")) return fail("You do not have permission to export the audit log.", 403);

  const search = request.nextUrl.searchParams;
  const filters = {
    category: (search.get("category") || undefined) as AuditCategory | undefined,
    action: search.get("action") || undefined,
    entityType: search.get("entityType") || undefined,
    userId: parseId(search.get("user") ?? undefined),
    from: parseDate(search.get("from") ?? undefined),
    to: parseDate(search.get("to") ?? undefined),
  };

  const rows: string[] = [COLUMNS.map(cell).join(",")];

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await getAuditLogs({ ...filters, page, size: PAGE_SIZE });

      for (const log of result.content) {
        const details = parseDetails(log.detailsJson);
        rows.push(
          [
            log.createdAt,
            log.performedByUsername,
            log.performedByUserId,
            log.action,
            log.entityType,
            log.entityId,
            details.method,
            details.path,
            details.ip,
            details.identifier,
            details.reason,
          ].map(cell).join(","),
        );
      }

      if (result.last) break;
    }
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return fail(error instanceof ApiError ? error.message : "Unable to reach the audit service.", status);
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}