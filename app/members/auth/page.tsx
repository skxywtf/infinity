'use client';

// This page handles the Ghost Magic Link landing.
// When a user clicks a Magic Link (e.g. infinityxz.ai/members/auth?token=...),
// they land here. The GhostPortal script (in layout) detects the token and completes the sign-in.
// It effectively just needs to exist and render the layout.

export default function MembersAuthPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Verifying Login...</h1>
                <p className="text-zinc-400">Please wait while we log you in.</p>
            </div>
        </div>
    );
}
