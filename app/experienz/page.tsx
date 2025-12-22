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
