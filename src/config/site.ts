/**
 * Fallbacks only. The organisation's own name comes from Admin → Settings (see `lib/api/organisation`);
 * these show only before it has been set up.
 */
export const siteConfig = {
  name: "Staff portal",
  shortName: "Portal",
  description: "Employee, attendance and agent payment management by DhwarshHub.",
} as const;

/** Login surface per principal type. Mirrors PRINCIPAL_TYPES in roles.ts. */
export const LOGIN_ROUTES = {
  STAFF: "/login",
  AGENT: "/agent-login",
  DEVICE: "/kiosk/clock",
} as const;
