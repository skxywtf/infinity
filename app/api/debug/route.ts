
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        VERCEL_URL: process.env.VERCEL_URL,
        NODE_ENV: process.env.NODE_ENV,
        EMAIL_SERVER_DEFINED: !!process.env.EMAIL_SERVER,
        GHOST_API_URL: process.env.GHOST_API_URL,
        GHOST_ADMIN_KEY_DEFINED: !!process.env.GHOST_ADMIN_API_KEY,
        GHOST_CONTENT_KEY_DEFINED: !!process.env.GHOST_CONTENT_API_KEY,
        NEXT_PUBLIC_GHOST_CONTENT_KEY_DEFINED: !!process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY
    });
}
