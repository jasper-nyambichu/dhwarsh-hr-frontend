import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

/**
 * App-icon rendering for the `icon` / `apple-icon` file conventions.
 *
 * The brand asset is one JPEG containing the emblem above the wordmark, and at
 * favicon sizes the wordmark is noise — so this crops to the emblem alone, the
 * same crop `BrandMark` does in CSS. The two are separate implementations of
 * one intent (Satori cannot reuse Tailwind classes), so the box below must stay
 * in step with the values documented in `components/shared/brand-logo.tsx`.
 */
const SOURCE_ASPECT = 673 / 684;

/** Emblem bounding box as fractions of the source image. */
const EMBLEM_LEFT = 0.07;
const EMBLEM_RIGHT = 0.975;
const EMBLEM_TOP = 0.025;
const EMBLEM_BOTTOM = 0.655;

/**
 * Renders the emblem, scaled to span a square icon's full width and centred on
 * its height. Read from disk at request time rather than imported so the JPEG
 * stays out of the route bundle.
 */
export async function renderBrandIcon(edge: number) {
  const bytes = await readFile(
    path.join(process.cwd(), "public", "brand", "dhwarsh-logo.jpg"),
  );
  const source = `data:image/jpeg;base64,${bytes.toString("base64")}`;

  const width = edge / (EMBLEM_RIGHT - EMBLEM_LEFT);
  const height = width * SOURCE_ASPECT;
  const emblemHeight = (EMBLEM_BOTTOM - EMBLEM_TOP) * height;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: edge,
          height: edge,
          overflow: "hidden",
          backgroundColor: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element --
            Satori renders plain <img>; next/image has no meaning here. */}
        <img
          alt=""
          src={source}
          width={width}
          height={height}
          style={{
            position: "absolute",
            left: -EMBLEM_LEFT * width,
            top: (edge - emblemHeight) / 2 - EMBLEM_TOP * height,
          }}
        />
      </div>
    ),
    { width: edge, height: edge },
  );
}
