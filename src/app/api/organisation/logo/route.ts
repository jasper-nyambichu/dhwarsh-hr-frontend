import { fetchDocument } from "@/app/lib/api-client";
import { ApiError } from "@/app/lib/api-error";

/**
 * The organisation's logo (uploaded under Admin → Settings) for an `<img>`, signed in or not: the sign-in
 * pages and the sidebar both show it. The backend only ever stores PNG or JPEG.
 */
export async function GET() {
  let file: { blob: Blob };
  try {
    file = await fetchDocument("/public/organisation/logo", { anonymous: true });
  } catch (error) {
    return new Response(null, { status: error instanceof ApiError ? error.status : 502 });
  }

  return new Response(file.blob, {
    headers: {
      "Content-Type": file.blob.type === "image/jpeg" ? "image/jpeg" : "image/png",
      // The URL carries ?v=<logo version>, so a new upload is fetched straight away.
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
