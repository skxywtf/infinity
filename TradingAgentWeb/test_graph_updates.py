import asyncio
import os
import sys
from dotenv import load_dotenv

# Load env vars
load_dotenv(dotenv_path="d:\\Projects\\SKXYWTF\\.env")

# Add project root to path
sys.path.append("d:\\Projects\\SKXYWTF")

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

async def main():
    print("Initializing Graph...")
    config = DEFAULT_CONFIG.copy()
    config["max_debate_rounds"] = 1
    config["max_risk_discuss_rounds"] = 1
    
    # Use dummy analysts to speed up if possible, or just normal ones
    analysts = ["market", "fundamentals"] 
    
    ta = TradingAgentsGraph(selected_analysts=analysts, config=config, debug=True)
    
    ticker = "NVDA"
    date = "2024-12-01"
    
    print(f"Creating initial state for {ticker}...")
    init_state = ta.propagator.create_initial_state(ticker, date)
    args = ta.propagator.get_graph_args()
    
    print("Starting Stream with mode='updates'...")
    args["stream_mode"] = "updates"
    
    try:
        for chunk in ta.graph.stream(init_state, **args):
            print(f"--- CHUNK RECEIVED ---")
            print(f"Keys: {chunk.keys()}")
            for k, v in chunk.items():
                print(f"Node: {k}")
                # print(f"Value keys: {v.keys() if isinstance(v, dict) else 'Not dict'}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

    print("Stream finished.")

if __name__ == "__main__":
    asyncio.run(main())
