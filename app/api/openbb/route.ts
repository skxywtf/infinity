import { NextRequest, NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import path from "path";
import util from "util";

// CONFIG: Cloud API URL (Set this in Vercel)
const CLOUD_API_URL = process.env.OPENBB_API_URL;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ticker, type } = body;

        if (!ticker || !type) {
            return NextResponse.json({ error: "Ticker and type are required" }, { status: 400 });
        }

        // --- MODE 1: CLOUD RUN (Production) ---
        if (CLOUD_API_URL) {
            console.log(`[OpenBB Proxy] Connecting to Cloud: ${CLOUD_API_URL}`);

            try {
                // Ensure no double slash issues
                const baseUrl = CLOUD_API_URL.endsWith('/') ? CLOUD_API_URL.slice(0, -1) : CLOUD_API_URL;
                const endpoint = `${baseUrl}/data`;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticker, type }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[OpenBB Proxy] Upstream Error: ${response.status} - ${errorText}`);
                    throw new Error(`Cloud API Error (${response.status}): ${errorText || response.statusText}`);
                }

                const data = await response.json();
                return NextResponse.json(data);
            } catch (err: any) {
                console.error(`[OpenBB Proxy] Network Failed: ${err.message}`);
                return NextResponse.json({ error: `Using Cloud API: ${err.message}` }, { status: 500 });
            }
        }

        // --- MODE 2: LOCAL DEV (Python Spawn) ---
        if (process.env.NODE_ENV === 'development') {
            console.log("[OpenBB Proxy] Using Local Python Bridge");
            // NOTE: Python path might need adjustment if you run this locally in a different env
            const PYTHON_PATH = "python";
            // Correct path for Infinity structure (lib is in root, not src/lib)
            const BRIDGE_SCRIPT_PATH = path.join(process.cwd(), "lib", "openbb_bridge.py");

            return new Promise((resolve) => {
                const pythonProcess = spawn(PYTHON_PATH, [
                    BRIDGE_SCRIPT_PATH,
                    "--ticker", ticker,
                    "--type", type
                ]);

                let resultString = "";
                let errorString = "";

                pythonProcess.stdout.on("data", (data) => resultString += data.toString());
                pythonProcess.stderr.on("data", (data) => errorString += data.toString());

                pythonProcess.on("close", (code) => {
                    if (code !== 0) {
                        console.error("Python Bridge Failed:", errorString);
                        resolve(NextResponse.json(getJsMockData(ticker, type)));
                    } else {
                        try {
                            resolve(NextResponse.json(JSON.parse(resultString)));
                        } catch (e) {
                            console.error("JSON Parse Error:", resultString);
                            resolve(NextResponse.json(getJsMockData(ticker, type)));
                        }
                    }
                });
            });
        }

        // --- MODE 3: VERCEL PREVIEW (JS Mock Fallback) ---
        console.log("[OpenBB Proxy] No Backend Configured. Using Pure JS Mock.");
        return NextResponse.json(getJsMockData(ticker, type));

    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- PURE JS MOCK GENERATOR ---
function getJsMockData(ticker: string, type: string) {
    if (type === 'price') {
        const data = [];
        let price = 150.0;
        const now = new Date();
        for (let i = 0; i < 180; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - (180 - i));
            price += (Math.random() - 0.45) * 5;
            data.push({ date: d.toISOString().split('T')[0], close: Number(price.toFixed(2)) });
        }
        return { data };
    }
    if (type === 'news') {
        return {
            data: [
                { title: `${ticker} launches new AI Cloud Platform`, source: "TechCrunch", date: new Date().toISOString(), url: "#" },
                { title: "Market Outlook: Tech stocks surge", source: "Bloomberg", date: new Date().toISOString(), url: "#" },
                { title: `${ticker} Quarterly Earnings Preview`, source: "WSJ", date: new Date().toISOString(), url: "#" },
            ]
        };
    }
    if (type === 'profile') {
        return {
            data: [{
                shortName: `${ticker} Inc.`, currency: "USD", marketCap: 2500000000000,
                sector: "Technology", industry: "Software", exchange: "NASDAQ"
            }]
        };
    }
    return { error: "Unknown Mock Type" };
}
