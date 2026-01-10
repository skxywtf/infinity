'use client';

import React, { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Infinity as InfinityIcon, ArrowRight, Loader2 } from 'lucide-react';

function LoginContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('next') || '/experienz';
    const [email, setEmail] = useState('');
    const [isEmailLoading, setIsEmailLoading] = useState(false);

    const handleLogin = (provider: string) => {
        signIn(provider, { callbackUrl });
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsEmailLoading(true);
        // Flow B: SignIn via NextAuth Email Provider
        await signIn('email', { email, callbackUrl });
        // Note: signIn redirects by default or we can handle error
        setIsEmailLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#060914] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#0B101F]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="relative h-12 w-12 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full blur-sm opacity-50" />
                            <InfinityIcon size={32} className="text-cyan-400 relative z-10" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-white/40 text-sm">Sign in to access the Neural Fabric.</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handleLogin('google')}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        {/* Google Icon SVG */}
                        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 3.02v4.2c4.68 2.68 9.8 1.61 12.02-2.95.7-1.42.7-3.22.64-4.24-.05-.8-.28-2.61-.28-2.61z" /><path fill="currentColor" d="M12.18 14.83c-2.62 0-4.64-1.61-5.4-3.83h-4.3v2.85c1.91 3.53 5.37 5.79 9.7 5.79 2.5 0 4.2-.67 6.5-2.02l-1.95-4.2a6.3 6.3 0 01-4.55 1.41z" /><path fill="currentColor" d="M6.78 11a6.3 6.3 0 010-4.03l-4.3-2.85A10.8 10.8 0 001.27 11a10.8 10.8 0 001.21 6.85l3.85-2.85c-.27-.72-.4-1.48-.48-2z" /><path fill="currentColor" d="M12.18 7.17c1.55 0 2.5.64 3.08 1.14l2.5-2.22a9.4 9.4 0 00-5.58-2.1c-4.33 0-7.79 2.26-9.7 5.79l4.3 3.85c.76-2.22 2.78-3.83 5.4-3.83z" /></svg>
                        Continue with Google
                    </button>

                    <button
                        onClick={() => handleLogin('facebook')}
                        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white font-semibold py-3 px-4 rounded-xl hover:bg-[#166fe5] transition-colors"
                    >
                        {/* Facebook Icon SVG */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        Continue with Facebook
                    </button>
                </div>

                <div className="flex items-center gap-4 my-6">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-[10px] uppercase text-white/30 font-bold tracking-widest">Or</span>
                    <div className="h-px bg-white/10 flex-1" />
                </div>

                {/* Email Magic Link Form */}
                <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isEmailLoading}
                        className="w-full flex items-center justify-center gap-3 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-semibold py-3 px-4 rounded-xl hover:bg-cyan-500/20 transition-colors shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEmailLoading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                        {isEmailLoading ? "Sending Link..." : "Login with Email"}
                    </button>
                </form>

                <p className="mt-8 text-center text-[10px] text-white/30">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                    <br />Authenticating with World Trade Factory Neural Grid.
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#060914]" />}>
            <LoginContent />
        </Suspense>
    );
}
