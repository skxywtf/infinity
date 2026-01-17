'use client';

import { useEffect } from 'react';

interface GhostPortalProps {
    apiUrl: string;
    contentApiKey: string;
}

export default function GhostPortal({ apiUrl, contentApiKey }: GhostPortalProps) {
    useEffect(() => {
        // Immediate Log: Is the Key Empty?
        console.log(`👻 Ghost Portal Init. URL: ${apiUrl}, Key Present: ${!!contentApiKey ? 'YES' : 'NO'}`);

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
            if (!window.Ghost) console.warn("👻 Ghost Portal: 'window.Ghost' not found. If 'Key Present' is NO, you must set GHOST_CONTENT_API_KEY in Vercel.");
        }, 8000);

        return () => clearInterval(checkGhost);
    }, [apiUrl, contentApiKey]);

    // Force Render script even if key is empty (it will fail to auth, but will load)
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
