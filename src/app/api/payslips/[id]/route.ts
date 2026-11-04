import type { NextRequest } from "next/server";

import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";
import { SYSTEM_UNREACHABLE } from "@/lib/api-messages";
import { getSession, refreshSession } from "@/app/lib/session";
import { hasAnyPermission } from "@/config/roles";

/**
 * Serves one payslip PDF. `src/proxy.ts` excludes `/api`, so the gate is repeated here. The backend
 * checks the payslip against who is signed in, so editing the id cannot open someone else's.
 */

function fail(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function safeFilename(name: string): string {
  return name.replace(/["\\\r\n]/g, "").trim() || "payslip.pdf";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();

  if (!session) {
    return fail("Your session has expired. Please sign in again.", 401);
  }
  if (!hasAnyPermission(session.role, ["payslip:read", "payslip:read:branch", "payslip:read:self"])) {
    return fail("You do not have permission to view this payslip.", 403);
  }

  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    return fail("Invalid payslip.", 400);
  }

  const path = `/payslips/${id}/pdf`;

  let file: { blob: Blob; filename: string };
  try {
    try {
      file = await fetchDocument(path);
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized && (await refreshSession(session))) {
        file = await fetchDocument(path);
      } else {
        throw error;
      }
    }
  } catch (error) {
    return fail(error instanceof ApiError ? error.message : SYSTEM_UNREACHABLE, error instanceof ApiError ? error.status : 502);
  }

  const disposition = request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";

  return new Response(file.blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safeFilename(file.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}
