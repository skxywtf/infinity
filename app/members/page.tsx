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
                    const originalCookie = res.headers.get("X-Debug-Set-Cookie-Original");
                    const sanitizedCookie = res.headers.get("X-Debug-Set-Cookie-Sanitized");

                    // Manually signal to Ghost Portal that we are signed in
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('ghost-members:signedin', 'true');
                    }

                    setStatus("Success! Session Cookie Received.");
                    setError(`Debug Info:\nOriginal: ${originalCookie}\nSanitized: ${sanitizedCookie}`);

                    // Redirect to Home after success
                    setTimeout(() => { window.location.href = '/'; }, 2000);
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

    const checkSession = async () => {
        try {
            const res = await fetch('/members/api/member');
            const txt = await res.text();
            alert(`Session Check Result (200=Good, 401=Bad): ${res.status}\nBody: ${txt.substring(0, 100)}`);
            if (res.ok) window.location.href = '/';
        } catch (e) {
            alert("Check failed: " + e);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="text-center max-w-2xl break-all">
                <h1 className="text-2xl font-bold mb-4">{status}</h1>
                {error && (
                    <div className="bg-zinc-900 p-4 rounded mb-4 text-xs font-mono text-left whitespace-pre-wrap border border-zinc-800">
                        {error}
                    </div>
                )}
                <button
                    onClick={checkSession}
                    className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-zinc-200 transition"
                >
                    Test Session & Go Home
                </button>
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
