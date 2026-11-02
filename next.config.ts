import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // A phone photo of a director's ID, up to 5 MB, plus the rest of the form.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
