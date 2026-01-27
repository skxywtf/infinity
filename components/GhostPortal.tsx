'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface GhostPortalProps {
    apiUrl: string;
    contentApiKey: string;
}

export default function GhostPortal({ apiUrl, contentApiKey }: GhostPortalProps) {
    const pathname = usePathname();

    // Disable Ghost Portal script on Verification Pages to prevent "Token Stealing"
    // The script aggressively scrubs URL params, breaking our manual verification logic.
    if (pathname?.startsWith('/members')) {
        return null;
    }

    // Dynamic URL: Use current origin if we are trying to proxy via "infinityxz.ai"
    // This allows Preview Deployments to work (proxying via themselves) instead of crossing origins.
    const effectiveApiUrl = typeof window !== 'undefined' && apiUrl.includes('infinityxz.ai')
        ? window.location.origin
        : apiUrl;

    useEffect(() => {
        // use console.error to ensure visibility in filtered consoles
        console.error(`👻 GHOST DEBUG: Component Mounted.`);
        console.error(`👻 GHOST DEBUG: Effective API URL: ${effectiveApiUrl}`);
        console.error(`👻 GHOST DEBUG: Key Length: ${contentApiKey?.length || 0} (First 5: ${contentApiKey?.substring(0, 5)}...)`);

        // Force Clear Ghost LocalStorage Cache - DISABLED
        // We must preserve session keys like 'ghost-members:signedin'.
        // The stale config issue is handled by the key prop on the script tag.
        /*
        if (typeof window !== 'undefined') {
            try {
               // ... (Removed aggressive clearing)
            } catch (e) { }
        }
        */

        const checkGhost = setInterval(() => {
            // @ts-ignore
            if (window.Ghost) {
                console.error("👻 GHOST SUCCESS: window.Ghost is available!");
                clearInterval(checkGhost);
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(checkGhost);
            // @ts-ignore
            if (!window.Ghost) console.error("👻 GHOST FAILURE: Timeout waiting for window.Ghost.");
        }, 10000);

        return () => clearInterval(checkGhost);
    }, [apiUrl, contentApiKey, effectiveApiUrl]);

    /*
    return (
        <script
            key={effectiveApiUrl} // Force re-render if URL changes
            src={`https://unpkg.com/@tryghost/portal@latest/umd/portal.min.js?v=${Date.now()}`} // FORCE FRESH SCRIPT
            data-ghost={effectiveApiUrl}
            data-api={`${effectiveApiUrl}/ghost/api/content/`}
            data-key={contentApiKey}
            crossOrigin="anonymous"
            onLoad={() => console.error("👻 GHOST DEBUG: Script onLoad fired (Network Success).")}
            onError={(e) => console.error("👻 GHOST DEBUG: Script onError fired (Network Falure).", e)}
        />
    );
    */
    return null;
}
