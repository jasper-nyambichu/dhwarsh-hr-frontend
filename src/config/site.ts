export const siteConfig = {
  name: "Dhwarsh HR",
  shortName: "Dhwarsh",
  description: "HR and payroll management.",
} as const;

/** Login surface per principal type. Mirrors PRINCIPAL_TYPES in roles.ts. */
export const LOGIN_ROUTES = {
  STAFF: "/login",
  AGENT: "/agent-login",
  DEVICE: "/kiosk/clock",
} as const;
