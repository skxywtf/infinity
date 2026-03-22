import os
from fastapi import APIRouter, HTTPException, Response
from sqlalchemy import create_engine, text
import datetime
from dotenv import load_dotenv
from pydantic import BaseModel
import requests  # <-- We use this built-in web library for EVERYTHING now! (No yfinance)
import zipfile
import io
import csv
import xml.etree.ElementTree as ET
import email.utils

load_dotenv()

# --- DATABASE CONNECTION SETUP ---
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix string for SQLAlchemy and force SSL for Neon
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if "?" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"
elif "sslmode" not in DATABASE_URL:
    DATABASE_URL += "&sslmode=require"

engine = create_engine(DATABASE_URL)

router = APIRouter()

# --- PHASE 3 ROUTES (Dynamic Tabs & Charts) ---

@router.get("/api/tabs")
def get_tabs_metadata(response: Response):
    # MAGIC FIX: 12-hour Vercel Edge Cache
    response.headers["Cache-Control"] = "public, s-maxage=43200, stale-while-revalidate=86400"
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT series_id, title, source, tab_name, tab_order 
            FROM series_metadata 
            ORDER BY tab_order ASC, series_id ASC
        """)).mappings().all()
        return [dict(row) for row in result]

@router.get("/api/data/{series_id}")
def get_chart_data(series_id: str, response: Response):
    # MAGIC FIX: 12-hour Vercel Edge Cache
    response.headers["Cache-Control"] = "public, s-maxage=43200, stale-while-revalidate=86400"
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT date, value FROM macro_data WHERE series_id = :series_id ORDER BY date"
        ), {"series_id": series_id}).mappings().all()
        return [dict(row) for row in result]

@router.get("/api/latest/{series_id}")
def get_latest_value(series_id: str, response: Response):
    # MAGIC FIX: 12-hour Vercel Edge Cache
    response.headers["Cache-Control"] = "public, s-maxage=43200, stale-while-revalidate=86400"
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT value FROM macro_data WHERE series_id = :series_id ORDER BY date DESC LIMIT 1"
        ), {"series_id": series_id}).mappings().first()
        if result:
            return {"value": result["value"]}
        return {"value": None}

# --- NEW: FRED ALFRED VINTAGE ROUTE ---
@router.get("/api/vintage/{series_id}")
def get_vintage_data(series_id: str, date: str, response: Response):
    """
    Fetches the unrevised 'vintage' data for a series exactly as it looked on the requested date.
    Requires FRED_API_KEY in your .env / Vercel environment.
    """
    api_key = os.getenv("FRED_API_KEY")
    if not api_key:
        return {"error": "FRED_API_KEY is missing from environment variables."}
    
    # The magic ALFRED parameters: realtime_start and realtime_end
    url = f"https://api.stlouisfed.org/fred/series/observations?series_id={series_id}&api_key={api_key}&file_type=json&realtime_start={date}&realtime_end={date}"
    
    try:
        res = requests.get(url, timeout=5)
        data = res.json()
        
        if "observations" not in data:
            return {"error": "Invalid series ID or no vintage data found for this date."}
            
        observations = data["observations"]
        clean_data = []
        for obs in observations:
            # FRED sometimes returns "." for null values
            if obs["value"] != ".":
                clean_data.append({
                    "date": obs["date"],
                    "value": float(obs["value"])
                })
        return clean_data
    except Exception as e:
        return {"error": f"Failed to fetch ALFRED data: {str(e)}"}

@router.get("/api/keep-alive")
def keep_db_alive():
    # NO CACHE HEADERS HERE! 
    # We want this request to pierce through Vercel and hit Neon directly.
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1")) # The lightest possible database query
        return {
            "status": "Neon database is awake!", 
            "timestamp": datetime.datetime.now().isoformat() # Ensures the response is always unique
        }
    except Exception as e:
        return {"status": "Error", "message": str(e)}

# --- DIRECT YAHOO FINANCE ROUTES (No yfinance library needed!) ---

@router.get("/api/market/{symbol}")
def get_market_data(symbol: str):
    headers = {'User-Agent': 'Mozilla/5.0'}
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2d"
    try:
        res = requests.get(url, headers=headers, timeout=5)
        data = res.json()
        meta = data['chart']['result'][0]['meta']
        price = meta['regularMarketPrice']
        prev_close = meta['chartPreviousClose']

        change_percent = ((price - prev_close) / prev_close) * 100
        return {
            "price": f"{price:,.2f}",
            "change": f"{change_percent:+.2f}%",
            "pos": change_percent >= 0
        }
    except Exception:
        return {"price": "---", "change": "0.00%", "pos": True}

@router.get("/api/news")
def get_news():
    headers = {'User-Agent': 'Mozilla/5.0'}
    url = "https://query2.finance.yahoo.com/v1/finance/search?q=SPY&newsCount=10"
    try:
        res = requests.get(url, headers=headers, timeout=5)
        data = res.json()
        news_items = data.get('news', [])
        clean_news = []
        for item in news_items:
            clean_news.append({
                "title": item.get("title", ""),
                "publisher": item.get("publisher", "Market News"),
                "link": item.get("link", "#"),
                "time": item.get("providerPublishTime", 0)
            })
        return {"data": clean_news[:10]}
    except Exception:
        return {"data": []}

@router.get("/")
def read_root():
    return {"message": "SKXY Macro Terminal API is running!"}


# --- AI CHATBOT ENDPOINT (GROQ / LLAMA 3 METHOD) ---

class ChatRequest(BaseModel):
    message: str
    chart_data: str

@router.post("/api/chat")
async def chat_with_analyst(request: ChatRequest):
    try:
        # Fetch the Groq key from your environment variables
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return {"answer": "Backend Error: GROQ_API_KEY is missing in Vercel/Environment!"}
        
        # 1. Create the Rules
        system_prompt = f"""
        You are an expert macroeconomic analyst. 
        You are directly assisting a user on a financial dashboard.
        Use the following chart data summary to answer the user's question accurately.
        Do not make up any numbers. If the answer isn't in the data, just say you don't have that specific data point right now.
        Keep your answer concise, professional, and easy to read.
        
        CURRENT CHART DATA:
        {request.chart_data}
        """
        
        # 2. Make a DIRECT web request to Groq
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.3-70b-versatile",  # <-- NEW FLAGSHIP MODEL
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            "temperature": 0.2
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code != 200:
            return {"answer": f"Groq API Error: {response.text}"}
            
        data = response.json()
        
        # 3. Parse the answer
        try:
            answer = data["choices"][0]["message"]["content"]
            return {"answer": answer}
        except Exception:
            return {"answer": "Sorry, the AI returned an empty response."}
            
    except Exception as e:
        return {"answer": f"AI Connection Error: {str(e)}"}
    

# --- ADMIN TRIGGER: UPDATE CFTC COT POSITIONING DATA ---

@router.get("/api/admin/update-cot")
def update_cftc_cot():
    """
    Downloads BOTH Commodities and Financials CFTC ZIP files for 3 years.
    Calculates Net Non-Commercial positions and saves to the database.
    """
    current_year = datetime.datetime.now().year
    # Fetch 3 full years so the YoY% math has plenty of historical data!
    years_to_fetch = [current_year - 2, current_year - 1, current_year] 
    
    file_templates = [
        "https://www.cftc.gov/files/dea/history/fut_disagg_txt_{}.zip", # Commodities (Oil, Gold)
        "https://www.cftc.gov/files/dea/history/fut_fin_txt_{}.zip"     # Financials (FIXED URL)
    ]

    try:
        # Strict mapping to avoid catching Yield contracts
        contract_map = {
            "E-MINI S&P 500": "cot_sp500_net",
            "10-YEAR U.S. TREASURY NOTES": "cot_treasury_net", # Must explicitly include NOTES
            "UST 10Y NOTE": "cot_treasury_net",                # Modern CFTC format
            "EURO FX": "cot_eurusd_net",
            "CRUDE OIL, LIGHT SWEET": "cot_oil_net",
            "GOLD - COMMODITY": "cot_gold_net"
        }

        metadata_records = [
            {"series_id": "cot_sp500_net", "title": "S&P 500 Net Speculative Positioning", "source": "CFTC COT", "tab_name": "Positioning"},
            {"series_id": "cot_treasury_net", "title": "10-Year Treasury Net Speculative Positioning", "source": "CFTC COT", "tab_name": "Positioning"},
            {"series_id": "cot_eurusd_net", "title": "Euro FX Net Speculative Positioning", "source": "CFTC COT", "tab_name": "Positioning"},
            {"series_id": "cot_oil_net", "title": "Crude Oil Net Speculative Positioning", "source": "CFTC COT", "tab_name": "Positioning"},
            {"series_id": "cot_gold_net", "title": "Gold Net Speculative Positioning", "source": "CFTC COT", "tab_name": "Positioning"}
        ]

        records_to_insert = []

        # Loop through all files for the past 3 years
        for year in years_to_fetch:
            for template in file_templates:
                url = template.format(year)
                
                try:
                    res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
                    if res.status_code != 200:
                        continue 
                        
                    with zipfile.ZipFile(io.BytesIO(res.content)) as z:
                        txt_files = [f for f in z.namelist() if f.endswith('.txt')]
                        if not txt_files:
                            continue
                        
                        with z.open(txt_files[0]) as f:
                            content = f.read().decode('utf-8', errors='ignore')

                    lines = content.splitlines()
                    reader = csv.DictReader(lines, delimiter=',')
                    if "Market_and_Exchange_Names" not in [str(h).strip() for h in (reader.fieldnames or [])]:
                        reader = csv.DictReader(lines, delimiter='|')

                    clean_fieldnames = [str(h).strip().replace('\ufeff', '').replace('"', '') for h in (reader.fieldnames or [])]
                    reader.fieldnames = clean_fieldnames

                    for row in reader:
                        market = str(row.get("Market_and_Exchange_Names", "")).upper()
                        
                        # THE FIX: Prevent tiny Yield and Micro contracts from overwriting our primary data!
                        if "YIELD" in market or "MICRO" in market:
                            continue
                        
                        series_id = None
                        for key, slug in contract_map.items():
                            if key in market:
                                series_id = slug
                                break

                        if series_id:
                            date_str = row.get("Report_Date_as_YYYY-MM-DD")
                            longs = row.get("NonComm_Positions_Long_All") or row.get("M_Money_Positions_Long_All") or row.get("Lev_Money_Positions_Long_All") or "0"
                            shorts = row.get("NonComm_Positions_Short_All") or row.get("M_Money_Positions_Short_All") or row.get("Lev_Money_Positions_Short_All") or "0"

                            try:
                                net_position = float(str(longs).replace(',', '')) - float(str(shorts).replace(',', ''))
                                records_to_insert.append({
                                    "series_id": series_id,
                                    "date": date_str,
                                    "value": net_position
                                })
                            except (ValueError, TypeError):
                                continue
                                
                except Exception as e:
                    print(f"Skipped {url}: {e}")
                    continue

        with engine.begin() as conn:
            for meta in metadata_records:
                conn.execute(text("""
                    INSERT INTO series_metadata (series_id, title, source, tab_name)
                    VALUES (:series_id, :title, :source, :tab_name)
                    ON CONFLICT (series_id) DO NOTHING
                """), meta)

        if records_to_insert:
            with engine.begin() as conn:
                for rec in records_to_insert:
                    conn.execute(text("""
                        INSERT INTO macro_data (series_id, date, value)
                        VALUES (:series_id, :date, :value)
                        ON CONFLICT (series_id, date) DO UPDATE SET value = EXCLUDED.value
                    """), rec)

        return {
            "status": "Success! CFTC 3-Year History Parsed.", 
            "records_updated": len(records_to_insert)
        }

    except Exception as e:
        return {"error": f"Failed to update CFTC data: {str(e)}"}


# --- OFFICIAL GOVERNMENT RSS FEEDS (FED / BLS / BEA) ---

@router.get("/api/gov-news")
def get_gov_news():
    """
    Fetches the official XML RSS feeds from US Government sources,
    parses them, and returns a unified JSON news feed.
    """
    # Standard official RSS feeds for macro events
    feeds = [
        {"source": "Federal Reserve", "url": "https://www.federalreserve.gov/feeds/press_all.xml"},
        {"source": "US Treasury", "url": "https://home.treasury.gov/rss/press_releases"},
        # Note: BLS/BEA often change their RSS structures, so we start with the most stable ones (Fed/Treasury)
    ]
    
    news_items = []
    
    for feed in feeds:
        try:
            # Fetch the XML data
            res = requests.get(feed["url"], headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
            if res.status_code == 200:
                root = ET.fromstring(res.content)
                
                # RSS feeds store news inside <item> tags
                for item in root.findall('.//item')[:8]:  # Grab the 8 most recent from each
                    title = item.findtext('title')
                    link = item.findtext('link')
                    pub_date_str = item.findtext('pubDate')
                    
                    # Convert the messy RSS date string into a clean Unix Timestamp
                    timestamp = 0
                    if pub_date_str:
                        try:
                            parsed_tuple = email.utils.parsedate_tz(pub_date_str)
                            if parsed_tuple:
                                timestamp = email.utils.mktime_tz(parsed_tuple)
                        except Exception:
                            pass
                            
                    news_items.append({
                        "title": title or "Official Press Release",
                        "publisher": feed["source"],
                        "link": link or "#",
                        "time": timestamp
                    })
        except Exception as e:
            print(f"Skipped {feed['source']} RSS due to error: {e}")
            continue

    # Sort the combined news items by timestamp (Newest first)
    news_items.sort(key=lambda x: x["time"], reverse=True)

    return {"data": news_items[:15]} # Return the top 15 most recent government updates