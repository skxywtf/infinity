import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Ghost Proxy - Bypass CORS
      {
        source: "/ghost/api/:path*",
        destination: "https://www.worldtradefactory.ai/ghost/api/:path*",
      },
      {
        source: "/members/api/:path*",
        destination: "https://www.worldtradefactory.ai/members/api/:path*",
      },
      // Backend Proxy (Python)
      {
        source: "/api/analyze",
        destination: "http://127.0.0.1:8000/api/index.py",
      },
      {
        source: "/api/analyze-stream",
        destination: "http://127.0.0.1:8000/api/index.py",
      },
      {
        source: "/api/health",
        destination: "http://127.0.0.1:8000/api/index.py",
      },
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
