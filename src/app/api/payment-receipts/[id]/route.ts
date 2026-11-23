import type { NextRequest } from "next/server";

import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";
import { getSession, refreshSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";
import { SYSTEM_UNREACHABLE } from "@/lib/api-messages";

/**
 * The receipt of one agent payment (PDF): how it was paid and, for an invoice, each branch's employees and amounts.
 * `GET /payment-requests/{id}/receipt`: the Admin and the Accounts Office, or the agent it was paid to (the backend
 * refuses another agent's). `src/proxy.ts` excludes `/api`, so the gate is repeated here.
 */

function fail(message: string, status: number): Response {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return fail("Your session has expired. Please sign in again.", 401);

  const isAgent = hasPermission(session.role, "agentsummary:read:self") && session.agentId !== null;
  if (!isAgent && !hasPermission(session.role, "paymentrequest:read")) {
    return fail("You do not have permission to view this receipt.", 403);
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid payment.", 400);

  const path = `/payment-requests/${id}/receipt`;
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
  const name = file.filename.replace(/["\\\r\n]/g, "").trim() || `payment-receipt-${id}.pdf`;
  return new Response(file.blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
