import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfinityXZ",
  description: "Infinity AI - AGI for Global Finance",
};

import GhostPortal from "@/components/GhostPortal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GhostPortal
          apiUrl="https://infinityxz.ai"
          contentApiKey={process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY || process.env.GHOST_CONTENT_API_KEY || ""} // Key is OK
        />
      </body>
    </html>
  );
}
