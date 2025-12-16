# Vercel Deployment & functionality Trade-offs

You are hitting the **250MB Serverless Function Limit** on Vercel. This is a hard limit for file size (unzipped) and includes all Python libraries. Data Science libraries are notoriously heavy (Pandas ~100MB, ChromaDB ~100MB+, LangChain ~50MB).

To successfully deploy on Vercel, we must reduce the footprint. Below is the breakdown of what can be removed and exactly what functionality is sacrificed.

### 1. ChromaDB (Vector Database)
*   **Size**: ~150MB+ (Binary wheels, Tokenizers, ONNX Runtime).
*   **Functionality**: Provides "Long-term Memory". It allows the agent to store past analysis and recall "This market condition is similar to what I saw 3 months ago."
*   **Sacrifice**: The agent becomes **stateless**. It will analyze the current market perfectly with full intelligence, but it will have "amnesia" about past analysis sessions. It cannot "learn" from its own past history stored on the server.
*   **Recommendation**: **REMOVE**. This is the single biggest blocker. The core value (analyzing today's market) remains 100% intact.

### 2. Backtrader (Backtesting Engine)
*   **Size**: Moderate (~15MB), but dependencies adds up.
*   **Functionality**: Used to run historical simulations of strategies.
*   **Sacrifice**: You lose the ability to run "backtests" in the web interface. Since the web app is primarily a "Dashboard" for current analysis, this is likely unused code in the live environment.
*   **Recommendation**: **REMOVE**.

### 3. Tushare / Akshare / EODHD (Alternative Data Vendors)
*   **Size**: Moderate to Large (due to dependencies).
*   **Functionality**: specific data sources for Chinese markets or specialized feeds.
*   **Sacrifice**: The agent will rely solely on **Yahoo Finance (yfinance)** and **AlphaVantage**. Unless you specifically trade Chinese A-shares, this functionality is redundant.
*   **Recommendation**: **REMOVE**.

### 4. Pandas (Data Analysis)
*   **Size**: ~100MB (with NumPy).
*   **Functionality**: Critical. Used by `yfinance` to parse stock data and by `stockstats` to calculate indicators (RSI, MACD).
*   **Sacrifice**: Removing this would break the entire data fetching layer. We would have to rewrite the entire application to use raw mathematics and raw JSON parsing.
*   **Recommendation**: **KEEP** (Critical Dependency). We must remove *other* things to make room for this.

---

## Action Plan to Fix Deployment

If you agree to the above (sacrificing Memory to save the Deployment), here is the fix:

1.  **Delete `uv.lock`**: The deployment log shows Vercel is installing from `uv.lock`, which still contains the massive libraries we tried to remove. We must delete this file to force Vercel to respect the slimmed-down requirements.
2.  **Commit the "Slim" Requirements**:
    *   Keep: `pandas`, `yfinance`, `fastapi`, `langchain-openai`, `langgraph`.
    *   Remove: `chromadb`, `backtrader`.
3.  **Code Adjustment**: Ensure the code doesn't crash if ChromaDB is missing (already done in `memory.py`).

**Result**: The app will deploy successfully. The "Trading Agent" page will work, analyze stocks, and show reports. It just won't "remember" previous sessions.
