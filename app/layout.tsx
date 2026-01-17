import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfinityXZ",
  description: "Infinity AI - AGI for Global Finance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.GHOST_CONTENT_API_KEY && (
          <script
            defer
            src="https://unpkg.com/@tryghost/portal@latest/umd/portal.min.js"
            data-ghost={process.env.GHOST_API_URL || "https://worldtradefactory.ghost.io"}
            data-key={process.env.GHOST_CONTENT_API_KEY}
            data-api={process.env.GHOST_API_URL ? `${process.env.GHOST_API_URL}/ghost/api/content/` : "https://worldtradefactory.ghost.io/ghost/api/content/"}
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
