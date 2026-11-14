import type { NextConfig } from "next";

// Browser security headers on every page (guide 4.3). Deliberately no strict Content-Security-Policy: the
// pages load Google Fonts and inline styles, and a wrong policy would break them; frame-ancestors alone
// stops other sites from framing the portal (clickjacking).
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      // The login pages moved off hyphenated addresses; old links and bookmarks still land on them.
      { source: "/agent-login", destination: "/agent/login", permanent: true },
      { source: "/branch-login", destination: "/branch/login", permanent: true },
      { source: "/agent/staff/new", destination: "/agent/employees/new", permanent: true },
      { source: "/agent/staff/requests", destination: "/agent/employees/requests", permanent: true },
      { source: "/agent/staff", destination: "/agent/employees", permanent: true },
      { source: "/agent/dashboard/branches", destination: "/agent/employees", permanent: true },
      { source: "/agent/dashboard/branches/:id", destination: "/agent/employees/branches/:id", permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      // A phone photo of a director's ID, up to 5 MB, plus the rest of the form.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
