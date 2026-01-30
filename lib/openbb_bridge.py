import sys
import json
import argparse
from datetime import datetime, timedelta

# Import OpenBB - this requires the script to be run in the OpenBB venv
try:
    from openbb import obb
except ImportError:
    print(json.dumps({"error": "OpenBB module not found. Ensure this script is run within the OpenBB virtual environment."}))
    sys.exit(1)

def get_historical_price(ticker):
    try:
        # Fetch last 6 months of data
        start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        
        # OpenBB v4 syntax
        df = obb.equity.price.historical(ticker, start_date=start_date, provider="yfinance").to_dataframe()
        
        # Reset index to make Date a column if it's the index
        if 'date' not in df.columns and 'Date' not in df.columns:
            df = df.reset_index()
            
        # Convert to list of dicts for JSON serialization
        # Handle timestamp conversion to string
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        return {"error": str(e)}

def get_news(ticker):
    try:
        # Fetch news
        df = obb.news.world(limit=5, provider="benzinga").to_dataframe() # Trying world news or specific ticker news if available
        # Note: obb.news.company(symbol=ticker) might be better if available/installed
        
        try:
             df = obb.news.company(symbol=ticker, provider="benzinga").to_dataframe()
        except:
             pass # Fallback to whatever worked or try generic

        if 'date' not in df.columns and 'Date' not in df.columns:
             df = df.reset_index()

        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        return {"error": str(e)}

def get_company_profile(ticker):
    try:
        # Fetch profile
        df = obb.equity.fundamental.overview(symbol=ticker, provider="yfinance").to_dataframe()
        result = json.loads(df.to_json(orient="records", date_format="iso"))
        return {"data": result}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='OpenBB Data Bridge')
    parser.add_argument('--ticker', type=str, required=True, help='Stock Ticker Symbol')
    parser.add_argument('--type', type=str, required=True, choices=['price', 'news', 'profile'], help='Type of data to fetch')
    
    args = parser.parse_args()
    
    if args.type == 'price':
        print(json.dumps(get_historical_price(args.ticker)))
    elif args.type == 'news':
        print(json.dumps(get_news(args.ticker)))
    elif args.type == 'profile':
        print(json.dumps(get_company_profile(args.ticker)))
