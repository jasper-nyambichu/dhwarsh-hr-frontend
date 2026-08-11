import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The supplied brand asset: one 684x673 JPEG holding the whole lockup — the
 * three-figure emblem stacked above the "Dhwarsh / Employee Management"
 * wordmark. There is no separate mark-only or transparent file, so both
 * components below are views onto this single source.
 */
export const BRAND_LOGO_SRC = "/brand/dhwarsh-logo.jpg";
const BRAND_LOGO_WIDTH = 684;
const BRAND_LOGO_HEIGHT = 673;

/** Accessible name. The asset carries the product name as artwork, so any
 *  standalone use has to restate it in text for screen readers. */
export const BRAND_LOGO_ALT = "Dhwarsh Employee Management";

/**
 * The emblem on its own, cropped out of the lockup in CSS.
 *
 * Square slots — the nav rail, the auth panels, anything under ~64px — cannot
 * use the full lockup: at that size the wordmark is an illegible smudge. The
 * crop is done with layout rather than a second hand-trimmed binary so there
 * is one asset to replace when branding changes.
 *
 * How it works: the image is over-sized inside an `overflow-hidden` box and
 * offset so the emblem's bounding box in the source (x 7%..97.5%,
 * y 2.5%..65.5%) lands flush against the box's width and centred on its
 * height. Those offsets are percentages of the wrapper, so the crop survives
 * any size change — but only while the wrapper is square, since `top` resolves
 * against height and the rest against width. Callers must pass a square size.
 *
 * The JPEG's own near-white background becomes the visible backdrop (the image
 * covers the box entirely), which is why every caller puts it on a light tile
 * rather than letting it sit raw on a coloured panel.
 */
export function BrandMark({
  className,
  alt = "",
  eager = false,
  sizes = "64px",
}: {
  /** Must resolve to a square box, e.g. `size-11`. Set the radius here too. */
  className?: string;
  /** Leave empty when adjacent text already names the brand. */
  alt?: string;
  /** Skip lazy-loading for above-the-fold use (auth panels, the rail). */
  eager?: boolean;
  sizes?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden bg-white",
        className,
      )}
    >
      <Image
        src={BRAND_LOGO_SRC}
        alt={alt}
        width={BRAND_LOGO_WIDTH}
        height={BRAND_LOGO_HEIGHT}
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        /* w-/left-/top- override the width and height attributes: the box, not
           the intrinsic size, drives the rendered geometry. `max-w-none` is
           load-bearing — the base reset's `max-width: 100%` would otherwise
           cancel the 110.5% overscale and undo the crop. */
        className="absolute left-[-7.7%] top-[13%] h-auto w-[110.5%] max-w-none"
      />
    </span>
  );
}

/**
 * The complete lockup, emblem and wordmark together.
 *
 * For places with room to show the brand properly — the login form panel, the
 * standalone auth cards. Keep it at 120px wide or more or the wordmark stops
 * being readable and you want {@link BrandMark} instead.
 *
 * Renders edge-to-edge by design: the artwork carries its own margins, and the
 * asset's near-white ground would otherwise show as a visible square against a
 * pure-white tile.
 */
export function BrandLockup({
  className,
  eager = false,
  sizes = "240px",
}: {
  className?: string;
  eager?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt={BRAND_LOGO_ALT}
      width={BRAND_LOGO_WIDTH}
      height={BRAND_LOGO_HEIGHT}
      sizes={sizes}
      loading={eager ? "eager" : undefined}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}
