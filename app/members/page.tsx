'use client';

// Members Root Page (/members)
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Verifying Login...");
    const [error, setError] = useState("");

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get('token');
            const action = searchParams.get('action');

            if (!token) {
                setStatus("No token found.");
                return;
            }

            try {
                // Manually call the Ghost API via our Proxy to set the cookie
                const res = await fetch(`/members/api/member?token=${token}&action=${action}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (res.ok) {
                    setStatus("Success! Redirecting...");
                    // Give cookie a moment to settle
                    setTimeout(() => {
                        window.location.href = '/'; // Hard reload to ensure app state updates
                    }, 1000);
                } else {
                    const txt = await res.text();
                    console.error("Verification failed:", txt);
                    setError("Verification failed. Link might be expired.");
                    setStatus("Error");
                }
            } catch (e) {
                console.error("Network error:", e);
                setError("Network error occurred.");
                setStatus("Error");
            }
        };

        verifyToken();
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">{status}</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <p className="text-zinc-400">Please wait while we log you in.</p>
            </div>
        </div>
    );
}

export default function MembersRootPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white">Loading...</div>}>
            <VerificationContent />
        </Suspense>
    );
}
