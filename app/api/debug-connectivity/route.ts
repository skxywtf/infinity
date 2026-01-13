
import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export const runtime = 'nodejs'; // Force Node to use DNS module

export async function GET(req: Request) {
    const targetUrl = process.env.NEXTAUTH_URL || 'https://infinityxz.ai';
    let dnsResult = 'Skipped';
    let fetchResult = 'Skipped';
    let errorDetails = null;

    try {
        const hostname = new URL(targetUrl).hostname;
        const res = await lookup(hostname);
        dnsResult = `Resolved ${hostname} to ${res.address} (Family: ${res.family})`;
    } catch (e: any) {
        dnsResult = `DNS Validation Failed: ${e.message}`;
    }

    try {
        const start = Date.now();
        const res = await fetch(targetUrl, { method: 'HEAD' }); // Lightweight check
        fetchResult = `Status: ${res.status} (${Date.now() - start}ms)`;
    } catch (e: any) {
        fetchResult = `Fetch Failed: ${e.message}`;
        errorDetails = JSON.stringify(e, Object.getOwnPropertyNames(e));
    }

    return NextResponse.json({
        env: {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            VERCEL_URL: process.env.VERCEL_URL,
            NODE_ENV: process.env.NODE_ENV,
        },
        tests: {
            dns: dnsResult,
            connectivity: fetchResult,
            error: errorDetails
        }
    });
}
