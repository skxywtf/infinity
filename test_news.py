import yfinance as yf
import json

try:
    ticker = "AAPL"
    print(f"Fetching news for {ticker}...")
    news = yf.Ticker(ticker).news
    print(json.dumps(news, indent=2))
except Exception as e:
    print(f"Error: {e}")
