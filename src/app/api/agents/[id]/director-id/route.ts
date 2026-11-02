import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";
import { getSession, refreshSession } from "@/app/lib/session";
import { hasPermission } from "@/config/roles";

/**
 * A photo of an agent's director's ID. `src/proxy.ts` excludes `/api`, so the gate is repeated here;
 * the backend still decides. An identity document, so it is never cached.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();

  if (!session) {
    return new Response(null, { status: 401 });
  }
  if (!hasPermission(session.role, "agent:write")) {
    return new Response(null, { status: 403 });
  }

  const agentId = Number((await params).id);
  if (!Number.isInteger(agentId) || agentId <= 0) {
    return new Response(null, { status: 404 });
  }

  const path = `/agents/${agentId}/director-id`;

  let file: { blob: Blob };
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
    return new Response(null, { status: error instanceof ApiError ? error.status : 502 });
  }

  return new Response(file.blob, {
    headers: {
      "Content-Type": file.blob.type === "image/jpeg" ? "image/jpeg" : "image/png",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
