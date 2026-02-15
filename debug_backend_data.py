import yfinance as yf
from openbb import obb
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TICKER = "AAPL"

def test_profile():
    print(f"\n--- Testing Profile for {TICKER} ---")
    try:
        # Check what yfinance 'info' or openbb 'overview' returns
        df = obb.equity.fundamental.overview(symbol=TICKER, provider="yfinance").to_dataframe()
        print("Columns:", df.columns.tolist())
        print("First Row:", df.iloc[0].to_dict())
    except Exception as e:
        print(f"Profile Error: {e}")

def test_financials():
    print(f"\n--- Testing Financials for {TICKER} ---")
    try:
        # Check Income vs Balance
        print("Fetching INCOME Statement...")
        df_inc = obb.equity.fundamental.income(symbol=TICKER, provider="yfinance").to_dataframe()
        print("Income Columns:", df_inc.columns.tolist())
        # Check if 'revenue' and 'net_income' exist
        
        print("\nFetching BALANCE Sheet...")
        df_bal = obb.equity.fundamental.balance(symbol=TICKER, provider="yfinance").to_dataframe()
        print("Balance Columns:", df_bal.columns.tolist())
    except Exception as e:
        print(f"Financials Error: {e}")

def test_dates():
    print(f"\n--- Testing Price Dates ---")
    # Verify if openbb accepts start_date correctly
    try:
        df = obb.equity.price.historical(TICKER, start_date="2024-01-01", provider="yfinance").to_dataframe()
        print(f"Rows fetched: {len(df)}")
        print(f"First Date: {df.index[0] if 'date' not in df.columns else df['date'].iloc[0]}")
    except Exception as e:
        print(f"Price Error: {e}")

if __name__ == "__main__":
    test_profile()
    test_financials()
    test_dates()
