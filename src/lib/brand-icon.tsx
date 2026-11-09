import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

/**
 * App-icon rendering for the `icon` / `apple-icon` file conventions: the Dhwarsh emblem of DhwarshHub, the
 * company behind the system. (The organisation's own logo heads the pages instead; it can be any
 * shape and is unreadable at favicon size.) The source is a square transparent PNG, drawn on white.
 */
export async function renderBrandIcon(edge: number) {
  const bytes = await readFile(path.join(process.cwd(), "public", "brand", "dhwarsh-mark.png"));
  const source = `data:image/png;base64,${bytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: edge, height: edge, backgroundColor: "#ffffff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element --
            Satori renders plain <img>; next/image has no meaning here. */}
        <img alt="" src={source} width={edge} height={edge} />
      </div>
    ),
    { width: edge, height: edge },
  );
}
