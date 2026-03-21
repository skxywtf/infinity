"""
WTFXAI - Spec API Routes
Mount in api/main.py:
    from api.spec_routes import spec_router
    app.include_router(spec_router)
"""
import os, json
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"): DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if "?" not in DATABASE_URL: DATABASE_URL += "?sslmode=require"
engine = create_engine(DATABASE_URL)
spec_router = APIRouter()


class AlertCreate(BaseModel):
    user_id: Optional[str] = None
    series_slug: str
    condition: str
    threshold: float
    channel: str = "email"

class BriefRequest(BaseModel):
    trigger_series: Optional[str] = "manual"
    brief_type: str = "release"


def get_series_window(conn, series_id, periods):
    rows = conn.execute(text(
        "SELECT date,value FROM macro_data WHERE series_id=:sid ORDER BY date DESC LIMIT :n"
    ), {"sid": series_id, "n": periods}).mappings().all()
    return [{"date": str(r["date"]), "value": float(r["value"])} for r in reversed(rows)]


@spec_router.get("/api/calendar")
def get_calendar(country: str = Query("USA"), days_ahead: int = Query(30), importance: Optional[int] = Query(None)):
    now = datetime.now(timezone.utc); cutoff = now + timedelta(days=days_ahead)
    q = "SELECT id,event_date,country,indicator,importance,prior,consensus,actual,surprise,source FROM events WHERE event_date BETWEEN :now AND :cutoff AND country=:country"
    p = {"now": now, "cutoff": cutoff, "country": country}
    if importance: q += " AND importance>=:importance"; p["importance"] = importance
    q += " ORDER BY event_date ASC LIMIT 200;"
    with engine.connect() as conn: return [dict(r) for r in conn.execute(text(q), p).mappings().all()]


@spec_router.get("/api/calendar/history")
def get_calendar_history(series_id: Optional[str] = Query(None), limit: int = Query(50)):
    now = datetime.now(timezone.utc)
    q = "SELECT id,event_date,country,indicator,importance,prior,consensus,actual,surprise,source FROM events WHERE event_date<=:now AND actual IS NOT NULL"
    p = {"now": now}
    if series_id: q += " AND source LIKE :sid"; p["sid"] = f"%{series_id}%"
    q += " ORDER BY event_date DESC LIMIT :lim;"; p["lim"] = limit
    with engine.connect() as conn: return [dict(r) for r in conn.execute(text(q), p).mappings().all()]


@spec_router.get("/api/regime")
def get_regime():
    with engine.connect() as conn:
        ir = get_series_window(conn, "INDPRO", 6)
        if len(ir) < 4: raise HTTPException(503, "Insufficient INDPRO data")
        gm = (ir[-1]["value"] / ir[-4]["value"]) ** (12/3) - 1
        gt = "accelerating" if gm > 0 else "decelerating"
        cr = get_series_window(conn, "CPIAUCSL", 14)
        if len(cr) < 13: raise HTTPException(503, "Insufficient CPI data")
        yoys = [(cr[i]["value"] / cr[i-12]["value"] - 1) * 100 for i in range(12, len(cr))]
        cy = yoys[-1]; ay = sum(yoys[:-1]) / max(len(yoys)-1, 1)
        it = "rising" if cy > ay else "falling"
        qm = {
            ("accelerating","falling"): ("Goldilocks","#4caf82"),
            ("accelerating","rising"):  ("Reflation","#f59e42"),
            ("decelerating","rising"):  ("Stagflation","#e05c5c"),
            ("decelerating","falling"): ("Deflation","#4a90d9"),
        }
        q, color = qm[(gt, it)]
    return {"quadrant": q, "color": color, "growth_trend": gt, "inflation_trend": it,
            "growth_mom_annualized": round(gm*100, 2), "cpi_yoy": round(cy, 2),
            "cpi_yoy_avg_12m": round(ay, 2), "calculated_at": datetime.now(timezone.utc).isoformat()}


@spec_router.get("/api/surprise/{series_slug}")
def get_surprise(series_slug: str, periods: int = Query(24)):
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT event_date AS date,actual,consensus,(actual-consensus) AS raw_surprise "
            "FROM events WHERE LOWER(source) LIKE :slug AND actual IS NOT NULL AND consensus IS NOT NULL "
            "ORDER BY event_date DESC LIMIT :n"
        ), {"slug": f"%{series_slug.lower()}%", "n": periods}).mappings().all()
    if not rows: raise HTTPException(404, f"No data for {series_slug}")
    surps = [float(r["raw_surprise"]) for r in rows]
    mean = sum(surps)/len(surps)
    std = (sum((x-mean)**2 for x in surps)/len(surps))**0.5 or 1.0
    result = []
    rlist = list(reversed(rows))
    for i, r in enumerate(rlist):
        z = float(r["raw_surprise"])/std
        w = [float(rlist[j]["raw_surprise"])/std for j in range(max(0,i-2), i+1)]
        result.append({"date": str(r["date"])[:10], "actual": float(r["actual"]),
                       "consensus": float(r["consensus"]), "z_surprise": round(z,3),
                       "surprise_index": round(sum(w)/len(w), 3)})
    return result


