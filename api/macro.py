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
import pandas as pd
from io import BytesIO

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


# --- LIVE ECB & FRED DATA PORTAL ROUTE ---

@router.get("/api/ecb")
def get_ecb_data():
    """
    Fetches 100% LIVE inflation data:
    1. Eurozone HICP from the European Central Bank (Year-over-Year %)
    2. US CPI from FRED (Year-over-Year %)
    """
    try:
        # 1. FETCH LIVE EUROZONE INFLATION FROM ECB
        # We request 'csvdata' because ECB's JSON format is notoriously difficult to parse
        ecb_url = "https://data-api.ecb.europa.eu/service/data/ICP/M.U2.N.000000.4.ANR?lastNObservations=12&format=csvdata"
        ecb_res = requests.get(ecb_url, timeout=5)
        
        # Read the CSV data line by line
        ecb_lines = ecb_res.text.splitlines()
        ecb_reader = csv.DictReader(ecb_lines)
        
        ez_dict = {}
        for row in ecb_reader:
            # TIME_PERIOD is '2023-03', OBS_VALUE is '6.9'
            period = row.get("TIME_PERIOD")
            val = row.get("OBS_VALUE")
            if period and val:
                ez_dict[period] = float(val)

        # 2. FETCH LIVE US INFLATION FROM FRED
        fred_api_key = os.getenv("FRED_API_KEY")
        if not fred_api_key:
            return {"error": "Missing FRED_API_KEY"}
            
        # Notice 'units=pc1' - this tells FRED to automatically calculate the Year-Over-Year % change!
        fred_url = f"https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key={fred_api_key}&file_type=json&units=pc1&sort_order=desc&limit=12"
        fred_res = requests.get(fred_url, timeout=5).json()
        
        us_dict = {}
        for obs in fred_res.get("observations", []):
            # FRED dates look like '2023-03-01'. We slice the first 7 chars ('2023-03') to match the ECB format
            period = obs["date"][:7] 
            val = obs["value"]
            if val != ".":
                us_dict[period] = round(float(val), 1)

        # 3. COMBINE BOTH LIVE DATASETS FOR THE CHART
        combined_data = []
        
        # Sort the dates chronologically (oldest to newest)
        sorted_periods = sorted(ez_dict.keys()) 
        
        for period in sorted_periods:
            # Convert '2023-03' into 'Mar 2023' so it looks beautiful on your X-Axis
            date_obj = datetime.datetime.strptime(period, "%Y-%m")
            formatted_month = date_obj.strftime("%b %Y")
            
            combined_data.append({
                "month": formatted_month,
                "ez": ez_dict[period],
                "us": us_dict.get(period, 0.0) # Grab the matching US data for that same month
            })
            
        return {"data": combined_data}
        
    except Exception as e:
        print("Live Data Error:", e)
        return {"error": str(e)}
    



# --- LIVE OECD G20 GDP ROUTE (UPDATED FOR NEW SDMX API) ---

@router.get("/api/oecd")
def get_oecd_data():
    """
    Fetches LIVE Real GDP Growth for G20 nations.
    Routed through the World Bank API for 100% stable uptime (Bypassing OECD 422 errors).
    """
    try:
        import requests
        
        # Indicator NY.GDP.MKTP.KD.ZG is Annual GDP Growth (%)
        # mrnev=1 tells the World Bank to automatically grab the "Most Recent Non-Empty Value"
        countries = "USA;IND;CHN;JPN;GBR;DEU;FRA;CAN;BRA;AUS"
        wb_url = f"http://api.worldbank.org/v2/country/{countries}/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrnev=1"
        
        res = requests.get(wb_url, timeout=15)
        
        if res.status_code != 200:
            return {"error": f"API Error: {res.status_code}"}
            
        json_data = res.json()
        
        # World Bank JSON returns an array where index [1] holds the actual data list
        if len(json_data) < 2:
            return {"error": "API connected but returned empty dimensions."}
            
        records = json_data[1]
        live_g20_data = []
        
        for record in records:
            country_code = record.get("countryiso3code")
            value = record.get("value")
            
            # Catch the data and format it exactly how our React frontend expects it
            if country_code and value is not None:
                live_g20_data.append({
                    "country": country_code,
                    "gdpGrowth": round(float(value), 1)
                })
                
        # Sort from highest to lowest so the bar chart looks clean
        live_g20_data.sort(key=lambda x: x["gdpGrowth"], reverse=True)
        
        return {"data": live_g20_data}
        
    except Exception as e:
        print("Live Macro Data Error:", e)
        return {"error": str(e)}


