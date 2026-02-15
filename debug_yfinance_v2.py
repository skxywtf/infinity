import yfinance as yf
import pandas as pd
import json

ticker = "AAPL"
y = yf.Ticker(ticker)

print(f"--- FNIANCIALS ({ticker}) ---")
try:
    # Income/Financials are usually returned with Dates as COLUMNS and Metrics as ROWS (Index)
    inc = y.income_stmt
    print("Shape:", inc.shape)
    print("Index (Metrics):", inc.index.tolist())
    print("Columns (Dates):", inc.columns.tolist())
    
    # Simulate what we want (Dates as rows, Metrics as columns)
    df_transposed = inc.T
    print("\nTransposed Columns:", df_transposed.columns.tolist())
    
    # Check if 'Total Revenue' exists
    if 'Total Revenue' in df_transposed.columns:
        print("Found 'Total Revenue'")
    else:
        print("MISSING 'Total Revenue'. Available:", [c for c in df_transposed.columns if 'Revenue' in c])

except Exception as e:
    print("Financials Error:", e)

print(f"\n--- OPTIONS ({ticker}) ---")
try:
    exps = y.options
    if exps:
        print("Expirations:", exps[:3])
        opt = y.option_chain(exps[0])
        calls = opt.calls
        print("Calls Head:\n", calls[['contractSymbol', 'strike', 'lastPrice']].head())
    else:
        print("No options found")
except Exception as e:
    print("Options Error:", e)
