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
    Downloads the weekly CFTC COT ZIP file, calculates Net Non-Commercial positions,
    and saves the data to the macro_data table.
    """
    current_year = datetime.datetime.now().year
    url = f"https://www.cftc.gov/files/dea/history/fut_disagg_txt_{current_year}.zip"

    try:
        # 1. Download the ZIP file from the CFTC
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        res.raise_for_status()

        # 2. Unzip it directly in memory (No saving to hard drive needed!)
        with zipfile.ZipFile(io.BytesIO(res.content)) as z:
            # The data file is usually called f_year.txt
            txt_files = [f for f in z.namelist() if f.endswith('.txt')]
            if not txt_files:
                return {"error": "No data file found in the CFTC zip."}
            
            filename = txt_files[0]
            with z.open(filename) as f:
                content = f.read().decode('utf-8')

        # 3. Define the exact CFTC contract names we care about
        contract_map = {
            "E-MINI S&P 500 STOCK INDEX": "cot_sp500_net",
            "10-YEAR U.S. TREASURY NOTES": "cot_treasury_net",
            "EURO FX": "cot_eurusd_net",
            "CRUDE OIL, LIGHT SWEET - NYMEX": "cot_oil_net",
            "GOLD-COMMODITY EXCHANGE INC.": "cot_gold_net"
        }

        records_to_insert = []
        
        # Parse the CSV (The spec says pipe-delimited, but we check for commas just in case)
        reader = csv.DictReader(content.splitlines(), delimiter=',')
        if "Market_and_Exchange_Names" not in reader.fieldnames:
            reader = csv.DictReader(content.splitlines(), delimiter='|')

        # 4. Loop through the thousands of rows and crunch the math
        for row in reader:
            market = row.get("Market_and_Exchange_Names", "").strip()
            
            # Check if this row is one of our 5 target assets
            series_id = None
            for key, slug in contract_map.items():
                if market.startswith(key):
                    series_id = slug
                    break

            if series_id:
                date_str = row.get("Report_Date_as_YYYY-MM-DD")
                # Grab Longs and Shorts (defaulting to 0 if missing)
                longs = row.get("NonComm_Positions_Long_All") or "0"
                shorts = row.get("NonComm_Positions_Short_All") or "0"

                try:
                    # Calculate: Net Position = Longs - Shorts
                    net_position = float(longs.replace(',', '')) - float(shorts.replace(',', ''))
                    
                    records_to_insert.append({
                        "series_id": series_id,
                        "date": date_str,
                        "value": net_position
                    })
                except ValueError:
                    continue

        # 5. Save everything to your Postgres database
        if records_to_insert:
            with engine.begin() as conn:
                for rec in records_to_insert:
                    # Insert the new data, or update it if it already exists
                    conn.execute(text("""
                        INSERT INTO macro_data (series_id, date, value)
                        VALUES (:series_id, :date, :value)
                        ON CONFLICT (series_id, date) DO UPDATE SET value = EXCLUDED.value
                    """), rec)

        return {
            "status": "Success! CFTC Data Parsed.", 
            "records_updated": len(records_to_insert)
        }

    except Exception as e:
        return {"error": f"Failed to update CFTC data: {str(e)}"}