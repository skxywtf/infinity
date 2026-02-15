import yfinance as yf
import json
import pandas as pd

ticker = "AAPL"
y = yf.Ticker(ticker)

print("--- PROFILE (info) ---")
info = y.info
keys_to_check = ['marketCap', 'sector', 'industry', 'exchange', 'currency', 'shortName']
filtered_info = {k: info.get(k) for k in keys_to_check}
print(json.dumps(filtered_info, indent=2))

print("\n--- FINANCIALS (income_stmt) ---")
try:
    inc = y.income_stmt
    # yfinance returns a DataFrame with dates as columns. We want the most recent.
    # Rows are metrics (e.g., "Total Revenue", "Net Income")
    print("Available Metrics:", inc.index.tolist())
    
    # Check for Revenue
    rev_row = inc.loc['Total Revenue'] if 'Total Revenue' in inc.index else None
    print(f"Revenue (Head): {rev_row.head() if rev_row is not None else 'Not Found'}")
    
    # Check for Net Income
    ni_row = inc.loc['Net Income'] if 'Net Income' in inc.index else None
    print(f"Net Income (Head): {ni_row.head() if ni_row is not None else 'Not Found'}")

except Exception as e:
    print(f"Financials Error: {e}")
