
import os
import finnhub
import pandas as pd
from datetime import datetime
import time
from typing import Annotated, Dict, Any

def _get_client():
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        raise ValueError("FINNHUB_API_KEY not found in environment variables")
    return finnhub.Client(api_key=api_key)

def get_stock_data_finnhub(
    ticker: Annotated[str, "Ticker symbol"],
    start_date: Annotated[str, "Start date (YYYY-MM-DD)"],
    end_date: Annotated[str, "End date (YYYY-MM-DD)"]
) -> pd.DataFrame:
    """Get stock candles from Finnhub and return as DataFrame matching yfinance format."""
    client = _get_client()
    
    # Convert dates to unix timestamp
    start_ts = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp())
    end_ts = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp())
    
    # Resolution 'D' for daily
    res = client.stock_candles(ticker, 'D', start_ts, end_ts)
    
    if res['s'] != 'ok':
        print(f"Finnhub error for {ticker}: {res.get('s')}")
        return pd.DataFrame()
        
    # Finnhub returns lists: c (close), h (high), l (low), o (open), s (status), t (time), v (volume)
    df = pd.DataFrame({
        'Date': pd.to_datetime(res['t'], unit='s'),
        'Open': res['o'],
        'High': res['h'],
        'Low': res['l'],
        'Close': res['c'],
        'Volume': res['v']
    })
    
    df.set_index('Date', inplace=True)
    return df

def get_news_finnhub(
    ticker: Annotated[str, "Ticker symbol"],
    start_date: Annotated[str, "Start date (YYYY-MM-DD)"],
    end_date: Annotated[str, "End date (YYYY-MM-DD)"]
) -> str:
    """Get company news from Finnhub."""
    client = _get_client()
    
    news_list = client.company_news(ticker, _from=start_date, to=end_date)
    
    if not news_list:
        return ""
        
    formatted_news = []
    # Finnhub news format: [{'category': 'company', 'datetime': 123, 'headline': '...', 'id': 123, 'image': '...', 'related': '...', 'source': '...', 'summary': '...', 'url': '...'}]
    
    # Sort by date descending
    news_list.sort(key=lambda x: x['datetime'], reverse=True)
    
    for item in news_list[:20]: # Limit to 20 items
        dt = datetime.fromtimestamp(item['datetime']).strftime('%Y-%m-%d')
        formatted_news.append(
            f"### {item['headline']} ({dt})\n"
            f"Source: {item['source']}\n"
            f"Summary: {item['summary']}\n"
            f"[Read more]({item['url']})\n"
        )
        
    return "\n".join(formatted_news)

def get_fundamentals_finnhub(ticker: Annotated[str, "Ticker symbol"], *args, **kwargs) -> Dict[str, Any]:
    """Get basic financials from Finnhub."""
    client = _get_client()
    
    # metric='all' returns a huge blob of data
    try:
        basic = client.company_basic_financials(ticker, metric='all')
    except Exception as e:
        print(f"Finnhub Fundamentals Error: {e}")
        return {}
    
    if not basic or 'metric' not in basic:
        return {}
        
    metrics = basic['metric']
    
    # Select key metrics to match typical output
    key_metrics = {
        "Market Capitalization": metrics.get("marketCapitalization"),
        "PE Ratio (TTM)": metrics.get("peTTM"),
        "EPS (TTM)": metrics.get("epsTTM"),
        "Dividend Yield": metrics.get("dividendYieldIndicatedAnnual"),
        "52 Week High": metrics.get("52WeekHigh"),
        "52 Week Low": metrics.get("52WeekLow"),
        "Beta": metrics.get("beta"),
        "PB Ratio": metrics.get("pbAnnual"),
        "ROE": metrics.get("roeTTM"),
        "Revenue Growth (TTM)": metrics.get("revenueGrowthTTMYoy"),
    }
    
    return key_metrics

def get_insider_sentiment_finnhub(ticker: Annotated[str, "Ticker symbol"]) -> str:
    """Get insider sentiment from Finnhub."""
    client = _get_client()
    
    # Get range for last 3 months
    end_date = datetime.now()
    start_date = datetime.now().replace(month=datetime.now().month - 3) # Approx
    
    try:
        sentiment = client.stock_insider_sentiment(ticker, _from=start_date.strftime('%Y-%m-%d'), to=end_date.strftime('%Y-%m-%d'))
        
        if not sentiment or 'data' not in sentiment:
            return "No insider sentiment data available."
            
        data = sentiment['data']
        # Aggregate logic could go here, for now just dump the raw entries nicely
        
        report = "## Insider Sentiment (Last 3 months)\n"
        for item in data:
            report += f"- {item['year']}-{item['month']}: Change: {item['change']}, MSPR: {item['mspr']}\n"
            
        return report
    except Exception as e:
from .stockstats_utils import StockstatsUtils

def get_indicators_finnhub(
    ticker: Annotated[str, "Ticker symbol"],
    indicator_name: Annotated[str, "Indicator name (e.g. rsi, macd)"],
    start_date: Annotated[str, "Start date (YYYY-MM-DD)"],
    end_date: Annotated[str, "End date (YYYY-MM-DD)"]
) -> str:
    """Calculate technical indicators using Finnhub data."""
    # Fetch price data first
    df = get_stock_data_finnhub(ticker, start_date, end_date)
    
    if df.empty:
        return f"Error: No data found for {ticker} on Finnhub to calculate {indicator_name}"
        
    # Use generic calculation util
    try:
        # StockstatsUtils expects a DataFrame
        result = StockstatsUtils.get_indicator_from_df(df, indicator_name)
        return result
    except Exception as e:
        return f"Error calculating {indicator_name}: {str(e)}"
