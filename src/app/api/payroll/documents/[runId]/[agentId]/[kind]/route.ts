import type { NextRequest } from "next/server";

import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";
import { getSession, refreshSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";

/**
 * Staff download of any agent's invoice / voucher / payroll summary for a run.
 *
 * Same shape as `/api/agent/documents/...`, but the agent id comes from the URL
 * because staff may open any agent's — gated on `invoice:read`, and the backend
 * re-checks its own role list regardless. `src/proxy.ts` excludes `/api`, so the
 * gate is repeated here without `requirePermission` (a redirect is wrong for a file).
 */

const KINDS = ["invoice", "voucher", "summary"] as const;
type DocumentKind = (typeof KINDS)[number];

function isDocumentKind(value: string): value is DocumentKind {
  return (KINDS as readonly string[]).includes(value);
}

function fail(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function parseId(raw: string): number | undefined {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/["\\\r\n]/g, "").trim();
  return cleaned || "document.pdf";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string; agentId: string; kind: string }> },
) {
  const session = await getSession();

  if (!session) return fail("Your session has expired. Please sign in again.", 401);
  if (!hasPermission(session.role, "invoice:read")) {
    return fail("You do not have permission to view this document.", 403);
  }

  const { runId: rawRunId, agentId: rawAgentId, kind } = await params;
  const runId = parseId(rawRunId);
  const agentId = parseId(rawAgentId);

  if (!runId || !agentId) return fail("Invalid payroll run or agent.", 400);
  if (!isDocumentKind(kind)) {
    return fail(`Unknown document "${kind}". Expected: ${KINDS.join(", ")}.`, 404);
  }

  const path = `/payroll/runs/${runId}/agents/${agentId}/${kind}`;

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
      error instanceof ApiError ? error.message : "Unable to reach the payroll service.";
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