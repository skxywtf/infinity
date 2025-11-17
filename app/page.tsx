﻿'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Infinity as InfinityIcon,
    Cpu,
    LineChart,
    Users,
    Zap,
} from "lucide-react";

export default function InfinityXZ() {
    const [count, setCount] = useState(1289);

    useEffect(() => {
        const id = setInterval(() => {
            setCount((c) => c + Math.floor(Math.random() * 3));
        }, 3000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="min-h-screen bg-[#060914] text-white overflow-x-hidden">
            <AuroraBackground />
            <NavBar />
            <main className="relative mx-auto max-w-6xl px-6 pb-20">
                <Hero count={count} />
                <Essence />
                <ExperienzCTA />
            </main>
            <Footer />
        </div>
    );
}

/* NAV */

function NavBar() {
    return (
        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <InfinityMark />
                    <span className="font-semibold tracking-wide">
                        Infinity<span className="text-cyan-300">XZ</span>
                    </span>
                </div>
                <nav className="hidden md:flex gap-6 text-sm text-white/70">
                    <a href="#essence" className="hover:text-white">
                        Essence
                    </a>
                    <a href="#experienz" className="hover:text-white">
                        Experienz
                    </a>
                </nav>
                <SignedOut>
                    <a
                        href="#experienz"
                        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400"
                    >
                        Join early access
                        <ArrowRight size={14} />
                    </a>
                </SignedOut>

                <SignedIn>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-white/70 hidden sm:inline">
                            Signed in to InfinityXZ
                        </span>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </SignedIn>

            </div>
        </header>
    );
}

function InfinityMark() {
    return (
        <div className="relative h-8 w-8">
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 blur-sm"
                initial={{ scale: 0.9, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-[2px] rounded-full border border-white/20 bg-[#060914] grid place-items-center">
                <InfinityIcon size={18} className="text-cyan-300" />
            </div>
        </div>
    );
}

/* HERO */

function Hero({ count }: { count: number }) {
    return (
        <section className="pt-16 md:pt-20 pb-10 grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                    Financial AGI   World Trade Factory   XperienZ Layer
                </p>
                <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                    <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                        The Future Is Thinking
                    </span>
                </h1>
                <p className="text-white/75 text-sm md:text-base">
                    InfinityXZ is the XperienZ of superintelligence for global finance.
                    It listens to markets, learns from data, and responds with clear,
                    actionable insight for investors and institutions.
                </p>
                <p className="text-white/60 text-sm md:text-base">
                    It connects human intuition with Artificial General Intelligence for
                    global trade, policy and capital flows. Business at the speed of AI.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                        href="#experienz"
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 bg-cyan-500 text-black font-semibold hover:bg-cyan-400"
                    >
                        Get early access
                        <ArrowRight size={16} />
                    </a>
                    <a
                        href="#essence"
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm"
                    >
                        Learn more
                    </a>
                </div>
                <div className="flex gap-6 pt-3 text-xs text-white/60">
                    <Stat label="Pioneers joined" value={count.toLocaleString()} />
                    <Stat label="Markets" value="200+ live feeds" />
                </div>
            </div>
<div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl">
  <img
    src="https://www.worldtradefactory.ai/content/images/2025/04/ChatGPT-Image-Apr-20--2025--09_23_13-PM.png"
    alt="Infinity XZ AI Hero"
    className="w-full h-full object-cover"
  />
</div>
        </section>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="uppercase tracking-wide text-[10px] text-white/40">
                {label}
            </div>
            <div className="text-sm font-semibold">{value}</div>
        </div>
    );
}

function Orb() {
    return (
        <div className="absolute inset-0 grid place-items-center">
            <div className="relative w-56 h-56 md:w-64 md:h-64">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-600/20 blur-2xl" />
                <div className="absolute inset-3 rounded-full border border-cyan-300/40" />
                <motion.div
                    className="absolute inset-6 rounded-full border border-white/15"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-10 rounded-full border border-white/10" />
                <div className="absolute inset-0 grid place-items-center">
                    <InfinityIcon className="text-cyan-300" size={40} />
                </div>
            </div>
        </div>
    );
}

/* ESSENCE */

function Essence() {
    return (
        <section
            id="essence"
            className="pt-8 md:pt-12 grid md:grid-cols-3 gap-8 items-start"
        >
            <div className="md:col-span-1 space-y-3">
                <h2 className="text-2xl md:text-3xl font-semibold">
                    The Essence of Financial AGI
                </h2>
                <p className="text-white/70 text-sm">
                    Infinity AI is a living intelligence fabric for markets, policy and
                    trade. It does not just answer questions. It builds a view of the
                    world and acts on it.
                </p>
            </div>
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-5">
                <EssenceCard
                    icon={<Cpu size={18} />}
                    title="Cognition Fabric"
                    text="Deep reasoning over macro, sectors and microstructure signals."
                />
                <EssenceCard
                    icon={<LineChart size={18} />}
                    title="Market Synthesis"
                    text="Streams of prices and data fused into single, clean narratives."
                />
                <EssenceCard
                    icon={<Users size={18} />}
                    title="Experienz XZ"
                    text="A human and AI interface designed for decision speed and clarity."
                />
                <EssenceCard
                    icon={<Zap size={18} />}
                    title="Action Loop"
                    text="From signal to execution. Business at the speed of AI."
                />
            </div>
        </section>
    );
}

function EssenceCard(props: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <motion.div
            className="rounded-2xl border border-white/15 bg-white/5 p-4 hover:bg-white/10"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-center gap-2 text-cyan-300">
                <div className="h-8 w-8 rounded-xl border border-cyan-400/30 bg-cyan-500/10 grid place-items-center">
                    {props.icon}
                </div>
                <div className="text-sm font-semibold">{props.title}</div>
            </div>
            <p className="mt-2 text-xs text-white/70">{props.text}</p>
        </motion.div>
    );
}

/* EXPERIENZ CTA */

function ExperienzCTA() {
    return (
        <section
            id="experienz"
            className="mt-14 rounded-3xl border border-white/15 bg-white/5 overflow-hidden"
        >
            <div className="grid md:grid-cols-2">
                <div className="p-7 md:p-9 space-y-4">
                    <h3 className="text-2xl font-semibold">
                        Enter InfinityXZ - The XperienZ of Superintelligence
                    </h3>
                    <p className="text-sm text-white/70">
                        Be part of the early access program for investors, analysts and
                        builders working with Artificial General Intelligence for global
                        finance. 
                        <br/>
                       <a 
  href="https://www.worldtradefactory.ai/" 
  class="text-blue-600 underline hover:text-blue-800 hover:no-underline font-medium transition-all"
  target="_blank"
  rel="noopener"
>
  Sign In
</a>
                    </p>
                    <div className="pt-4">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="w-full sm:w-auto rounded-xl bg-cyan-500 text-black font-semibold px-6 py-3 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 hover:shadow-cyan-400/30 transition">
                                    Enter InfinityXZ
                                </button>
                            </SignInButton>
                            <p className="mt-3 text-xs text-white/50">
                                Sign in with Google
                            </p>
                        </SignedOut>

                        <SignedIn>
                            <p className="mt-3 text-xs text-white/60">
                                You’re already inside InfinityXZ. Use the menu above to access your
                                workspace or sign out.
                            </p>
                        </SignedIn>
                    </div>

                </div>
                <div className="relative bg-gradient-to-br from-cyan-500/15 via-indigo-500/10 to-transparent p-7 md:p-0 min-h-[220px]">
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl p-5 max-w-xs text-sm text-white/75">
                            <div className="text-xs uppercase tracking-wide text-white/50 mb-2">
                                Infinity AI
                            </div>
                            <div className="font-semibold mb-1">
                                Business @ the speed of AI
                            </div>
                            <p className="text-xs text-white/65">
                                A continuous intelligence loop across markets, trade and macro
                                powering the World Trade Factory.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* FOOTER AND BACKGROUND */

function Footer() {
    return (
        <footer className="border-t border-white/15 mt-12">
            <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
                <div className="flex items-center gap-2">
                    <InfinityMark />
                    <span>Infinity AI - AGI for Global Finance</span>
                </div>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-white">
                        Privacy
                    </a>
                    <a href="#" className="hover:text-white">
                        Terms
                    </a>
                    <a
                        href="https://www.linkedin.com"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-white"
                    >
                        LinkedIn
                    </a>
                </div>
            </div>
        </footer>
    );
}

function AuroraBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-[#060914]" />
            <div className="absolute -top-40 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
            <div className="absolute top-1/3 left-1/4 h-[40vh] w-[60vw] rounded-full bg-indigo-500/20 blur-[100px]" />
        </div>
    );
}
