'use client';

import * as React from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Infinity as InfinityIcon,
  BrainCircuit,
  Network,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from 'next/link';

export default function InfinityXZ() {
  // Smooth scroll for anchor links only
  React.useEffect(() => {
    const handleScroll = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const element = document.getElementById(href.substring(1));
      if (element) {
        e.preventDefault();
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('click', handleScroll);
    return () => document.removeEventListener('click', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#060914] text-white font-sans selection:bg-cyan-500/30">
      {/* Global Safe Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          body { overflow-x: hidden; width: 100%; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          html { scroll-padding-top: 100px; }
        `
      }} />

      <AuroraBackground />
      <NavBar />

      <div className="mx
