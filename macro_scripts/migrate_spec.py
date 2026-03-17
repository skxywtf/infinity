"""
WTFXAI — Spec Migration Script
Run once to extend the existing DB schema per the developer data spec.
Extends: series_metadata, macro_data
Creates:  observations (alias view), events, alert_rules, news_items, ai_briefs

Usage:
    python -m macro_scripts.migrate_spec
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if DATABASE_URL and "?" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

engine = create_engine(DATABASE_URL)


def run():
    with engine.begin() as conn:

        # ── 1. Extend series_metadata ──────────────────────────────────────
        print("Extending series_metadata...")
        for col, definition in [
            ("country",          "VARCHAR(4) DEFAULT 'USA'"),
            ("category",         "VARCHAR(64)"),
            ("sub_category",     "VARCHAR(64)"),
            ("vintage_enabled",  "BOOLEAN DEFAULT FALSE"),
            ("bloomberg_equiv",  "VARCHAR(32)"),
            ("chart_type",       "VARCHAR(16) DEFAULT 'line'"),
        ]:
            conn.execute(text(
                f"ALTER TABLE series_metadata ADD COLUMN IF NOT EXISTS {col} {definition};"
            ))

        # ── 2. Extend macro_data with vintage_date & ingested_at ───────────
        print("Extending macro_data...")
        for col, definition in [
            ("vintage_date", "DATE"),
            ("ingested_at",  "TIMESTAMPTZ DEFAULT NOW()"),
        ]:
            conn.execute(text(
                f"ALTER TABLE macro_data ADD COLUMN IF NOT EXISTS {col} {definition};"
            ))

        # ── 3. observations view (spec uses this name; macro_data is source) ─
        print("Creating observations view...")
        conn.execute(text("""
            CREATE OR REPLACE VIEW observations AS
            SELECT
                series_id            AS series_slug,
                date,
                value,
                vintage_date,
                ingested_at
            FROM macro_data;
        """))

        # ── 4. events — economic calendar ─────────────────────────────────
        print("Creating events table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS events (
                id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_date    TIMESTAMP WITH TIME ZONE NOT NULL,
                country       VARCHAR(4) NOT NULL DEFAULT 'USA',
                indicator     VARCHAR(128) NOT NULL,
                importance    SMALLINT DEFAULT 2,
                prior         NUMERIC,
                consensus     NUMERIC,
                actual        NUMERIC,
                surprise      NUMERIC GENERATED ALWAYS AS (actual - consensus) STORED,
                source        VARCHAR(32),
                created_at    TIMESTAMPTZ DEFAULT NOW()
            );
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);"
        ))

        # ── 5. alert_rules ────────────────────────────────────────────────
        print("Creating alert_rules table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alert_rules (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id         UUID,
                series_slug     VARCHAR(64) NOT NULL,
                condition       VARCHAR(8) NOT NULL,
                threshold       NUMERIC NOT NULL,
                channel         VARCHAR(16) DEFAULT 'email',
                is_active       BOOLEAN DEFAULT TRUE,
                last_triggered  TIMESTAMPTZ,
                created_at      TIMESTAMPTZ DEFAULT NOW()
            );
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_alerts_slug ON alert_rules(series_slug) WHERE is_active = TRUE;"
        ))

        # ── 6. news_items ─────────────────────────────────────────────────
        print("Creating news_items table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS news_items (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                published_at    TIMESTAMPTZ NOT NULL,
                headline        TEXT NOT NULL,
                summary         TEXT,
                source          VARCHAR(64),
                url             TEXT,
                related_series  TEXT[],
                sentiment_score NUMERIC,
                created_at      TIMESTAMPTZ DEFAULT NOW()
            );
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);"
        ))
        conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_news_url ON news_items(url) WHERE url IS NOT NULL;"
        ))

        # ── 7. ai_briefs ──────────────────────────────────────────────────
        print("Creating ai_briefs table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_briefs (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                generated_at    TIMESTAMPTZ DEFAULT NOW(),
                brief_type      VARCHAR(32),
                trigger_series  VARCHAR(64),
                content_md      TEXT,
                skore_json      JSONB,
                regime_json     JSONB
            );
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_briefs_generated ON ai_briefs(generated_at DESC);"
        ))

        # ── 8. Backfill category on existing series_metadata rows ─────────
        print("Backfilling categories on existing series...")
        category_map = {
            "GDPC1":        ("growth",      None),
            "BEA_REAL_GDP": ("growth",      None),
            "CPIAUCSL":     ("inflation",   None),
            "CPILFESL":     ("inflation",   None),
            "FEDFUNDS":     ("rates",       None),
            "UNRATE":       ("labor",       None),
            "PAYEMS":       ("labor",       None),
            "M2SL":         ("monetary",    None),
            "INDPRO":       ("activity",    None),
            "T10Y2Y":       ("rates",       "spread"),
            "T10Y3M":       ("rates",       "spread"),
            "BAMLH0A0HYM2": ("credit",      "hy_spread"),
            "USREC":        ("regime",      None),
            "DTWEXBGS":     ("fx",          None),
            "DEXUSEU":      ("fx",          None),
            "TREASURY_DEBT":("fiscal",      None),
            "GFDEBTN":      ("fiscal",      None),
            "GFDEGDQ188S":  ("fiscal",      "debt_gdp"),
            "MTSDS133FMS":  ("fiscal",      "deficit"),
            "PALLFNFINDEXM":("commodities", None),
            "BOPGSTB":      ("trade",       None),
            "WB_WLD_GDP":   ("global",      None),
        }
        for series_id, (cat, sub) in category_map.items():
            conn.execute(text("""
                UPDATE series_metadata
                SET category = :cat, sub_category = :sub
                WHERE series_id = :sid AND category IS NULL;
            """), {"cat": cat, "sub": sub, "sid": series_id})

    print("\n✅ Migration complete. All spec tables created / extended.")


if __name__ == "__main__":
    run()
