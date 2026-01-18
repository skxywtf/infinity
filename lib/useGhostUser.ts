import { useState, useEffect } from 'react';

export interface GhostUser {
    uuid: string;
    email: string;
    name: string;
    firstname: string;
    avatar_image: string;
    subscribed: boolean;
    subscriptions: any[];
    paid: boolean;
}

export function useGhostUser() {
    const [user, setUser] = useState<GhostUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchUser() {
            try {
                const res = await fetch('/members/api/member', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setUser(data);
                } else {
                    if (isMounted) setUser(null);
                }
            } catch (error) {
                console.error("Ghost Auth Check Failed:", error);
                if (isMounted) setUser(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchUser();

        return () => { isMounted = false; };
    }, []);

    return { user, loading };
}
