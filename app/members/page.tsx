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
                    // Manually signal to Ghost Portal that we are signed in
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('ghost-members:signedin', 'true');
                    }

                    setStatus("Login Successful. Redirecting...");

                    // Redirect to Home after success
                    setTimeout(() => { window.location.href = '/'; }, 500);
                } else {
                    console.error("Verification failed");
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="text-center max-w-2xl">
                {!error ? (
                    <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                        <h1 className="text-xl font-medium">{status}</h1>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-bold text-red-500 mb-2">{status}</h1>
                        <p className="text-zinc-400">{error}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-zinc-200"
                        >
                            Return Home
                        </button>
                    </>
                )}
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
