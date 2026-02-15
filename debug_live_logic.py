import requests
import json

# Cloud Run URL (from previous deployment logs or I can infer it, but user didn't provide.
# I will use the one I saw in route.ts if available, or try to find it. 
# WAIT, I don't have the Cloud Run URL URL handy in the context.
# I will check `app/api/openbb/route.ts` again to see if I can find the env var default or I'll just ask the user/check logs.
# Actually, I can just use the local python bridge to "simulate" the exact logic I pushed, 
# assuming the local environment is similar enough (python + yfinance).

# But user says "it's deployed now but its still now working".
# I should try to repro locally first with the *exact* code I pushed.

import sys
sys.path.append('d:\\Projects\\SKXYWTF\\Infinity (Working)')
from lib.openbb_bridge import *

# Mock args
class Args:
    ticker = "AAPL"
    type = "fundamentals"

print("--- FUNDAMENTALS ---")
# Manually run the logic chunk from the bridge to debug
import yfinance as yf
from openbb import obb
try:
    df = obb.equity.fundamental.income(symbol="AAPL", provider="yfinance").to_dataframe().T
    print("Columns (Transposed):", df.columns.tolist())
    
    # Run rename logic
    found_rev = False
    for c in df.columns:
        clean_c = str(c).lower().replace(" ", "")
        if clean_c in ['totalrevenue', 'revenue', 'operatingrevenue']:
            print(f"MATCH: {c} -> revenue")
            found_rev = True
            
    if not found_rev: print("NO REVENUE COLUMN MATCHED")

    # Check data content
    print("Head:\n", df.head())
    
except Exception as e:
    print("Error:", e)

print("\n--- OPTIONS ---")
Args.type = "options"
try:
   # Test the direct fallback
   y = yf.Ticker("AAPL")
   exps = y.options
   print("Expirations:", exps[:3] if exps else "None")
   if exps:
       opt = y.option_chain(exps[0])
       print("Calls Sample:", opt.calls[['contractSymbol', 'strike', 'lastPrice']].head())
except Exception as e:
    print("Options Error:", e)
