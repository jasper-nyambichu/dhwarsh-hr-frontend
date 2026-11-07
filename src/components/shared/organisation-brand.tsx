import Image from "next/image";

import { cn } from "@/lib/utils";
import type { OrganisationBranding } from "@/lib/api/organisation";

/**
 * Two identities appear in this system:
 *  - the ORGANISATION using it (Kisiimatt today, any client tomorrow): its name and logo come from
 *    Admin → Settings, and they head the sign-in pages, the sidebar and every downloaded document;
 *  - DHWARSHHUB, the company that built it: a fixed logo on the sign-in pages and a "Developed by" credit.
 */

export const VENDOR_NAME = "DhwarshHub";
const VENDOR_LOGO = { src: "/brand/dhwarshhub-logo.png", width: 340, height: 269 };

/** DhwarshHub's logo. Its wordmark is dark, so on a coloured panel put it on a light tile. */
export function VendorLogo({ className, eager = false }: { className?: string; eager?: boolean }) {
  return (
    <Image
      src={VENDOR_LOGO.src}
      alt={VENDOR_NAME}
      width={VENDOR_LOGO.width}
      height={VENDOR_LOGO.height}
      sizes="(min-width: 768px) 160px, 112px"
      loading={eager ? "eager" : undefined}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
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
      <img
        src={`/api/organisation/logo?v=${encodeURIComponent(branding.logoVersion ?? "1")}`}
        alt={branding.name ?? "Organisation logo"}
        className={cn("block object-contain", className)}
      />
    );
  }
  if (branding.name) {
    return <span className={cn("block break-words text-center text-xl font-bold text-primary", nameClassName)}>{branding.name}</span>;
  }
  return null;
}

/** "Developed by DhwarshHub", for the footer of the system and the sign-in pages. */
export function DevelopedBy({ className }: { className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-on-surface-variant", className)}>
      <span>Developed by</span>
      <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
        <Image src={VENDOR_LOGO.src} alt="" width={VENDOR_LOGO.width} height={VENDOR_LOGO.height} className="h-4 w-auto" />
        {VENDOR_NAME}
      </span>
    </p>
  );
}
