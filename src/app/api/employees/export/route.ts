import type { NextRequest } from "next/server";

import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";
import { getSession, refreshSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";

/**
 * Downloads the employee list as a PDF or CSV.
 *
 * `fetchDocument` is server-only and returns a Blob, so the export buttons link straight at this route
 * and it does the authenticated hop. `src/proxy.ts` excludes `/api`, so the gate is repeated here. The
 * backend decides what the file holds from who is signed in, so editing the URL cannot widen it.
 */

const FORMATS = { PDF: "application/pdf", CSV: "text/csv; charset=utf-8" } as const;

function fail(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function safeFilename(name: string): string {
  return name.replace(/["\\\r\n]/g, "").trim() || "employee-list";
}

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return fail("Your session has expired. Please sign in again.", 401);
  }
  if (!hasPermission(session.role, "employee:export")) {
    return fail("You do not have permission to export the employee list.", 403);
  }

  const format = request.nextUrl.searchParams.get("format") ?? "PDF";
  if (format !== "PDF" && format !== "CSV") {
    return fail("Unknown format. Expected PDF or CSV.", 400);
  }

  const branchId = request.nextUrl.searchParams.get("branchId");
  if (branchId !== null && !/^[1-9]\d*$/.test(branchId)) {
    return fail("Invalid branch.", 400);
  }

  const query = { format, branchId: branchId ?? undefined };

  let file: { blob: Blob; filename: string };
  try {
    try {
      file = await fetchDocument("/employees/export", { query });
    } catch (error) {
      // The backend access token lives 15 minutes; refresh once and retry.
      if (error instanceof ApiError && error.isUnauthorized && (await refreshSession(session))) {
        file = await fetchDocument("/employees/export", { query });
      } else {
        throw error;
      }
    }
  } catch (error) {
    return fail(error instanceof ApiError ? error.message : "Unable to reach the service.", error instanceof ApiError ? error.status : 502);
  }

  return new Response(file.blob, {
    headers: {
      "Content-Type": FORMATS[format],
      "Content-Disposition": `attachment; filename="${safeFilename(file.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}
