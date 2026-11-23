import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";
import { getSession, refreshSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";
import { SYSTEM_UNREACHABLE } from "@/lib/api-messages";

/**
 * Opens the proof of one agent payment (receipt, M-Pesa message, cheque photo) uploaded by the Accounts Office.
 * `GET /payment-requests/{id}/evidence`: staff who read payments (Admin, Accounts Office), or the agent it was
 * paid to (the backend refuses another agent's). `src/proxy.ts` excludes `/api`, so the gate is repeated here.
 */

function fail(message: string, status: number): Response {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

function safeFilename(name: string): string {
  return name.replace(/["\\\r\n]/g, "").trim() || "proof-of-payment";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return fail("Your session has expired. Please sign in again.", 401);

  const isAgent = hasPermission(session.role, "agentsummary:read:self") && session.agentId !== null;
  if (!isAgent && !hasPermission(session.role, "paymentrequest:read")) {
    return fail("You do not have permission to view this file.", 403);
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid payment.", 400);

  const path = `/payment-requests/${id}/evidence`;
  let file: { blob: Blob; filename: string };
  try {
    try {
      file = await fetchDocument(path);
    } catch (error) {
      // The backend access token lives 15 minutes; refresh once and retry.
      if (error instanceof ApiError && error.isUnauthorized && (await refreshSession(session))) {
        file = await fetchDocument(path);
      } else {
        throw error;
      }
    }
  } catch (error) {
    return fail(error instanceof ApiError ? error.message : SYSTEM_UNREACHABLE, error instanceof ApiError ? error.status : 502);
  }

  return new Response(file.blob, {
    headers: {
      "Content-Type": file.blob.type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeFilename(file.filename)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
