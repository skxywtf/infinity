"""
WTFXAI — RSS Feed Ingester
Pulls official economic news feeds and stores in news_items table.
Run on a cron: every 15 minutes via Vercel Cron or a scheduled job.

Usage:
    python -m macro_scripts.ingest_rss_feeds
"""
import os
import time
import hashlib
import requests
import feedparser
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if "?" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

engine = create_engine(DATABASE_URL)

# ─────────────────────────────────────────────
# KEYWORD → SERIES SLUG MAP
# ─────────────────────────────────────────────

KEYWORD_SERIES_MAP = {
    "CPI":         ["CPIAUCSL", "T10YIE"],
    "INFLATION":   ["CPIAUCSL", "T10YIE", "PCEPI"],
    "PPI":         ["PPIACO"],
    "PAYROLL":     ["PAYEMS", "CES0500000003"],
    "NONFARM":     ["PAYEMS"],
    "JOLTS":       ["JTSJOL"],
    "UNEMPLOYMENT":["UNRATE", "ICSA"],
    "JOBLESS":     ["ICSA"],
    "GDP":         ["GDPC1"],
    "PCE":         ["PCEPI"],
    "FOMC":        ["FEDFUNDS", "DGS10", "T10Y2Y"],
    "RATE":        ["FEDFUNDS", "SOFR"],
    "YIELD":       ["DGS10", "DGS2", "T10Y2Y"],
    "TREASURY":    ["DGS10", "DGS30", "TREASURY_DEBT"],
    "HOUSING":     ["HOUST", "MORTGAGE30US", "CSUSHPISA"],
    "RETAIL":      ["RSAFS"],
    "SENTIMENT":   ["UMCSENT"],
    "OIL":         ["DCOILWTICO"],
    "GOLD":        ["GOLDAMGBD228NLBM"],
    "DOLLAR":      ["DTWEXBGS", "DEXUSEU"],
    "CREDIT":      ["BAMLH0A0HYM2", "BAMLC0A0CM"],
    "VIX":         ["VIXCLS"],
    "RECESSION":   ["USREC", "RECPROUSM156N"],
    "M2":          ["M2SL"],
    "DEFICIT":     ["MTSDS133FMS", "GFDEBTN"],
}


def match_series(headline: str) -> list[str]:
    """Return list of related series slugs based on headline keywords."""
    upper = headline.upper()
    matched = set()
    for keyword, slugs in KEYWORD_SERIES_MAP.items():
        if keyword in upper:
            matched.update(slugs)
    return list(matched)


# ─────────────────────────────────────────────
# FEEDS
# ─────────────────────────────────────────────

RSS_FEEDS = [
    {
        "url": "https://www.bls.gov/feed/bls_latest.rss",
        "source": "BLS",
    },
    {
        "url": "https://www.bea.gov/rss/rss.xml",
        "source": "BEA",
    },
    {
        "url": "https://www.federalreserve.gov/feeds/speeches.xml",
        "source": "FED_SPEECHES",
    },
    {
        "url": "https://www.federalreserve.gov/feeds/press_monetary.xml",
        "source": "FOMC",
    },
    {
        "url": "https://home.treasury.gov/news/press-releases/feed",
        "source": "TREASURY",
    },
    {
        "url": "https://www.imf.org/en/News/rss",
        "source": "IMF",
    },
    {
        "url": "https://feeds.reuters.com/reuters/businessNews",
        "source": "REUTERS",
    },
]


def parse_published_at(entry) -> datetime:
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        return datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
    return datetime.now(timezone.utc)


def entry_url(entry) -> str | None:
    link = getattr(entry, "link", None)
    if link:
        return link
    if hasattr(entry, "enclosures") and entry.enclosures:
        return entry.enclosures[0].get("href")
    return None


def url_fingerprint(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:24]


def ingest_feed(feed_cfg: dict) -> int:
    url = feed_cfg["url"]
    source = feed_cfg["source"]
    try:
        feed = feedparser.parse(url)
    except Exception as e:
        print(f"  ⚠  {source}: parse error — {e}")
        return 0
    inserted = 0
    with engine.begin() as conn:
        for entry in feed.entries:
            headline = getattr(entry, "title", "").strip()
            if not headline:
                continue
            link = entry_url(entry)
            summary = getattr(entry, "summary", None)
            if summary:
                summary = summary[:500]
            published_at = parse_published_at(entry)
            related = match_series(headline)
            dedup_url = link or f"_no_url_{url_fingerprint(headline + source)}"
            try:
                result = conn.execute(text("""
                    INSERT INTO news_items (published_at, headline, summary, source, url, related_series)
                    VALUES (:published_at, :headline, :summary, :source, :url, :related)
                    ON CONFLICT (url) DO NOTHING RETURING id;
                """), {"published_at": published_at, "headline": headline, "summary": summary, "source": source, "url": dedup_url, "related": related if related else None})
                if result.rowcount:
                    inserted += 1
            except Exception as e:
                pass
    return inserted


def main():
    print("📡 RSS Feed Ingestion starting...\n")
    total = 0
    for feed_cfg in RSS_FEEDS:
        print(f"  Fetching {feed_cfg['source']}...")
        count = ingest_feed(feed_cfg)
        print(f"    → {count} new items")
        total += count
        time.sleep(0.5)
    print(f"\n✅ Done — {total} new news items ingested.")


if __name__ == "__main__":
    main()
