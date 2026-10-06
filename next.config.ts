import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/defects/:path*",
        destination: `${BACKEND_URL}/api/defects/:path*`,
      },
      {
        source: "/api/defects",
        destination: `${BACKEND_URL}/api/defects`,
      },
      {
        source: "/api/portals/:path*",
        destination: `${BACKEND_URL}/api/portals/:path*`,
      },
      {
        source: "/api/portals",
        destination: `${BACKEND_URL}/api/portals`,
      },
      {
        source: "/api/vapt/:path*",
        destination: `${BACKEND_URL}/api/vapt/:path*`,
      },
      {
        source: "/api/vapt",
        destination: `${BACKEND_URL}/api/vapt`,
      },
      {
        source: "/api/compat/:path*",
        destination: `${BACKEND_URL}/api/compat/:path*`,
      },
      {
        source: "/api/compat",
        destination: `${BACKEND_URL}/api/compat`,
      },
      {
        source: "/api/performance/:path*",
        destination: `${BACKEND_URL}/api/performance/:path*`,
      },
      {
        source: "/api/performance",
        destination: `${BACKEND_URL}/api/performance`,
      },
      {
        source: "/api/reports/:path*",
        destination: `${BACKEND_URL}/api/reports/:path*`,
      },
      {
        source: "/api/reports",
        destination: `${BACKEND_URL}/api/reports`,
      },
      {
        source: "/api/executive-dashboard/:path*",
        destination: `${BACKEND_URL}/api/executive-dashboard/:path*`,
      },
      {
        source: "/api/executive-dashboard",
        destination: `${BACKEND_URL}/api/executive-dashboard`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_URL}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
