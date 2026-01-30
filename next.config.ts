import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In development, we proxy to the local Python server
    // In production (Vercel), we rewrite to the serverless function path
    const isDev = process.env.NODE_ENV === "development";
    const apiBase = isDev ? "http://127.0.0.1:8000/api" : "/api";

    console.log(`[Next.js Rewrite] Environment: ${process.env.NODE_ENV}, Rewriting /api/* to: ${apiBase}/*`);

    return [
      // Backend Proxy (Python)
      {
        source: "/api/analyze",
        destination: isDev ? `${apiBase}/index.py` : "/api/index",
      },
      {
        source: "/api/analyze-stream",
        destination: isDev ? `${apiBase}/index.py` : "/api/index",
      },
      {
        source: "/api/health",
        destination: isDev ? `${apiBase}/index.py` : "/api/index",
      },
      {
        source: "/api/:path*",
        destination: isDev ? `${apiBase}/:path*` : "/api/index",
      },
    ];
  },
};

export default nextConfig;
