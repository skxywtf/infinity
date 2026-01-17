'use client';

import * as React from 'react';
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
      <style dangerouslySetInnerHTML={{
        __html: `
          body { overflow-x: hidden; width: 100%; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          html { scroll-padding-top: 100px; }

          /* --- HIDE VERCEL TOOLBAR --- */
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
      <NavBar />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 pt-8">
        <main className="w-full">
          <Hero />
          <Essence />
          <Footer />
        </main>
      </div>
    </div>
  );
}

/* NAV */
function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#060914]/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InfinityMark />
          <span className="font-bold tracking-wide text-lg">
            Infinity<span className="text-cyan-300">XZ</span>
          </span>
        </div>

        <nav className="hidden md:flex gap-6 text-sm text-white/70 font-medium">
          <Link href="/experienz" className="hover:text-white transition-colors">
            XperienZ
          </Link>
          <a href="#essence" className="hover:text-white transition-colors">Essence</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/experienz"
            className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 transition-colors"
          >
            Enter Console
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
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

/* HERO */
function Hero() {
  return (
    <section className="pt-12 md:pt-20 pb-10 grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-[11px] text-cyan-200 font-mono tracking-wider uppercase">
          Applied Strategic Intelligence  //  World Trade Factory
        </p>

        <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            The Future Is Thinking.
          </span>
        </h1>

        <div className="space-y-5">
          <p className="text-white/90 text-lg md:text-xl leading-relaxed font-light">
            Go beyond simple computation. InfinityXZ provides <strong className="font-semibold text-white">True Market Reasoning</strong>—an intelligence that understands the structural causality of global finance.
          </p>
        </div>

        {/* BUTTONS CONTAINER */}
        <div className="flex flex-col gap-4 pt-2">
          {/* Top Row: Main Actions */}
          <div>
            <a
              href="https://infinityxz.ai/trading-agent"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all shadow-[0_0_30px_-10px_rgba(6,182,212,0.5)]"
            >
              Applied Strategic Intelligence
              <ArrowRight size={14} />
            </a>
          </div>
          <div>
            <a
              href="https://www.worldtradefactory.ai/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 border border-cyan-500/30 bg-cyan-900/10 hover:bg-cyan-900/20 text-cyan-400 font-bold transition-all text-sm w-full sm:w-auto"
            >
              World Trade Factory
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/experienz"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all shadow-[0_0_30px_-10px_rgba(6,182,212,0.5)]"
            >
              Enter InfinityXZ(Beta)
              <ArrowRight size={18} />
            </Link>

            <a
              href="#essence"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
            >
              How it reasons
            </a>
          </div>

          {/* Bottom Row: World Trade Factory */}

        </div>

      </div>

      <div className="relative h-96 md:h-[600px] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-cyan-900/20 group">
        <div className="absolute inset-0 bg-gradient-to-t from-[#060914] via-transparent to-transparent z-10 transition-opacity duration-1000 group-hover:opacity-0" />
        <img
          src="infinity.png"
          alt="Infinity XZ AI Hero"
          className="w-full h-full object-cover transition-transform duration-1000 ease-in-out group-hover:scale-[1.4_1.1] group-hover:rotate-1"
        />
      </div>
    </section>
  );
}

/* ESSENCE */
function Essence() {
  return (
    <section id="essence" className="pt-16 md:pt-24 pb-20 grid md:grid-cols-3 gap-10 items-start border-t border-white/5 scroll-mt-24">
      <div className="md:col-span-1 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          The Essence of <br />
          <span className="text-cyan-400">Rational Intelligence</span>
        </h2>
        <p className="text-white/60 text-base leading-relaxed">
          Most AI models guess. Infinity defines. It is a living intelligence fabric
          that connects human intuition with rigorous data validation.
        </p>
      </div>

      <div className="md:col-span-2 grid sm:grid-cols-2 gap-5">
        <EssenceCard
          icon={<BrainCircuit size={20} />}
          title="Causal Logic Engine"
          text="Beyond pattern matching. Infinity identifies the 'why' behind market movements using structural macro analysis."
        />
        <EssenceCard
          icon={<Network size={20} />}
          title="Signal Synthesis"
          text="Filters out the noise of the internet to deliver a single, clean narrative derived from 200+ verified data streams."
        />
        <EssenceCard
          icon={<ShieldCheck size={20} />}
          title="Grounded Reality"
          text="Built with guardrails against hallucination. If the data isn't verified, Infinity doesn't trade on it."
        />
        <EssenceCard
          icon={<Zap size={20} />}
          title="Execution Velocity"
          text="From insight to decision in milliseconds. The XperienZ interface removes friction between thought and action."
        />
      </div>
    </section>
  );
}

function EssenceCard(props: { icon: React.ReactNode; title: string; text: string; }) {
  return (
    <motion.div
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-colors group"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3 text-cyan-300 mb-4">
        <div className="h-10 w-10 rounded-lg border border-cyan-500/20 bg-cyan-500/10 grid place-items-center group-hover:border-cyan-400/40 transition-colors">
          {props.icon}
        </div>
        <div className="text-sm font-bold tracking-wide text-white uppercase font-mono">
          {props.title}
        </div>
      </div>
      <p className="text-sm text-white/60 leading-relaxed">{props.text}</p>
    </motion.div>
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

/* BACKGROUND */
function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-[#060914]" />
      <div className="absolute -top-40 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="absolute top-1/3 right-0 h-[40vh] w-[50vw] rounded-full bg-blue-600/10 blur-[120px]" />
    </div>
  );
}
