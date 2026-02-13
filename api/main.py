from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from api.models import AnalysisRequest, AnalysisResponse, OpenBBRequest
from api.manager import manager
import sys
import json
import random
from datetime import datetime, timedelta

# OPENBB SETUP
USE_MOCK = False
try:
    from openbb import obb
except ImportError:
    USE_MOCK = True
    print("Warning: OpenBB module not found. Using MOCK data.", file=sys.stderr)
except Exception as e:
    USE_MOCK = True

# Fallback: Try to import yfinance directly if OpenBB is missing (it's lighter)
try:
    import yfinance as yf
    HAS_YFINANCE = True
except ImportError:
    HAS_YFINANCE = False

# --- HELPER FUNCTIONS (Migrated from bridge script) ---
def get_mock_price(ticker):
    data = []
    price = 150.0 if ticker == "AAPL" else 100.0
    today = datetime.now()
    for i in range(180):
        date = (today - timedelta(days=180-i)).strftime('%Y-%m-%d')
        change = random.uniform(-2, 2.5)
        price += change
        data.append({"date": date, "close": round(price, 2)})
    return {"data": data}

def get_mock_news(ticker):
    base_news = [
        {"title": f"{ticker} announces revolutionary AI feature", "date": datetime.now().isoformat(), "source": "Bloomberg", "url": f"https://www.google.com/search?q={ticker}+AI+feature"},
        {"title": "Market rally continues as tech stocks soar", "date": (datetime.now() - timedelta(days=1)).isoformat(), "source": "Reuters", "url": f"https://www.google.com/search?q={ticker}+stock+rally"},
        {"title": f"Analyst upgrades {ticker} to 'Buy'", "date": (datetime.now() - timedelta(days=2)).isoformat(), "source": "Benzinga", "url": f"https://www.google.com/search?q={ticker}+analyst+upgrade"},
        {"title": "Fed signals potential rate cuts", "date": (datetime.now() - timedelta(days=3)).isoformat(), "source": "WSJ", "url": f"https://www.google.com/search?q=fed+rate+cuts+{ticker}"},
        {"title": f"Why {ticker} is the stock to watch this week", "date": (datetime.now() - timedelta(days=4)).isoformat(), "source": "TechCrunch", "url": f"https://www.google.com/search?q={ticker}+stock+news"},
    ]
    return {"data": base_news * 3}

def get_mock_profile(ticker):
    return {"data": [{
        "shortName": f"{ticker} Inc.",
        "currency": "USD",
        "marketCap": 2500000000000 if ticker == "AAPL" else 50000000000,
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "exchange": "NASDAQ"
    }]}

@app.post("/api/openbb")
async def openbb_endpoint(request: OpenBBRequest):
    ticker = request.ticker
    data_type = request.type
    
    if data_type == 'price':
        if USE_MOCK: return get_mock_price(ticker)
        try:
            start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
            df = obb.equity.price.historical(ticker, start_date=start_date, provider="yfinance").to_dataframe()
            if 'date' not in df.columns and 'Date' not in df.columns:
                df = df.reset_index()
            result = json.loads(df.to_json(orient="records", date_format="iso"))
            return {"data": result}
        except Exception as e:
            print(f"Error fetching price: {e}")
            return get_mock_price(ticker)

    elif data_type == 'news':
        if USE_MOCK:
            if HAS_YFINANCE:
                try:
                    news = yf.Ticker(ticker).news
                    formatted_news = []
                    for item in news:
                        formatted_news.append({
                            "title": item.get('title'),
                            "date": datetime.fromtimestamp(item.get('providerPublishTime', 0)).isoformat(),
                            "source": item.get('publisher'),
                            "url": item.get('link')
                        })
                    if formatted_news: return {"data": formatted_news}
                except Exception as e:
                    print(f"Direct YFinance news failed in API: {e}")
            return get_mock_news(ticker)
        try:
            df = None
            # Try 1: Yahoo Finance (Broad coverage, usually no key needed)
            try:
                df = obb.news.company(symbol=ticker, provider="yfinance").to_dataframe()
            except Exception as e:
                print(f"YFinance news failed: {e}")

            # Try 2: Benzinga (Needs key usually, but good fallback)
            if df is None or df.empty:
                try:
                    df = obb.news.company(symbol=ticker, provider="benzinga").to_dataframe()
                except Exception as e:
                     print(f"Benzinga news failed: {e}")

            # Try 3: World News (If company specific fails)
            if df is None or df.empty:
                 try:
                    df = obb.news.world(limit=5, provider="benzinga").to_dataframe()
                 except:
                    pass

            if df is None or df.empty:
                # Fallback: Try direct yfinance even if OpenBB is loaded but failed
                if HAS_YFINANCE:
                    try:
                        news = yf.Ticker(ticker).news
                        formatted_news = []
                        for item in news:
                           # Extract URL from nested content if top-level is missing
                           url = item.get('link') or item.get('url')
                           if not url:
                               url = item.get('content', {}).get('clickThroughUrl', {}).get('url')

                           formatted_news.append({
                                "title": item.get('title'),
                                "date": datetime.fromtimestamp(item.get('providerPublishTime', 0)).isoformat(),
                                "source": item.get('publisher'),
                                "url": url
                            })
                        if formatted_news: return {"data": formatted_news}
                    except Exception as e:
                        print(f"Direct YFinance fallback failed: {e}")

            if df is None or df.empty:
                return get_mock_news(ticker)

            # Standardize URL column name
            if 'link' in df.columns:
                df = df.rename(columns={'link': 'url'})
            if 'URL' in df.columns:
                df = df.rename(columns={'URL': 'url'})

            if 'date' not in df.columns and 'Date' not in df.columns:
                 df = df.reset_index()
            result = json.loads(df.to_json(orient="records", date_format="iso"))
            return {"data": result}
        except Exception as e:
            print(f"Error fetching news: {e}")
            # Fallback 2: Direct YFinance on error
            if HAS_YFINANCE:
                 try:
                    news = yf.Ticker(ticker).news
                    formatted_news = []
                    for item in news:
                        # Extract URL from nested content if top-level is missing
                        url = item.get('link') or item.get('url')
                        if not url:
                            url = item.get('content', {}).get('clickThroughUrl', {}).get('url')

                        formatted_news.append({
                            "title": item.get('title'),
                            "date": datetime.fromtimestamp(item.get('providerPublishTime', 0)).isoformat(),
                            "source": item.get('publisher'),
                            "url": url
                        })
                    if formatted_news: return {"data": formatted_news}
                 except: pass
            return get_mock_news(ticker)

    elif data_type == 'profile':
        if USE_MOCK: return get_mock_profile(ticker)
        try:
            df = obb.equity.fundamental.overview(symbol=ticker, provider="yfinance").to_dataframe()
            result = json.loads(df.to_json(orient="records", date_format="iso"))
            return {"data": result}
        except Exception as e:
            print(f"Error fetching profile: {e}")
            return get_mock_profile(ticker)
            
    return {"error": "Invalid type"}

app = FastAPI(title="Infinity Trading Agent API - v2.1 Concise Mode")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all. Restrict in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    run_id = manager.start_analysis(request.dict())
    return AnalysisResponse(run_id=run_id, ticker=request.ticker, status="pending")

@app.post("/api/analyze-stream")
async def analyze_stream(request: AnalysisRequest):
    return StreamingResponse(
        manager.stream_analysis_generator(request.dict()),
        media_type="application/x-ndjson"
    )

@app.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await websocket.accept()
    try:
        async for message in manager.stream_events(run_id):
            await websocket.send_text(message)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/health") # Vercel commonly hits /api/something
def api_health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
