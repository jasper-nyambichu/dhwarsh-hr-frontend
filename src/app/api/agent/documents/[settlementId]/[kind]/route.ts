import type { NextRequest } from "next/server";

import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";
import { SYSTEM_UNREACHABLE } from "@/lib/api-messages";
import { getSession, refreshSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";

/**
 * Serves an agent's own invoice / payment statement PDF.
 *
 * Same reasoning as `/api/reports/[kind]`: `fetchDocument` is server-only and
 * returns a Blob, so the portal links straight at this route and it does the
 * authenticated hop. `src/proxy.ts` excludes `/api`, so the gate is repeated
 * here without `requirePermission` (a redirect is wrong for a file download).
 *
 * Which payment it is comes from the URL; the backend refuses any that are not this agent's
 * (`isSettlementOfMyAgent`), so one agent cannot read another's by editing the link.
 */

const KINDS = ["invoice", "statement"] as const;
type DocumentKind = (typeof KINDS)[number];

function isDocumentKind(value: string): value is DocumentKind {
  return (KINDS as readonly string[]).includes(value);
}

function fail(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/["\\\r\n]/g, "").trim();
  return cleaned || "document.pdf";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ settlementId: string; kind: string }> },
) {
  const session = await getSession();

  if (!session) {
    return fail("Your session has expired. Please sign in again.", 401);
  }

  if (
    !hasPermission(session.role, "agentsummary:read:self") ||
    session.agentId === null
  ) {
    return fail("You do not have permission to view this document.", 403);
  }

  const { settlementId: rawId, kind } = await params;
  const settlementId = Number(rawId);

  if (!Number.isInteger(settlementId) || settlementId <= 0) {
    return fail("Invalid agent payment.", 400);
  }

  if (!isDocumentKind(kind)) {
    return fail(`Unknown document "${kind}". Expected: ${KINDS.join(", ")}.`, 404);
  }

  const path = `/agent-settlements/${settlementId}/${kind}`;

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
    const status = error instanceof ApiError ? error.status : 502;
    const message =
      error instanceof ApiError
        ? error.message
        : SYSTEM_UNREACHABLE;

    return fail(message, status);
  }

  const disposition =
    request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";

  return new Response(file.blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safeFilename(file.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}