import { NextRequest, NextResponse } from "next/server";

// Manual Proxy for Ghost Members API
const GHOST_URL = "https://www.worldtradefactory.ai";

const handleProxy = async (req: NextRequest, { params }: { params: { path: string[] } }) => {
    const path = params.path.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${GHOST_URL}/members/api/${path}${searchParams ? `?${searchParams}` : ""}`;

    try {
        const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                // Pass Content-Type for POST/PUT
                "Content-Type": req.headers.get("Content-Type") || "application/json",
                // Do NOT pass Host header
            },
            body: body,
        });

        const data = await response.text();

        return new NextResponse(data, {
            status: response.status,
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });

    } catch (error) {
        console.error("Ghost Members Proxy Error:", error);
        return NextResponse.json({ error: "Proxy Failed" }, { status: 500 });
    }
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as DELETE };
