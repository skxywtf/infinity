import yfinance as yf
import pandas as pd
import json

ticker = "AAPL" 
y = yf.Ticker(ticker)

print(f"--- ANALYST RATINGS ({ticker}) ---")
try:
    # recommendations and recommendations_summary
    recs = y.recommendations
    if recs is not None and not recs.empty:
        print("Recommendations Head:\n", recs.head())
        print("Columns:", recs.columns.tolist())
    else:
        print("No recommendations found.")

    summary = y.recommendations_summary
    if summary is not None and not summary.empty:
        print("\nSummary Head:\n", summary.head())
    else:
        print("No recommendations summary found.")
except Exception as e:
    print("Analyst Ratings Error:", e)

print(f"\n--- EARNINGS ({ticker}) ---")
try:
    # calendar and earnings_dates
    cal = y.calendar
    if cal is not None and not cal.empty:
        print("Calendar:\n", cal)
    else:
        print("No calendar found.")
        
    dates = y.earnings_dates
    if dates is not None and not dates.empty:
        print("\nEarnings Dates Head:\n", dates.head())
    else:
        print("No earnings dates found.")
        
    # earnings_history
    hist = y.earnings_history
    if hist is not None and not hist.empty:
         print("\nEarnings History Head:\n", hist.head())
except Exception as e:
    print("Earnings Error:", e)

print(f"\n--- HOLDERS ({ticker}) ---")
try:
    inst = y.institutional_holders
    if inst is not None and not inst.empty:
        print("Institutional Holders Head:\n", inst.head())
        print("Columns:", inst.columns.tolist())
    else:
        print("No institutional holders found.")
        
    major = y.major_holders
    if major is not None and not major.empty:
        print("\nMajor Holders:\n", major)
except Exception as e:
    print("Holders Error:", e)