# --- ADMIN TRIGGER: UPDATE PHILLY FED SPF (CONSENSUS FORECASTS) ---

@router.get("/api/admin/update-spf")
def update_philly_fed_spf():
    """
    Downloads the quarterly Survey of Professional Forecasters (SPF) Excel files.
    Uses an Auto-Scraper to dynamically find the Master Workbook to prevent 404 errors.
    """
    try:
        import requests
        import re
        import pandas as pd
        from io import BytesIO
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml'
        }
        
        # 1. Scrape the Fed's website to find the exact current URL for the Master Excel file
        page_url = "https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/median-forecasts"
        page_res = requests.get(page_url, headers=headers, timeout=15)
        
        # Use Regex to hunt down the dynamic link for the MedianLevel workbook
        match = re.search(r'href="([^"]*?medianlevel\.xlsx[^"]*)"', page_res.text, re.IGNORECASE)
        
        if not match:
            return {"error": "Auto-scraper failed: Could not locate the MedianLevel.xlsx link on the Fed's webpage."}
            
        excel_path = match.group(1)
        
        # If the Fed used a relative link (starts with /), append the main domain
        if excel_path.startswith("/"):
            excel_path = "https://www.philadelphiafed.org" + excel_path
            
        # 2. Download the actual Master Excel File
        excel_res = requests.get(excel_path, headers=headers, timeout=15)
        
        if not excel_res.content.startswith(b'PK'):
            return {"error": "Downloaded file is still not a valid ZIP/Excel archive."}
            
        # 3. Read the specific indicator worksheets from the Master File
        # Dictionary mapping our database name to the exact Fed Sheet Name
        indicators_to_sheets = {
            "GDP YoY": "RGDP",
            "CPI Headline YoY": "CPI",
            "Unemployment Rate": "UNEMP"
        }
        
        records_to_insert = []
        
        for indicator_name, sheet_name in indicators_to_sheets.items():
            try:
                # Read strictly the specific worksheet we need
                df = pd.read_excel(BytesIO(excel_res.content), sheet_name=sheet_name, engine='openpyxl')
                
                # The data is organized chronologically. Grab the last 4 quarters.
                recent_data = df.tail(4).to_dict('records')
                
                for row in recent_data:
                    year = int(row.get("YEAR", 0))
                    quarter = int(row.get("QUARTER", 0))
                    
                    if year == 0 or quarter == 0:
                        continue
                        
                    month_map = {1: "03-31", 2: "06-30", 3: "09-30", 4: "12-31"}
                    event_date = f"{year}-{month_map[quarter]}"
                    
                    # According to Fed docs, the current quarter's forecast is stored in the column 
                    # named [SheetName]2 (e.g. RGDP2, CPI2, UNEMP2)
                    col_name = f"{sheet_name}2"
                    
                    if col_name in row:
                        consensus_val = row[col_name]
                    else:
                        # Fallback: grab the 4th column which is typically the current quarter
                        consensus_val = list(row.values())[3]
                        
                    if pd.notna(consensus_val):
                        records_to_insert.append({
                            "event_date": event_date,
                            "indicator": indicator_name,
                            "country": "USA",
                            "consensus": round(float(consensus_val), 2),
                            "source": "philly_fed_spf"
                        })
            except Exception as e:
                print(f"Failed parsing sheet {sheet_name}:", e)
                
        # 4. Insert into your Neon database
        if records_to_insert:
            with engine.begin() as conn:
                for rec in records_to_insert:
                    conn.execute(text("""
                        INSERT INTO events (event_date, indicator, country, consensus, source)
                        VALUES (:event_date, :indicator, :country, :consensus, :source)
                        ON CONFLICT DO NOTHING
                    """), rec)
                    
        return {
            "status": "Success! Philly Fed SPF Auto-Scrape Complete",
            "records_added": len(records_to_insert),
            "source_url_used": excel_path
        }

    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}
    

@router.get("/api/consensus")
def get_consensus_data():
    """
    Fetches the Philly Fed SPF consensus forecasts from the database for the frontend.
    """
    try:
        # Query the events table for our new SPF data
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT indicator, event_date, consensus 
                FROM events 
                WHERE source = 'philly_fed_spf'
                ORDER BY indicator ASC, event_date ASC
            """))
            
            data = [dict(row) for row in result.mappings()]
            
            return {"data": data}
    except Exception as e:
        print("Consensus Fetch Error:", e)
        return {"error": str(e)}