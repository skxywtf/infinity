import { NextRequest, NextResponse } from "next/server";

// Manual Proxy for Ghost Content API
// This is necessary because Next.js Rewrites pass the original Host header (infinityxz.ai),
// which causes the Ghost server (worldtradefactory.ai) to reject the request (404/403).
// By manually fetching, we can control the headers completely.

const GHOST_URL = "https://www.worldtradefactory.ai";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path: pathArray } = await params;
    const path = pathArray.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${GHOST_URL}/ghost/api/${path}${searchParams ? `?${searchParams}` : ""}`;

    try {
        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                // Do NOT pass the original Host header. Let fetch set it automatically to worldtradefactory.ai
                // Pass essential headers like Content-Type if needed
                "Cookie": req.headers.get("Cookie") || "",
            },
        });

        const data = await response.blob();

        return new NextResponse(data, {
            status: response.status,
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "application/json",
                // Ensure CORS headers are open for our own domain (default for Same Origin, but safe to add)
                "Access-Control-Allow-Origin": "*",
            },
        });

    } catch (error) {
        console.error("Ghost Proxy Error:", error);
        return NextResponse.json({ error: "Proxy Failed" }, { status: 500 });
    }
}
