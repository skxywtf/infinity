import { NextResponse } from "next/server";
const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";
const CRON_SECRET = process.env.CRON_SECRET;
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND}/api/internal/ingest-series`, { method: "POST", signal: AbortSignal.timeout(55000) });
    return NextResponse.json({ status: "ok", result: await res.json() });
  } catch (err: unknown) { return NextResponse.json({ status: "error", message: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
