import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
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
