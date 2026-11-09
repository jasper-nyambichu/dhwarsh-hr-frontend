import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { api } from "@/app/lib/api-client";

/**
 * The organisation using the system: its name and the logo uploaded under Admin → Settings.
 * `controller/company/PublicOrganisationController` — public, so the sign-in pages can show it.
 *
 * The system is sold to any organisation by DhwarshHub; this is the client's identity. DhwarshHub's own
 * identity is fixed (see `components/shared/organisation-brand`).
 */
export type OrganisationBranding = {
  name: string | null;
  hasLogo: boolean;
  /** Changes whenever a new logo is uploaded; used to bust the browser's copy. */
  logoVersion: string | null;
};

const NONE: OrganisationBranding = { name: null, hasLogo: false, logoVersion: null };

/**
 * Never throws: if the server can't be reached, the pages still render, just without the client's logo.
 * Read once per page render, however many places (title, layout, page) ask for it.
 */
export const getOrganisationBranding = cache(async (): Promise<OrganisationBranding> => {
  // Read per request, never frozen into a build: Settings can change the name and logo at any time.
  // Outside the try, so the signal Next uses to stop prerendering is never swallowed.
  await connection();
  try {
    return await api.get<OrganisationBranding>("/public/organisation", { anonymous: true });
  } catch {
    return NONE;
  }
});
