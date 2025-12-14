# TradingAgents: Project Overview & Architecture

## 1. Introduction
**TradingAgents** is an advanced financial trading framework that simulates the workflow of a professional trading firm. Instead of relying on a single algorithm or AI model, it employs a **Multi-Agent System (MAS)** where specialized AI agents collaborate, debate, and review decisions to formulate robust trading strategies.

The core philosophy is to mimic human institutional trading: gathering data, analyzing it from multiple perspectives (bullish vs. bearish), managing risk, and making a final executive decision.

## 2. The "Team" (Agent Roles)
The framework is divided into specialized teams, each with distinct responsibilities:

### 📊 I. Analyst Team (The "Eyes & Ears")
These agents are responsible for gathering raw data and converting it into actionable insights.
*   **Market Analyst**: Fetches historical stock prices and calculates technical indicators (MACD, RSI, Bollinger Bands, Moving Averages) using `yfinance`.
*   **Fundamentals Analyst**: Analyzes the company's financial health by reading Balance Sheets, Income Statements, and Cash Flow statements via `Alpha Vantage`.
*   **News Analyst**: Scrapes and summarizes global news and specific company news to understand macro and micro events.
*   **Social Analyst**: Gauges market sentiment from social media and insider transaction data.

### 🧐 II. Research Team (The "Brain")
Once the data is gathered, this team interprets it.
*   **Bull Researcher**: Explicitly looks for reasons to **BUY**. They focus on growth potential, positive signals, and strong fundamentals.
*   **Bear Researcher**: Explicitly looks for reasons to **SELL** or **SHORT**. They focus on risks, overvaluation, and negative signals.
*   **Research Manager**: Moderates a debate between the Bull and Bear. This "adversarial" process ensures that confirmation bias is minimized. The manager synthesizes the debate into a balanced **Investment Plan**.

### 💼 III. Trading Team (The "Strategist")
*   **Trader Agent**: Takes the Research Manager's plan and turns it into a concrete execution strategy. They decide *entry points*, *exit points*, *stop-loss levels*, and *position sizing* based on the current market state.

### 🛡️ IV. Risk Management Team (The "Conscience")
Before any trade is executed, it must pass a risk assessment.
*   **Risk Analysts**: Three distinct personas evaluate the Trader's plan:
    *   **Aggressive Analyst**: Looks at the potential for high returns.
    *   **Conservative (Safe) Analyst**: Focuses purely on capital preservation and downside protection.
    *   **Neutral Analyst**: Provides a balanced view.
*   The team debates whether the proposed trade aligns with risk parameters.

### 🏦 V. Portfolio Manager (The "Decision Maker")
*   **Portfolio Manager**: The final authority. They review the entire history—analyst reports, research debates, trading plans, and risk assessments—to make the final **Buy**, **Sell**, or **Hold** decision and execute the order.

---

## 3. The Workflow (How it Works)
The system is built on **LangGraph**, which defines the flow of information between agents as a state machine.

1.  **Initialization**: You provide a Ticker (e.g., `NVDA`) and a Date.
2.  **Data Gathering**: The Analyst Team runs in parallel. They use Python tools to hit external APIs (YFinance, Alpha Vantage).
3.  **Analysis & Reporting**: Each analyst produces a markdown report summarizing their findings.
4.  **The Debate**: The Bull and Bear researchers read these reports and argue. The Research Manager summarizes the winner's points.
5.  **Strategy**: The Trader drafts a plan: "Buy at $100, Stop Loss at $95."
6.  **Risk Review**: The Risk Team critiques the plan. "Is a $5 stop loss too tight for this volatility?"
7.  **Final Decision**: The Portfolio Manager issues the final order.

## 4. Technical Stack
*   **Language**: Python 3.12+
*   **Orchestration**: [LangGraph](https://github.com/langchain-ai/langgraph) (for managing agent state and workflow).
*   **LLMs**: Compatible with OpenAI (GPT-4o), Anthropic (Claude), and Google (Gemini).
*   **Data Sources**:
    *   **YFinance**: Price data and technicals.
    *   **Alpha Vantage**: Fundamental data and news.

## 5. Configuration
The behavior of the system is highly customizable via `tradingagents/default_config.py` or the CLI.
*   **Research Depth**: Controls how many rounds of debate occur between agents.
*   **LLM Selection**: You can assign "Fast" models (like GPT-4o-mini) for simple tasks and "Deep" models (like GPT-4o or o1) for complex reasoning.

## 6. Directory Structure
*   `tradingagents/agents/`: Contains the prompt logic for each specific agent.
*   `tradingagents/graph/`: Defines the LangGraph workflow (`trading_graph.py`).
*   `tradingagents/tools/`: Python functions that agents call to get data.
*   `cli/`: The command-line interface code.
