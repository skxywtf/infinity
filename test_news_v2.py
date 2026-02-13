import yfinance as yf
import json

try:
    ticker = "AAPL"
    print(f"Fetching news for {ticker}...")
    news = yf.Ticker(ticker).news
    if news:
        first_item = news[0]
        print("Keys found:", list(first_item.keys()))
        print("Link field:", first_item.get('link'))
        print("Title:", first_item.get('title'))
    else:
        print("No news found.")
except Exception as e:
    print(f"Error: {e}")
