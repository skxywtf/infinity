'use client';

import { useEffect } from 'react';

interface GhostPortalProps {
    apiUrl: string;
    contentApiKey: string;
}

export default function GhostPortal({ apiUrl, contentApiKey }: GhostPortalProps) {
    useEffect(() => {
        // Debug: Check if Ghost initializes
        const checkGhost = setInterval(() => {
            // @ts-ignore
            if (window.Ghost) {
                console.log("👻 Ghost Portal Detected & Active!");
                clearInterval(checkGhost);
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(checkGhost);
            // @ts-ignore
            if (!window.Ghost) console.warn("👻 Ghost Portal: 'window.Ghost' not found yet. Script might be blocked or auth failed.");
        }, 8000);

        return () => clearInterval(checkGhost);
    }, []);

    if (!contentApiKey) return null;

    return (
        <script
            defer
            src="https://unpkg.com/@tryghost/portal@latest/umd/portal.min.js"
            data-ghost={apiUrl}
            data-api={`${apiUrl}/ghost/api/content/`}
            data-key={contentApiKey}
            crossOrigin="anonymous"
        />
    );
}
