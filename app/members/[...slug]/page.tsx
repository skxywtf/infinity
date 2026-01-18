'use client';

// Catch-All Page for Ghost Members Routes (e.g. /members/auth, /members/signin)
// This ensures that whatever link structure Ghost generates, we render the layout
// so the GhostPortal script can verify the token.

export default function MembersCatchAllPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Verifying Login...</h1>
                <p className="text-zinc-400">Please wait while we log you in.</p>
            </div>
        </div>
    );
}
