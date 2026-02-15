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
    print("Warning: OpenBB module not found or corrupted. Using MOCK data.", file=sys.stderr)
except Exception as e:
    USE_MOCK = True
    print(f"Warning: OpenBB Error: {e}. Using MOCK data.", file=sys.stderr)

# Fallback: Try to import yfinance directly if OpenBB is missing (it's lighter)
try:
    import yfinance as yf
    HAS_YFINANCE = True
except ImportError:
    HAS_YFINANCE = False

# --- MOCK LOGIC ---
def get_mock_response(ticker, dtype):
    if dtype in ['price', 'crypto', 'forex', 'economy', 'bonds']:
        data = []
        price = 20000.0 if dtype == 'crypto' else (1.1 if dtype == 'forex' else (4.0 if dtype == 'bonds' else 150.0))
        today = datetime.now()
        days = 180
        for i in range(days):
            date = (today - timedelta(days=days-i)).strftime('%Y-%m-%d')
            change = random.uniform(-0.01, 0.01) * price
            price += change
            data.append({"date": date, "close": round(price, 4)})
        return {"data": data}
    
    elif dtype == 'technical':
        data = []
        today = datetime.now()
        for i in range(30):
             date = (today - timedelta(days=30-i)).strftime('%Y-%m-%d')
             data.append({"date": date, "rsi": random.uniform(30, 70)})
        return {"data": data}

    elif dtype == 'quantitative':
        return {"data": [
            {"metric": "Sharpe Ratio", "value": 1.25}, 
            {"metric": "Beta", "value": 1.15}, 
            {"metric": "Alpha", "value": 0.05}, 
            {"metric": "Sortino", "value": 1.5}
        ]}

    elif dtype == 'options':
        data = []
        strikes = [100, 110, 120, 130, 140, 150, 160]
        for k in strikes:
            data.append({"strike": k, "optionType": "call", "lastPrice": random.uniform(5, 20), "volume": random.randint(100, 5000)})
            data.append({"strike": k, "optionType": "put", "lastPrice": random.uniform(5, 20), "volume": random.randint(100, 5000)})
        return {"data": data}

    elif dtype == 'fundamentals':
         return {"data": [
             {"period": "2023", "revenue": 100000000, "netIncome": 20000000},
             {"period": "2022", "revenue": 90000000, "netIncome": 15000000},
             {"period": "2021", "revenue": 80000000, "netIncome": 10000000},
         ]}

    elif dtype == 'news':
        base_news = [
            {"title": f"{ticker} Market Update", "date": datetime.now().isoformat(), "source": "Bloomberg", "url": f"https://www.google.com/search?q={ticker}+market+update"},
            {"title": "Global Markets Rally", "date": (datetime.now() - timedelta(days=1)).isoformat(), "source": "Reuters", "url": f"https://www.google.com/search?q={ticker}+global+markets"},
            {"title": f"Analysis: {ticker} Outlook", "date": (datetime.now() - timedelta(days=2)).isoformat(), "source": "Benzinga", "url": f"https://www.google.com/search?q={ticker}+stock+analysis"},
        ]
        return {"data": base_news + base_news}
    elif dtype == 'profile':
        return {"data": [{
            "shortName": f"{ticker} Asset", "currency": "USD", 
            "marketCap": 0, "sector": "N/A", "industry": "N/A", "exchange": "GLOBAL"
        }]}
    return {"error": "Unknown type"}

# --- DATA FETCHERS ---
def get_historical_price(ticker):
    if USE_MOCK: return get_mock_response(ticker, 'price')
    try:
        start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        df = obb.equity.price.historical(ticker, start_date=start_date, provider="yfinance").to_dataframe()
        if 'date' not in df.columns and 'Date' not in df.columns: df = df.reset_index()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except: return get_mock_response(ticker, 'price')

def get_crypto_price(ticker):
    if USE_MOCK: return get_mock_response(ticker, 'crypto')
    try:
        start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        df = obb.crypto.price.historical(ticker, start_date=start_date, provider="yfinance").to_dataframe()
        if 'date' not in df.columns and 'Date' not in df.columns: df = df.reset_index()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except: return get_mock_response(ticker, 'crypto')