@spec_router.get("/api/brief/latest")
def get_latest_brief():
    with engine.connect() as conn:
        row = conn.execute(text(
            "SELECT id,generated_at,brief_type,trigger_series,content_md,skore_json,regime_json "
            "FROM ai_briefs ORDER BY generated_at DESC LIMIT 1"
        )).mappings().first()
    if not row: raise HTTPException(404, "No briefs yet. POST /api/brief/generate")
    return dict(row)


@spec_router.post("/api/brief/generate")
def generate_macro_brief(req: BriefRequest):
    import anthropic
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key: raise HTTPException(500, "ANTHROPIC_API_KEY not set")
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT sm.series_id,sm.title,sm.category,md.value AS latest,md.date "
            "FROM series_metadata sm JOIN macro_data md ON md.series_id=sm.series_id "
            "WHERE (sm.series_id,md.date) IN "
            "(SELECT series_id,MAX(date) FROM macro_data GROUP BY series_id) "
            "ORDER BY sm.category,sm.series_id"
        )).mappings().all()
    if not rows: raise HTTPException(503, "No macro data")
    ctx = "\n".join([f"{r['title']} ({r['category']}): {r['latest']} (date: {str(r['date'])[:10]})" for r in rows])
    client = anthropic.Anthropic(api_key=key)
    resp = client.messages.create(
        model="claude-opus-4-6", max_tokens=2000,
        system="You are Chief Macro Strategist at WTFXAI. Output ONLY valid JSON with keys: summary, skore, regime. Be direct.",
        messages=[{"role":"user","content":f"Generate WTF Macro Brief.\nTrigger: {req.trigger_series}\n\nDATA:\n{ctx}\n\nJSON only."}]
    )
    raw = resp.content[0].text.strip()
    try: brief = json.loads(raw)
    except Exception as e: raise HTTPException(500, f"Claude returned invalid JSON: {e}")
    with engine.begin() as conn:
        result = conn.execute(text(
            "INSERT INTO ai_briefs(brief_type,trigger_series,content_md,skore_json,regime_json) "
            "VALUES(:bt,:tr,:c,:s,:r) RETURNING id,generated_at"
        ), {"bt": req.brief_type, "tr": req.trigger_series, "c": brief.get("summary",""),
            "s": json.dumps(brief.get("skore",{})), "r": json.dumps(brief.get("regime",{}))}).mappings().first()
    return {"id": str(result["id"]), "generated_at": result["generated_at"].isoformat(), "brief": brief}


@spec_router.get("/api/alerts")
def list_alerts(user_id: Optional[str] = Query(None)):
    q = "SELECT * FROM alert_rules WHERE is_active=TRUE"; p = {}
    if user_id: q += " AND user_id=:uid"; p["uid"] = user_id
    q += " ORDER BY created_at DESC;"
    with engine.connect() as conn: return [dict(r) for r in conn.execute(text(q), p).mappings().all()]


@spec_router.post("/api/alerts", status_code=201)
def create_alert(alert: AlertCreate):
    if alert.condition not in ("gt","lt","crosses"):
        raise HTTPException(400, "condition must be gt, lt, or crosses")
    with engine.begin() as conn:
        row = conn.execute(text(
            "INSERT INTO alert_rules(user_id,series_slug,condition,threshold,channel) "
            "VALUES(:uid,:slug,:cond,:thresh,:channel) RETURNING id,created_at"
        ), {"uid": alert.user_id, "slug": alert.series_slug, "cond": alert.condition,
            "thresh": alert.threshold, "channel": alert.channel}).mappings().first()
    return {"id": str(row["id"]), "created_at": row["created_at"].isoformat()}


@spec_router.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: str):
    with engine.begin() as conn:
        conn.execute(text("UPDATE alert_rules SET is_active=FALSE WHERE id=:id"), {"id": alert_id})
    return {"status": "deactivated"}


