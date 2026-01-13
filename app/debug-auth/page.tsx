'use client';

import React, { useState, useEffect } from 'react';

export default function DebugAuthPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/debug-connectivity')
            .then(res => res.json())
            .then(setData)
            .catch(err => setData({ error: err.message }))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <h1 className="text-2xl font-bold mb-4">Authentication Diagnostics</h1>

            <div className="mb-8">
                <h2 className="text-xl text-yellow-500 mb-2">1. Browser Context</h2>
                <div className="bg-gray-900 p-4 rounded border border-gray-800">
                    <p>Origin: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
                    <p>Cookies: {typeof document !== 'undefined' ? document.cookie : ''}</p>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl text-cyan-500 mb-2">2. Server Connectivity Check</h2>
                {loading ? (
                    <div>Running Tests...</div>
                ) : (
                    <pre className="bg-gray-900 p-4 rounded border border-gray-800 overflow-auto text-xs">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                )}
            </div>

            <div className="text-gray-500 text-sm">
                Check 'tests.dns' and 'tests.connectivity'. <br />
                If DNS resolves to a Private IP (e.g. 10.x.x.x) or Fetch Failed with PRIVATE, that is the root cause.
            </div>
        </div>
    );
}
