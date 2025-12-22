'use client';

import * as React from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Infinity as InfinityIcon } from "lucide-react";
import Link from 'next/link';
import { motion } from "framer-motion";

export default function ExperienzPage() {
  return (
    <div className="min-h-screen bg-[#060914] text-white font-sans selection:bg-cyan-500/30 flex flex-col">
      <AuroraBackground />
      
      {/* HEADER */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft size={16} />
          Return Home
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-cyan-500/80 animate-pulse hidden sm:block">
             ● LIVE CONNECTION
          </span>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[1400px] grid lg:grid-cols-[1fr_2fr] gap-8 items-center">
          
          {/* LEFT: Info & Auth */}
          <div className="space-y-8 order-2 lg:order-1">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <InfinityMark />
                <span className="font-bold tracking-wide text-xl">
                  Infinity<span className="text-cyan-300">XZ</span>
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Enter the Neural Fabric
              </h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                This is the XperienZ layer. A closed beta environment for professionals who demand 
                an AI partner that respects the gravity of financial decisions.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
              <SignedOut>
                <div className="space-y-4">
                  <p className="text-sm text-white/80 font-medium">Authenticate to access the terminal:</p>
                  <SignInButton mode="modal">
                    <button className="w-full rounded-xl bg-cyan-500 text-[#060914] font-bold px-6 py-3 hover:bg-cyan-400 transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]">
                      Authenticate Access
                    </button>
                  </SignInButton>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono text-center">
                    // Credentials Verified by Clerk
                  </p>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-cyan-400 bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/20">
                    <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-sm font-mono font-bold">ACCESS GRANTED</span>
                  </div>
                  <p className="text-sm text-white/60">
                    You are connected to the World Trade Factory reasoning engine.
                  </p>
                  <a
                    href="https://www.worldtradefactory.ai/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                  >
                    Visit Main HQ <ArrowRight size={14} />
                  </a>
                </div>
              </SignedIn>
            </div>
          </div>

          {/* RIGHT: The Bot Frame */}
          <div className="order-1 lg:order-2 h-[600px] md:h-[700px] w-full relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-blue-600/10 rounded-3xl blur-2xl" />
             <div className="relative h-full w-full rounded-2xl border border-white/10 bg-[#0B101F]/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Fake Terminal Header */}
                <div className="h-10 border-b border-white/10 bg-black/40 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                  <div className="ml-4 text-[10px] font-mono text-white/30">root@infinity-xz:~</div>
                </div>
                
                {/* The Bot Iframe */}
                <iframe
                  src="https://stockbot-sigma.vercel.app/"
                  title="InfinityXZ StockBot"
                  className="flex-grow w-full border-0 bg-transparent"
                  loading="eager"
                />
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function InfinityMark() {
  return (
    <div className="relative h-8 w-8 flex-shrink-0">
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 blur-sm"
        initial={{ scale: 0.9, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[2px] rounded-full border border-white/20 bg-[#060914] grid place-items-center z-10">
        <InfinityIcon size={18} className="text-cyan-300" />
      </div>
    </div>
  );
}

function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-[#060914]" />
      <div className="absolute top-[-20%] left-[-10%] h-[80vh] w-[80vw] rounded-full bg-cyan-900/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[80vh] w-[80vw] rounded-full bg-blue-900/10 blur-[150px]" />
    </div>
  );
}
