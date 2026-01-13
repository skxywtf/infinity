import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    // Check for session token (works on Edge without external fetch if Secret is set)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // If no token, redirect to login
    if (!token) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', req.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // Allow access
    return NextResponse.next();
}

// Protect specific routes
export const config = {
    matcher: ["/experienz", "/app/infinity"]
};
