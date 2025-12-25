'use client';

import * as React from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Infinity as InfinityIcon } from "lucide-react";
import Link from 'next/link';
import { motion } from "framer-motion";
import ChatInterface from '@/components/chat/ChatInterface';

export default function ExperienzPage() {
  return (
    <div className="min-h-screen bg-[#060914] text-white font-sans selection:bg-cyan-500/30 flex flex-col">

      {/* --- STABILIZATION & VERCEL HIDER --- */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* 1. Stop the "bounce" / jump when hitting top/bottom */
          html, body {
            overscroll-behavior-y: none;
            overflow-x: hidden;
            width: 100%;
          }

          /* 2. Hide Scrollbar but keep functionality */
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          /* 3. Hide Vercel Toolbar */
          #vercel-toolbar,
          vercel-live-feedback,
          [data-vercel-toolbar] {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
          }
        `
      }} />

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
                an AI partner that respects the gravity of financial decisions in a live setting. For users that need the intelligence organized in specific categories/areas - use the World Trade Factory link.
              </p>
            </div>

            {/* BUTTON: World Trade Factory */}
            <div>
              <a
                href="https://www.worldtradefactory.ai/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all shadow-[0_0_30px_-10px_rgba(6,182,212,0.5)] mb-6"
              >
                World Trade Factory
                <ArrowRight size={14} />
              </a>
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
                </div>
              </SignedIn>
            </div>
          </div>

          <div className="order-1 lg:order-2 h-[600px] md:h-[700px] w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-blue-600/10 rounded-3xl blur-2xl" />
            <ChatInterface />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* FOOTER */
function Footer() {
  return (
    <footer className="border-t border-white/10 mt-12 bg-[#03050a] w-full">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-12 flex flex-col xl:flex-row items-center justify-between gap-10 text-xs text-white/40">
        <div className="flex items-center gap-3 xl:w-1/3">
          <InfinityMark />
          <span className="font-bold text-white/60 text-sm tracking-wide">InfinityXZ</span>
        </div>

        <div className="flex justify-center gap-4 xl:w-1/3">
          <SocialIcon href="https://instagram.com/skxywtf" img="https://worldtradefactory.ghost.io/content/images/2025/04/Instagram.JPG" alt="Instagram" size={20} />
          <SocialIcon href="https://www.facebook.com/profile.php?id=61575285152608" img="https://worldtradefactory.ghost.io/content/images/2025/04/Meta-1.JPG" alt="Meta" size={22} />
          <SocialIcon href="https://x.com/skxywtf" img="https://worldtradefactory.ghost.io/content/images/2025/04/X.JPG" alt="X" size={18} />
          <SocialIcon href="https://www.linkedin.com/in/sajeeshkakkat/" img="https://worldtradefactory.ghost.io/content/images/2025/04/linked.JPG" alt="LinkedIn" size={22} />
          <SocialIcon href="https://wa.me/14802802924" img="https://worldtradefactory.ghost.io/content/images/2025/04/whatsapp.JPG" alt="WhatsApp" size={20} />
        </div>

        <div className="text-center xl:text-right leading-relaxed xl:w-1/3 font-medium">
          <strong className="text-white block mb-2 text-sm tracking-wide">World Trade Factory™</strong>

          <a href="https://maps.google.com/?q=2390+E+Camelback+Rd,+STE+130,+Phoenix,+AZ+85016" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-cyan-400 transition-colors block">
            2390 E Camelback Rd, STE 130, Phoenix, AZ 85016
          </a>

          <div className="mt-2 space-y-1">
            <div>
              <span className="text-white/50 mr-2">Phone:</span>
              <a href="tel:+14802802924" className="text-white/90 hover:text-cyan-400 transition-colors">+1 (480) 280-2924</a>
            </div>
            <div>
              <span className="text-white/50 mr-2">Email:</span>
              <a href="mailto:sage@worldtradefactory.com" className="text-white/90 hover:text-cyan-400 transition-colors">sage@worldtradefactory.com</a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 text-white/50">
            © 2025 <a href="https://www.skxywtf.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SKXYWTF LLC</a> | All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, img, alt, size }: { href: string; img: string; alt: string; size: number }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#1a1a1a] rounded-lg hover:bg-[#252525] hover:scale-105 transition-all duration-300 shadow-lg shadow-black/20 border border-white/5">
      <img src={img} alt={alt} style={{ width: size, height: size }} className="object-contain opacity-90 hover:opacity-100" />
    </a>
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
      <div className="absolute -top-40 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="absolute top-1/3 right-0 h-[40vh] w-[50vw] rounded-full bg-blue-600/10 blur-[120px]" />
    </div>
  );
}
