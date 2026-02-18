from openbb import obb
import pandas as pd
import json

ticker = "AAPL"
print(f"--- OPENBB FEATURE RESEARCH ({ticker}) ---")

# 1. Extended Technicals
print("\n[Research] Technicals (MACD, BBands)")
try:
    # MACD
    macd = obb.technical.macd(data=ticker, provider="yfinance").to_dataframe()
    print("MACD Success:", not macd.empty)
    print("MACD Cols:", macd.columns.tolist() if not macd.empty else "None")
except Exception as e:
    print("MACD Error:", e)

try:
    # Bollinger Bands
    bbands = obb.technical.bbands(data=ticker, provider="yfinance").to_dataframe()
    print("BBands Success:", not bbands.empty)
    print("BBands Cols:", bbands.columns.tolist() if not bbands.empty else "None")
except Exception as e:
    print("BBands Error:", e)


# 2. Key Metrics / Ratios (Fundamentals)
print("\n[Research] Fundamental Metrics")
try:
    # Valuation Ratios (P/E, P/S, etc) - often in 'metrics' or 'ratios'
    # Checking 'equity.fundamental.ratios'
    ratios = obb.equity.fundamental.ratios(symbol=ticker, provider="yfinance").to_dataframe()
    print("Ratios Success:", not ratios.empty)
    print("Ratios Head:\n", ratios.head() if not ratios.empty else "None")
except Exception as e:
    print("Ratios Error:", e)

try:
    # Key Metrics
    metrics = obb.equity.fundamental.metrics(symbol=ticker, provider="yfinance").to_dataframe()
    print("Metrics Success:", not metrics.empty)
    print("Metrics Head:\n", metrics.head() if not metrics.empty else "None")
except Exception as e:
    print("Metrics Error:", e)


# 3. Market / Discovery
print("\n[Research] Market Discovery")
try:
    # Active / Gainers / Losers
    active = obb.equity.discovery.active(provider="yfinance").to_dataframe()
    print("Active Stocks Success:", not active.empty)
    print(active.head() if not active.empty else "None")
except Exception as e:
    print("Active Stocks Error:", e)

try:
    # Aggressive Small Caps (often interesting) - might not be yfinance
    aggressive = obb.equity.discovery.aggressive_small_caps(provider="yfinance").to_dataframe()
    print("Aggressive Small Caps Success:", not aggressive.empty)
except Exception as e:
    print("Aggressive Small Caps Error (Expected if not supported):", e)


# 4. ETF / Sectors
print("\n[Research] ETF / Sectors")
try:
    # Sector performance?
    # obb.equity.market.sectors ?
    pass 
    # Try getting info on an ETF like SPY to see holdings
    holdings = obb.etf.holdings(symbol="SPY", provider="yfinance").to_dataframe()
    print("ETF Holdings Success:", not holdings.empty)
    print("Holdings Head:\n", holdings.head() if not holdings.empty else "None")
except Exception as e:
    print("ETF Holdings Error:", e)

print("\n--- END RESEARCH ---")
