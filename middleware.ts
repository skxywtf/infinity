import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// No-op middleware to fix build error while debugging
export function middleware(request: NextRequest) {
    return NextResponse.next()
}

// Disable matcher so it affects nothing (or keep it empty)
export const config = {
    matcher: []
}
