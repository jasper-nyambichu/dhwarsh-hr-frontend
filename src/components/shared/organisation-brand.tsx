import Image from "next/image";

import { cn } from "@/lib/utils";
import type { OrganisationBranding } from "@/lib/api/organisation";

/**
 * Two identities appear in this system:
 *  - the ORGANISATION using it (Kisiimatt today, any client tomorrow): its name and logo come from
 *    Admin → Settings, and they head the sign-in pages, the sidebar and every downloaded document;
 *  - DHWARSHHUB, the company that built it: its Dhwarsh logo on the sign-in pages and a "Developed by"
 *    credit in the footer.
 */

export const VENDOR_NAME = "DhwarshHub";
const VENDOR_LOGO = { src: "/brand/dhwarsh-logo.png", width: 653, height: 611 };
const VENDOR_MARK = { src: "/brand/dhwarsh-mark.png", width: 606, height: 606 };

/** The full Dhwarsh logo (emblem and "Dhwarsh Employee Management"). Transparent; its wordmark is dark, so
 *  on a dark surface put it on a light tile. */
export function VendorLogo({
  className,
  eager = false,
  sizes = "64px",
}: {
  className?: string;
  eager?: boolean;
  /** The rendered width, so the browser fetches a sharp enough copy (e.g. "380px" for the large one). */
  sizes?: string;
}) {
  return (
    <Image
      src={VENDOR_LOGO.src}
      alt={`${VENDOR_NAME} — Dhwarsh Employee Management`}
      width={VENDOR_LOGO.width}
      height={VENDOR_LOGO.height}
      sizes={sizes}
      loading={eager ? "eager" : undefined}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}

/** The Dhwarsh emblem alone (the three figures and the tick), for small spots. Transparent. */
export function VendorMark({ className, eager = false }: { className?: string; eager?: boolean }) {
  return (
    <Image
      src={VENDOR_MARK.src}
      alt=""
      width={VENDOR_MARK.width}
      height={VENDOR_MARK.height}
      sizes="48px"
      loading={eager ? "eager" : undefined}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}

function logoUrl(branding: OrganisationBranding): string {
  return `/api/organisation/logo?v=${encodeURIComponent(branding.logoVersion ?? "1")}`;
}

/**
 * The organisation's logo as uploaded under Settings (any shape, so it is contained, never cropped).
 * Without one, its name stands in; without either, nothing is drawn.
 */
export function OrganisationLogo({
  branding,
  className,
  nameClassName,
}: {
  branding: OrganisationBranding;
  /** Size the box (e.g. `h-20 w-full max-w-[240px]`); the logo is fitted inside it. */
  className?: string;
  nameClassName?: string;
}) {
  if (branding.hasLogo) {
    return (
      // A plain <img>: the file changes at runtime, and its size is whatever the organisation uploaded.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl(branding)} alt={branding.name ?? "Organisation logo"} className={cn("block object-contain", className)} />
    );
  }
  if (branding.name) {
    return <span className={cn("block break-words text-center text-xl font-bold text-primary", nameClassName)}>{branding.name}</span>;
  }
  return null;
}

/**
 * The organisation's logo cropped to a circle: the sign-in cards and the sidebar. The logo fills the circle
 * edge to edge (no white backing), so upload a square logo with its artwork centred, as for any app avatar;
 * a wide logo loses its sides. Without a logo, the organisation's initials fill a white circle.
 */
export function OrganisationBadge({
  branding,
  className,
  ringClassName = "ring-outline-variant/40",
}: {
  branding: OrganisationBranding;
  /** Size the circle, e.g. `size-24 sm:size-28`. */
  className?: string;
  /** The ring colour, so each portal's theme can tint it. */
  ringClassName?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg ring-4",
        branding.hasLogo ? "" : "bg-white",
        ringClassName,
        className,
      )}
    >
      {branding.hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl(branding)} alt={branding.name ?? "Organisation logo"} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="text-2xl font-extrabold text-primary">{initials(branding.name)}</span>
      )}
    </span>
  );
}

/** "Kisii Matt Supermarket" -> "KM". */
export function initials(name: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return words.length === 0 ? "•" : words.slice(0, 2).map((word) => word[0]!.toUpperCase()).join("");
}

/** "Developed by DhwarshHub", with the Dhwarsh emblem: the footer of the system and the sign-in pages. */
export function DevelopedBy({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center justify-center gap-1.5 text-xs",
        tone === "light" ? "text-white/80" : "text-on-surface-variant",
        className,
      )}
    >
      <span>Developed by</span>
      <span className={cn("inline-flex items-center gap-1 font-bold", tone === "light" ? "text-white" : "text-on-surface")}>
        <VendorMark className="size-5" />
        {VENDOR_NAME}
      </span>
    </p>
  );
}