@spec_router.get("/api/news/feed")
def get_news_feed(limit: int = Query(20, le=100), offset: int = Query(0),
                  source: Optional[str] = Query(None), series_slug: Optional[str] = Query(None)):
    q = "SELECT id,published_at,headline,summary,source,url,related_series FROM news_items WHERE TRUE"
    p = {}
    if source: q += " AND source=:source"; p["source"] = source.upper()
    if series_slug: q += " AND :slug=ANY(related_series)"; p["slug"] = series_slug.upper()
    q += " ORDER BY published_at DESC LIMIT :lim OFFSET :off;"
    p["lim"] = limit; p["off"] = offset
    with engine.connect() as conn: return [dict(r) for r in conn.execute(text(q), p).mappings().all()]


@spec_router.get("/api/series/registry")
def get_series_registry(category: Optional[str] = Query(None), source: Optional[str] = Query(None)):
    q = ("SELECT sm.series_id,sm.title,sm.source,sm.tab_name,sm.tab_order,sm.frequency,"
         "sm.category,sm.sub_category,sm.bloomberg_equiv,sm.chart_type,sm.country,"
         "MAX(md.date) AS last_updated,COUNT(md.date) AS observation_count "
         "FROM series_metadata sm LEFT JOIN macro_data md ON md.series_id=sm.series_id WHERE TRUE")
    p = {}
    if category: q += " AND sm.category=:cat"; p["cat"] = category
    if source: q += " AND sm.source=:src"; p["src"] = source
    q += " GROUP BY sm.series_id ORDER BY sm.tab_order,sm.series_id;"
    with engine.connect() as conn: return [dict(r) for r in conn.execute(text(q), p).mappings().all()]


@spec_router.get("/api/migrate-spec")
def run_migration():
    """One-shot migration — each table in its own transaction so failures don't cascade."""
    steps = []
    errors = []

    def run_sql(label, sqls):
        try:
            with engine.begin() as c:
                for sql in sqls:
                    c.execute(text(sql))
            steps.append(label)
        except Exception as e:
            errors.append(f"{label}: {str(e)[:120]}")

    run_sql("series_metadata extended", [
        "ALTER TABLE series_metadata ADD COLUMN IF NOT EXISTS country VARCHAR(4) DEFAULT 'USA';",
        "ALTER TABLE series_metadata ADD COLUMN IF NOT EXISTS category VARCHAR(64);",
        "ALTER TABLE series_metadata ADD COLUMN IF NOT EXISTS sub_category VARCHAR(64);",
        "ALTER TABLE series_metadata ADD COLUMN IF NOT EXISTS vintage_enabled BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE series_metadata ADD COLUMN IF NOT EXISTS bloomberg_equiv VARCHAR(32);",
        "ALTER TABLE series_metadata ADD COLUMN IF NOT EXISTS chart_type VARCHAR(16) DEFAULT 'line';",
    ])

    run_sql("macro_data extended", [
        "ALTER TABLE macro_data ADD COLUMN IF NOT EXISTS vintage_date DATE;",
        "ALTER TABLE macro_data ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMPTZ DEFAULT NOW();",
    ])

    run_sql("events table", ["""
        CREATE TABLE IF NOT EXISTS events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
            country VARCHAR(4) NOT NULL DEFAULT 'USA',
            indicator VARCHAR(128) NOT NULL,
            importance SMALLINT DEFAULT 2,
            prior NUMERIC,
            consensus NUMERIC,
            actual NUMERIC,
            surprise NUMERIC,
            source VARCHAR(32),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );""",
        "CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);",
        "CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);",
    ])

    run_sql("alert_rules table", ["""
        CREATE TABLE IF NOT EXISTS alert_rules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            series_slug VARCHAR(64) NOT NULL,
            condition VARCHAR(8) NOT NULL,
            threshold NUMERIC NOT NULL,
            channel VARCHAR(16) DEFAULT 'email',
            is_active BOOLEAN DEFAULT TRUE,
            last_triggered TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );""",
        "CREATE INDEX IF NOT EXISTS idx_alerts_slug ON alert_rules(series_slug) WHERE is_active = TRUE;",
    ])

    run_sql("news_items table", ["""
        CREATE TABLE IF NOT EXISTS news_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            published_at TIMESTAMPTZ NOT NULL,
            headline TEXT NOT NULL,
            summary TEXT,
            source VARCHAR(64),
            url TEXT,
            related_series TEXT[],
            sentiment_score NUMERIC,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );""",
        "CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);",
    ])

    run_sql("ai_briefs table", ["""
        CREATE TABLE IF NOT EXISTS ai_briefs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            generated_at TIMESTAMPTZ DEFAULT NOW(),
            brief_type VARCHAR(32),
            trigger_series VARCHAR(64),
            content_md TEXT,
            skore_json JSONB,
            regime_json JSONB
        );""",
        "CREATE INDEX IF NOT EXISTS idx_briefs_generated ON ai_briefs(generated_at DESC);",
    ])

    return {"status": "done", "steps": steps, "errors": errors}

