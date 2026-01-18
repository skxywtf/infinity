'use client';

// Members Root Page (/members)
// Handles cases where Ghost link is just /members/?token=...
export default function MembersRootPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Verifying Login...</h1>
                <p className="text-zinc-400">Please wait while we log you in.</p>
            </div>
        </div>
    );
}
