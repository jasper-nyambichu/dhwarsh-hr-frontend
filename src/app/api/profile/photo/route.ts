import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";
import { getSession, refreshSession } from "@/app/lib/session";

/** The signed-in person's own photo for an `<img>`. The backend only ever stores PNG or JPEG. */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return new Response(null, { status: 401 });
  }

  let file: { blob: Blob };
  try {
    try {
      file = await fetchDocument("/users/me/photo");
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized && (await refreshSession(session))) {
        file = await fetchDocument("/users/me/photo");
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
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