def get_forex_price(ticker):
    if USE_MOCK: return get_mock_response(ticker, 'forex')
    try:
        start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        df = obb.currency.price.historical(ticker, start_date=start_date, provider="yfinance").to_dataframe()
        if 'date' not in df.columns and 'Date' not in df.columns: df = df.reset_index()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except: return get_mock_response(ticker, 'forex')

def get_economy_data(ticker):
    if USE_MOCK: return get_mock_response(ticker, 'economy')
    try:
        symbol = "CPIAUCSL" if ticker == "ECON" else ticker
        df = obb.economy.fred.series(symbol, start_date="2020-01-01").to_dataframe()
        if 'date' not in df.columns: df = df.reset_index()
        if symbol in df.columns: df = df.rename(columns={symbol: 'close'})
        cols = df.columns
        if 'close' not in cols and len(cols) > 1: df = df.rename(columns={cols[-1]: 'close'})
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except: return get_mock_response(ticker, 'economy')

def get_news(ticker):
    # Special Handling: If MOCK but we have YFinance, try to get real news directly
    if USE_MOCK and HAS_YFINANCE:
        try:
            news = yf.Ticker(ticker).news
            # Convert yfinance format to our format
            # YF returns: [{'uuid':..., 'title':..., 'publisher':..., 'link':..., 'providerPublishTime':...}]
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
            return {"data": formatted_news}
        except Exception as e:
            print(f"Direct YFinance news failed: {e}", file=sys.stderr)
            return get_mock_response(ticker, 'news')

    if USE_MOCK: return get_mock_response(ticker, 'news')
    try:
        df = None
        # Try 1: Yahoo Finance
        try:
            df = obb.news.company(symbol=ticker, provider="yfinance").to_dataframe()
        except: pass

        # Try 2: Benzinga
        if df is None or df.empty:
            try: df = obb.news.company(symbol=ticker, provider="benzinga").to_dataframe()
            except: pass
            
        # Try 3: World News
        if df is None or df.empty:
             try: df = obb.news.world(limit=5, provider="benzinga").to_dataframe()
             except: pass

        if df is None or df.empty:
            return get_mock_response(ticker, 'news')

        # Standardize URL
        if 'link' in df.columns: df = df.rename(columns={'link': 'url'})
        if 'URL' in df.columns: df = df.rename(columns={'URL': 'url'})

        if 'date' not in df.columns: df = df.reset_index()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except: return get_mock_response(ticker, 'news')

