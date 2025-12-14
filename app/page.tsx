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
  Activity,
  FileText,
  TrendingUp,
  Globe,
  BarChart3,
  Newspaper,
  CandlestickChart,
  Filter,
  Briefcase,
  ScanEye,
  LineChart,
  Percent,
  ArrowDownUp,
  Calendar,
  Bitcoin,
  Gem,
  RefreshCw,
  Database,
  Clock,
  Map as MapIcon,
  Megaphone
} from "lucide-react";

/* =========================
   ROOT
========================= */

export default function InfinityXZ() {
  React.useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#060914] text-white font-sans overflow-x-hidden">
      <GlobalStyles />
      <AuroraBackground />
      <NavBar />

      <div className="mx-auto max-w-[1600px] px-6 pt-8">
        <div className="flex items-start gap-10">

          {/* MAIN CONTENT */}
          <main className="flex-1 w-full max-w-none pb-20 min-w-0">
            <Hero />
            <Essence />
            <ExperienzCTA />
            <Footer />
          </main>

          {/* OPTIONAL SIDEBAR (SAFE, NON-INTRUSIVE) */}
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

/* =========================
   GLOBAL STYLES
========================= */

function GlobalStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      html, body { overflow-x: hidden; scroll-behavior: smooth; }
      vercel-live-feedback { display:none!important; }
      * { scroll-margin-top: 96px; }
      .no-scrollbar::-webkit-scrollbar { display:none; }
      .no-scrollbar { scrollbar-width:none; }
    `}} />
  );
}

/* =========================
   RIGHT PANEL (UNCHANGED)
========================= */

function RightPanel() {
  const menuItems = [
    { label: "Pulse", href: "https://www.worldtradefactory.ai/pulse", icon: <Activity size={16} /> },
    { label: "Tariffs", href: "https://www.worldtradefactory.ai/tariffs", icon: <FileText size={16} /> },
    { label: "Prediction", href: "https://www.worldtradefactory.ai/prediction", icon: <BrainCircuit size={16} /> },
    { label: "Economy", href: "https://www.worldtradefactory.ai/country", icon: <Globe size={16} /> },
    { label: "Indices", href: "https://www.worldtradefactory.ai/indices", icon: <BarChart3 size={16} /> },
    { label: "News", href: "https://www.worldtradefactory.ai/news", icon: <Newspaper size={16} /> },
    { label: "Stocks", href: "https://www.worldtradefactory.ai/overview", icon: <CandlestickChart size={16} /> },
    { label: "Screener", href: "https://www.worldtradefactory.ai/screeners", icon: <Filter size={16} /> },
    { label: "Assets", href: "https://www.worldtradefactory.ai/stock", icon: <Briefcase size={16} /> },
    { label: "StoX-RaY", href: "https://www.worldtradefactory.ai/stox-ray", icon: <ScanEye size={16} /> },
    { label: "Charts", href: "https://www.worldtradefactory.ai/chart", icon: <LineChart size={16} /> },
    { label: "Trend", href: "https://www.worldtradefactory.ai/trend", icon: <TrendingUp size={16} /> },
    { label: "Rates", href: "https://www.worldtradefactory.ai/rates-and-bonds-dashboard/", icon: <Percent size={16} /> },
    { label: "Yield", href: "https://www.worldtradefactory.ai/yield", icon: <ArrowDownUp size={16} /> },
    { label: "Events", href: "https://www.worldtradefactory.ai/events", icon: <Calendar size={16} /> },
    { label: "Crypto", href: "https://www.worldtradefactory.ai/cryptocurrencies", icon: <Bitcoin size={16} /> },
    { label: "WTF Coin", href: "https://www.worldtradefactory.ai/future", icon: <Gem size={16} /> },
    { label: "Forex", href: "https://www.worldtradefactory.ai/forex", icon: <RefreshCw size={16} /> },
    { label: "FRED", href: "https://www.worldtradefactory.ai/fred", icon: <Database size={16} /> },
    { label: "Clock", href: "https://www.worldtradefactory.ai/clock", icon: <Clock size={16} /> },
    { label: "Map", href: "https://www.worldtradefactory.ai/map", icon: <MapIcon size={16} /> },
    { label: "Advertise", href: "https://www.worldtradefactory.ai/advertise", icon: <Megaphone size={16} /> }
  ];

  return (
    <aside className="hidden xl:block w-72 flex-shrink-0">
      <div className="sticky top-[96px]">
        <nav className="h-[calc(100vh-120px)] rounded-xl border border-white/10 bg-[#0B101F]/90 backdrop-blur-xl overflow-hidden">
          <ul className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-0.5">
            {menuItems.map((item, i) => (
              <li key={i} className="px-3">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase text-white/60 hover:text-white hover:bg-white/5 rounded-md transition"
                >
                  {item.icon}
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

/* =========================
   EXPERIENZ (BOT FIXED)
========================= */

function ExperienzCTA() {
  return (
    <section
      id="experienz"
      className="mt-24 rounded-3xl border border-white/10 bg-[#0B101F] overflow-hidden"
    >
      <div className="grid md:grid-cols-[0.9fr_2.1fr]">
        <div className="p-10 space-y-6">
          <h3 className="text-4xl font-bold">Enter InfinityXZ</h3>
          <p className="text-white/70 max-w-md">
            Experience the difference between a chatbot and a
            <strong className="text-white"> World Trade Factory analyst.</strong>
          </p>
        </div>

        {/* WIDE BOT PANEL */}
        <div className="p-6 flex items-center justify-center">
          <div className="w-full h-[620px] rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <iframe
              src="https://stockbot-sigma.vercel.app/"
              title="InfinityXZ Bot"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   REMAINING COMPONENTS
========================= */
/* Hero, Essence, Footer, NavBar, Background
   remain exactly as you already had them.
   No logic changes required.
*/
