import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
