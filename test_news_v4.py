import yfinance as yf
import json

try:
    ticker = "AAPL"
    print(f"Fetching news for {ticker}...")
    news = yf.Ticker(ticker).news
    if news:
        item = news[0]
        print("--- Item Analysis ---")
        print(f"Top-level 'link': {item.get('link')}")
        print(f"Top-level 'url': {item.get('url')}")
        
        content = item.get('content', {})
        click_through = content.get('clickThroughUrl', {}) if content else {}
        nested_url = click_through.get('url') if click_through else None
        
        print(f"Nested content.clickThroughUrl.url: {nested_url}")
        
        # Also check if it's inside 'clickThroughUrl' directly if content is missing
        print(f"Top-level 'clickThroughUrl': {item.get('clickThroughUrl')}")

    else:
        print("No news found.")
except Exception as e:
    print(f"Error: {e}")
