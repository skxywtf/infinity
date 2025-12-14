from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create a custom config
config = DEFAULT_CONFIG.copy()
config["deep_think_llm"] = "gpt-4o-mini"  # Use a cheaper model for testing
config["quick_think_llm"] = "gpt-4o-mini"
config["max_debate_rounds"] = 1

# Initialize the graph
print("Initializing TradingAgentsGraph...")
ta = TradingAgentsGraph(debug=True, config=config)

# Run analysis
ticker = "NVDA"
date = "2024-05-10"
print(f"Starting analysis for {ticker} on {date}...")

try:
    final_state, decision = ta.propagate(ticker, date)
    print("\nAnalysis Complete!")
    print("\nFinal Decision:")
    print(decision)
except Exception as e:
    print(f"\nError occurred: {e}")
