from openbb import obb
import pandas as pd
import json

ticker = "AAPL"

print(f"--- OPENBB RESEARCH ({ticker}) ---")

# 1. Analyst Ratings / Estimates
print("\n[Running] obb.equity.estimates.consensus")
try:
    # Try getting consensus price targets or ratings
    res = obb.equity.estimates.consensus(symbol=ticker, provider="yfinance")
    print("Consensus Head:\n", res.to_dataframe().head())
except Exception as e:
    print("Estimates Consensus Error:", e)

print("\n[Running] obb.equity.price.target")
try:
    res = obb.equity.price.target(symbol=ticker, provider="yfinance")
    print("Price Target Head:\n", res.to_dataframe().head())
except Exception as e:
    print("Price Target Error:", e)


# 2. Earnings
print("\n[Running] obb.equity.calendar.earnings")
try:
    # Upcoming earnings?
    res = obb.equity.calendar.earnings(start_date="2023-01-01", end_date="2025-12-31", provider="fmp") # fmp often requires key, yfinance might work?
    # Trying provider='yfinance' for earnings if available
    # Check providers first?
    # providers = obb.coverage.providers
    pass 
    # Attempt yfinance for earnings
    res = obb.equity.fundamental.earnings(symbol=ticker, provider="yfinance")
    print("Earnings Head:\n", res.to_dataframe().head())
except Exception as e:
    print("Earnings Error:", e)


# 3. Ownership / Holders
print("\n[Running] obb.equity.ownership.major_holders")
try:
    res = obb.equity.ownership.major_holders(symbol=ticker, provider="yfinance")
    print("Major Holders Head:\n", res.to_dataframe().head())
except Exception as e:
    print("Major Holders Error:", e)

print("\n[Running] obb.equity.ownership.institutional")
try:
    res = obb.equity.ownership.institutional(symbol=ticker, provider="yfinance")
    print("Institutional Holders Head:\n", res.to_dataframe().head())
except Exception as e:
    print("Institutional Holders Error:", e)
