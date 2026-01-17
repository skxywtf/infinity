import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Ghost Proxy - Bypass CORS
      {
        source: "/ghost/api/:path*",
        destination: "https://worldtradefactory.ghost.io/ghost/api/:path*",
      },
      {
        source: "/members/api/:path*",
        destination: "https://worldtradefactory.ghost.io/members/api/:path*",
      },
      // Existing Backend Proxy
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