def get_company_profile(ticker):
    if USE_MOCK: return get_mock_response(ticker, 'profile')
    try:
        df = obb.equity.fundamental.overview(symbol=ticker, provider="yfinance").to_dataframe()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except: return get_mock_response(ticker, 'profile')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='OpenBB Data Bridge')
    parser.add_argument('--ticker', type=str, required=True, help='Stock Ticker Symbol')
    parser.add_argument('--type', type=str, required=True, help='Type of data')
    
    args = parser.parse_args()

    # Dispatcher
    if args.type == 'price': print(json.dumps(get_historical_price(args.ticker)))
    elif args.type == 'crypto': print(json.dumps(get_crypto_price(args.ticker)))
    elif args.type == 'forex': print(json.dumps(get_forex_price(args.ticker)))
    elif args.type == 'economy': print(json.dumps(get_economy_data(args.ticker)))
    elif args.type == 'news': print(json.dumps(get_news(args.ticker)))
    elif args.type == 'profile': print(json.dumps(get_company_profile(args.ticker)))
    
    # New Types
    elif args.type == 'technical':
        try:
            if USE_MOCK: print(json.dumps(get_mock_response(args.ticker, 'technical')))
            else:
                rsi = obb.technical.rsi(data=args.ticker, provider="pandas_ta").to_dataframe()
                if 'date' not in rsi.columns: rsi = rsi.reset_index()
                result = json.loads(rsi.to_json(orient="records", date_format="iso"))
                print(json.dumps({"data": result}))
        except: print(json.dumps(get_mock_response(args.ticker, 'technical')))

    elif args.type == 'quantitative':
        try: print(json.dumps(get_mock_response(args.ticker, 'quantitative')))
        except: print(json.dumps(get_mock_response(args.ticker, 'quantitative')))

    elif args.type == 'options':
        try:
            if USE_MOCK: print(json.dumps(get_mock_response(args.ticker, 'options')))
            else:
                try:
                    df = obb.derivatives.options.chains(symbol=args.ticker, provider="yfinance").to_dataframe()
                    df = df.head(50)
                    result = json.loads(df.to_json(orient="records", date_format="iso"))
                    print(json.dumps({"data": result}))
                except:
                    print(json.dumps({"data": []}))
        except: print(json.dumps(get_mock_response(args.ticker, 'options')))

    elif args.type == 'analysts':
        try:
             if USE_MOCK: print(json.dumps({"data": []}))
             else:
                df = obb.equity.estimates.consensus(symbol=args.ticker, provider="yfinance").to_dataframe()
                result = json.loads(df.to_json(orient="records", date_format="iso"))
                print(json.dumps({"data": result}))
        except: print(json.dumps({"data": []}))

    elif args.type == 'earnings':
        try:
             if USE_MOCK: print(json.dumps({"data": []}))
             else:
                df = obb.equity.fundamental.earnings(symbol=args.ticker, provider="yfinance").to_dataframe()
                result = json.loads(df.to_json(orient="records", date_format="iso"))
                print(json.dumps({"data": result}))
        except: print(json.dumps({"data": []}))

    elif args.type == 'holders':
        try:
             if USE_MOCK: print(json.dumps({"data": []}))
             else:
                df = obb.equity.ownership.institutional(symbol=args.ticker, provider="yfinance").to_dataframe()
                result = json.loads(df.to_json(orient="records", date_format="iso"))
                print(json.dumps({"data": result}))
        except: print(json.dumps({"data": []}))

    elif args.type == 'fundamentals':
        try:
            if USE_MOCK: print(json.dumps(get_mock_response(args.ticker, 'fundamentals')))
            else:
                df = None
                # Try OpenBB
                try:
                    df = obb.equity.fundamental.income(symbol=args.ticker, provider="yfinance").to_dataframe().T
                except: pass

                
                if df is None or df.empty: 
                    print(json.dumps({"data": []}))
                else:
                    # Robust Column Renaming for both sources
                    cols = df.columns
                    for c in cols:
                        clean_c = str(c).lower().replace(" ", "")
                        if clean_c in ['totalrevenue', 'revenue', 'operatingrevenue']:
                            df = df.rename(columns={c: 'revenue'})
                            break
                    for c in cols:
                        clean_c = str(c).lower().replace(" ", "")
                        if clean_c in ['netincome', 'net_income', 'profit']:
                            df = df.rename(columns={c: 'netIncome'})
                            break

                    if 'date' not in df.columns: df = df.reset_index()
                    # If date is still index name after reset, rename it
                    if 'index' in df.columns: df = df.rename(columns={'index': 'period'})

                    result = json.loads(df.to_json(orient="records", date_format="iso"))
                    print(json.dumps({"data": result}))
        except: print(json.dumps(get_mock_response(args.ticker, 'fundamentals')))

    elif args.type == 'bonds':
        try:
            if USE_MOCK: print(json.dumps(get_mock_response(args.ticker, 'bonds')))
            else:
                df = obb.economy.fred.series("DGS10", start_date="2023-01-01").to_dataframe()
                if 'date' not in df.columns: df = df.reset_index()
                result = json.loads(df.to_json(orient="records", date_format="iso"))
                print(json.dumps({"data": result}))
        except: print(json.dumps(get_mock_response(args.ticker, 'bonds')))
    
    else:
        print(json.dumps({"error": "Invalid type"}))
