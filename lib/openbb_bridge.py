import sys
import json
import argparse
from datetime import datetime, timedelta
import random

# CONFIG: Mock Data Fallback
USE_MOCK = False

try:
    from openbb import obb
except ImportError:
    USE_MOCK = True
    # We print to stderr so it doesn't corrupt the JSON stdout
    print("Warning: OpenBB module not found or corrupted. Using MOCK data.", file=sys.stderr)
except Exception as e:
    USE_MOCK = True
    print(f"Warning: OpenBB Error: {e}. Using MOCK data.", file=sys.stderr)

def get_mock_price(ticker):
    # Generate 180 days of fake price data with a trend
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
        {"title": f"{ticker} announces revolutionary AI feature", "date": datetime.now().isoformat(), "source": "Bloomberg", "url": "#"},
        {"title": "Market rally continues as tech stocks soar", "date": (datetime.now() - timedelta(days=1)).isoformat(), "source": "Reuters", "url": "#"},
        {"title": f"Analyst upgrades {ticker} to 'Buy'", "date": (datetime.now() - timedelta(days=2)).isoformat(), "source": "Benzinga", "url": "#"},
        {"title": "Fed signals potential rate cuts", "date": (datetime.now() - timedelta(days=3)).isoformat(), "source": "WSJ", "url": "#"},
        {"title": f"Why {ticker} is the stock to watch this week", "date": (datetime.now() - timedelta(days=4)).isoformat(), "source": "TechCrunch", "url": "#"},
    ]
    # Triple the news to ensure scrolling
    return {"data": base_news + base_news + base_news}

def get_mock_profile(ticker):
    return {"data": [{
        "shortName": f"{ticker} Inc.",
        "currency": "USD",
        "marketCap": 2500000000000 if ticker == "AAPL" else 50000000000,
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "exchange": "NASDAQ"
    }]}

#########################################################

def get_historical_price(ticker):
    if USE_MOCK: return get_mock_price(ticker)
    try:
        start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        df = obb.equity.price.historical(ticker, start_date=start_date, provider="yfinance").to_dataframe()
        
        if 'date' not in df.columns and 'Date' not in df.columns:
            df = df.reset_index()
            
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        print(f"Error fetching price: {e}", file=sys.stderr)
        return get_mock_price(ticker) # Fallback if individual call fails

def get_crypto_price(ticker):
    if USE_MOCK: return get_mock_price(ticker)
    try:
        start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        df = obb.crypto.price.historical(ticker, start_date=start_date, provider="yfinance").to_dataframe()
        if 'date' not in df.columns and 'Date' not in df.columns:
            df = df.reset_index()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        print(f"Error fetching crypto: {e}", file=sys.stderr)
        return get_mock_price(ticker)

def get_forex_price(ticker):
    if USE_MOCK: return get_mock_price(ticker)
    try:
        start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        df = obb.currency.price.historical(ticker, start_date=start_date, provider="yfinance").to_dataframe()
        if 'date' not in df.columns and 'Date' not in df.columns:
            df = df.reset_index()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        print(f"Error fetching forex: {e}", file=sys.stderr)
        return get_mock_price(ticker)

def get_economy_data(ticker):
    if USE_MOCK: return get_mock_price(ticker)
    try:
        symbol = "CPIAUCSL" if ticker == "ECON" else ticker
        df = obb.economy.fred.series(symbol, start_date="2020-01-01").to_dataframe()
        if 'date' not in df.columns and 'Date' not in df.columns:
            df = df.reset_index()
        if symbol in df.columns:
                df = df.rename(columns={symbol: 'close'})
        cols = df.columns
        if 'close' not in cols and len(cols) > 1:
                df = df.rename(columns={cols[-1]: 'close'})
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        print(f"Error fetching economy: {e}", file=sys.stderr)
        return get_mock_price(ticker)

def get_news(ticker):
    if USE_MOCK: return get_mock_news(ticker)
    try:
        try:
             df = obb.news.company(symbol=ticker, provider="benzinga").to_dataframe()
        except:
             df = obb.news.world(limit=5, provider="benzinga").to_dataframe()

        if 'date' not in df.columns and 'Date' not in df.columns:
             df = df.reset_index()

        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        print(f"Error fetching news: {e}", file=sys.stderr)
        return get_mock_news(ticker)

def get_company_profile(ticker):
    if USE_MOCK: return get_mock_profile(ticker)
    try:
        df = obb.equity.fundamental.overview(symbol=ticker, provider="yfinance").to_dataframe()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        print(f"Error fetching profile: {e}", file=sys.stderr)
        return get_mock_profile(ticker)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='OpenBB Data Bridge')
    parser.add_argument('--ticker', type=str, required=True, help='Stock Ticker Symbol')
    parser.add_argument('--type', type=str, required=True, choices=['price', 'news', 'profile'], help='Type of data to fetch')
    
    args = parser.parse_args()
    
    if args.type == 'price':
        print(json.dumps(get_historical_price(args.ticker)))
    elif args.type == 'crypto':
        print(json.dumps(get_crypto_price(args.ticker)))
    elif args.type == 'forex':
         print(json.dumps(get_forex_price(args.ticker)))
    elif args.type == 'economy':
         print(json.dumps(get_economy_data(args.ticker)))
    elif args.type == 'news':
        print(json.dumps(get_news(args.ticker)))
    elif args.type == 'profile':
        print(json.dumps(get_company_profile(args.ticker)))
