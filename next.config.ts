import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./lib/security/headers";

const securityHeaders = Object.entries(buildSecurityHeaders()).map(([key, value]) => ({
  key,
  value,
}));

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/(feed|search|posts|marketplace)",
        headers: [{ key: "Cache-Control", value: "private, max-age=30, stale-while-revalidate=60" }],
      },
    ];
  },
};

export default nextConfig;
