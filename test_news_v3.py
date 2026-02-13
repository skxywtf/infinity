import yfinance as yf
import json

try:
    ticker = "AAPL"
    print(f"Fetching news for {ticker}...")
    news = yf.Ticker(ticker).news
    if news:
        print(json.dumps(news[0], indent=2))
    else:
        print("No news found.")
except Exception as e:
    print(f"Error: {e}")
