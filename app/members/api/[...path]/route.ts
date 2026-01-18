import { NextRequest, NextResponse } from "next/server";

// Manual Proxy for Ghost Members API
const GHOST_URL = "https://www.worldtradefactory.ai";

const handleProxy = async (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) => {
    const { path: pathArray } = await params;
    const path = pathArray.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${GHOST_URL}/members/api/${path}${searchParams ? `?${searchParams}` : ""}`;

    try {
        const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                // Pass Content-Type for POST/PUT
                "Content-Type": req.headers.get("Content-Type") || "application/json",
                // Forward Cookie header so Ghost knows who we are
                "Cookie": req.headers.get("Cookie") || "",
                // Do NOT pass Host header
            },
            body: body,
            redirect: "manual", // CRITICAL: Do not follow redirects! We need to see the Set-Cookie on the 302.
        });

        // If it's a redirect (301, 302, 303), Ghost is likely sending the cookie now.
        // We will return 200 to the client to stop the browser from following the redirect to the external domain,
        // but we WILL pass the Set-Cookie header so the browser saves it.
        const isRedirect = response.status >= 300 && response.status < 400;
        const data = isRedirect ? "Login Successful (Redirect Captured)" : await response.text();
        const status = isRedirect ? 200 : response.status;

        // Create headers object to forward
        const headers = new Headers();
        headers.set("Content-Type", response.headers.get("Content-Type") || "application/json");
        headers.set("Access-Control-Allow-Origin", "*");

        // Critical: Forward Set-Cookie header BUT sanitize Domain
        // If we leave Domain=worldtradefactory.ai, browser blocks it.
        const setCookie = response.headers.get("Set-Cookie");
        if (setCookie) {
            // Debug: Expose original cookie
            headers.set("X-Debug-Set-Cookie-Original", setCookie);

            // Remove Domain attribute to default to current domain
            const sanitizedCookie = setCookie.replace(/Domain=[^;]+;?/gi, "");
            headers.set("Set-Cookie", sanitizedCookie);

            // Debug: Expose final cookie
            headers.set("X-Debug-Set-Cookie-Sanitized", sanitizedCookie);
        } else {
            headers.set("X-Debug-Set-Cookie-Original", "NULL");
        }

        return new NextResponse(data, {
            status: status,
            headers: headers
        });

    } catch (error) {
        console.error("Ghost Members Proxy Error:", error);
        // Return 500 but log error
        return NextResponse.json({ error: "Proxy Failed", details: String(error) }, { status: 500 });
    }
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as DELETE };
