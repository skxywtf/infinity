import yfinance as yf
import json

try:
    ticker = "AAPL"
    print(f"Fetching news for {ticker}...")
    news = yf.Ticker(ticker).news
    if news:
        item = news[0]
        # Check deep path
        deep_url = item.get('content', {}).get('clickThroughUrl', {}).get('url')
        print(f"Deep URL: {deep_url}")
        
        # Check if deep_url is None
        if deep_url:
            print("CONFIRMED: Deep URL found.")
        else:
            print("FAILED: Deep URL not found.")
            
    else:
        print("No news found.")
except Exception as e:
    print(f"Error: {e}")
