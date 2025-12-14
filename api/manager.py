import asyncio
import json
import uuid
import datetime
from typing import Dict, Any, AsyncGenerator

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_core.messages.tool import ToolMessage

# Helper to serialize complex objects
def default_serializer(obj):
    if hasattr(obj, 'dict'):
        return obj.dict()
    if hasattr(obj, '__dict__'):
        return obj.__dict__
    return str(obj)

class AnalysisManager:
    def __init__(self):
        self.active_runs: Dict[str, Any] = {}
        
        # Phase Headers: Triggered when entering a new phase
        # Updated keys to match actual Graph Node Names from setup.py
        self.PHASE_MAPPING = {
            "Market Analyst": "Phase 1: 🕵️ Analyst Team Working",
            "Social Analyst": "Phase 1: 🕵️ Analyst Team Working",
            "News Analyst": "Phase 1: 🕵️ Analyst Team Working",
            "Fundamentals Analyst": "Phase 1: 🕵️ Analyst Team Working",
            
            "Bull Researcher": "Phase 2: 🧠 Research Team Debating",
            "Bear Researcher": "Phase 2: 🧠 Research Team Debating",
            "Research Manager": "Phase 2: 🧠 Research Team Debating",
            
            "Trader": "Phase 3: ♟️ Trading Team Strategy",
            
            "Risky Analyst": "Phase 4: 🛡️ Risk Management Team",
            "Neutral Analyst": "Phase 4: 🛡️ Risk Management Team",
            "Safe Analyst": "Phase 4: 🛡️ Risk Management Team",
            
            "Risk Judge": "Phase 5: 🏦 Portfolio Manager Decision",
        }
        
        # Sub-Task Logs: Triggered when specific nodes finish
        self.NODE_COMPLETION_MESSAGES = {
            "Market Analyst": "   ✓ Market Analysis Done",
            "Social Analyst": "   ✓ Social Sentiment Processed",
            "News Analyst": "   ✓ News Signals Processed",
            "Fundamentals Analyst": "   ✓ Fundamentals Analyzed",
            
            "Bull Researcher": "   ✓ Bull Case Presented",
            "Bear Researcher": "   ✓ Bear Case Presented",
            "Research Manager": "   ✓ Investment Plan Synthesized",
            
            "Trader": "   ✓ Trade Strategy Created",
            
            "Risky Analyst": "   ✓ Risk Analysis: Bearish View",
            "Neutral Analyst": "   ✓ Risk Analysis: Neutral View",
            "Safe Analyst": "   ✓ Risk Analysis: Bullish View",
            
            "Risk Judge": "   ✓ Final Trade Decision Executed",
        }

    def start_analysis(self, request_data: Dict[str, Any]) -> str:
        run_id = str(uuid.uuid4())
        loop = asyncio.get_running_loop()
        self.active_runs[run_id] = {
            "status": "pending",
            "request": request_data,
            "events": asyncio.Queue(),
            "result": None,
            "loop": loop,
            "current_phase": None
        }
        loop.create_task(self._run_analysis_task(run_id, request_data))
        return run_id

    async def _run_analysis_task(self, run_id: str, request_data: Dict[str, Any]):
        try:
            self.active_runs[run_id]["status"] = "running"
            await self._emit_event(run_id, "status", {"status": "running"})
            await self._emit_event(run_id, "log", "🚀 System Initialized")

            config = DEFAULT_CONFIG.copy()
            config["max_debate_rounds"] = request_data.get("research_depth", 1)
            config["max_risk_discuss_rounds"] = request_data.get("research_depth", 1)
            config["quick_think_llm"] = request_data.get("shallow_thinker", "gpt-4o-mini")
            config["deep_think_llm"] = request_data.get("deep_thinker", "gpt-4o")
            config["llm_provider"] = request_data.get("llm_provider", "openai")
            
            ticker = request_data["ticker"]
            analysis_date = request_data["date"]
            analysts = request_data.get("analysts", ["market", "social", "news", "fundamentals"])
            
            final_state = await asyncio.to_thread(
                self._execute_graph, 
                run_id, 
                analysts, 
                config, 
                ticker, 
                analysis_date
            )

            self.active_runs[run_id]["result"] = final_state
            self.active_runs[run_id]["status"] = "completed"
            await self._emit_event(run_id, "status", {"status": "completed"})
            await self._emit_event(run_id, "log", "✅ Analysis Sequence Finished")

            if final_state:
                reports = {
                    "market_report": final_state.get("market_report"),
                    "sentiment_report": final_state.get("sentiment_report"),
                    "news_report": final_state.get("news_report"),
                    "fundamentals_report": final_state.get("fundamentals_report"),
                    "investment_plan": final_state.get("investment_plan"),
                    "risk_analysis": final_state.get("risk_analysis"),
                    "trader_investment_plan": final_state.get("trader_investment_plan"),
                    "final_trade_decision": final_state.get("final_trade_decision")
                }
                
                # Manual extraction for Risk Analysis if missing (since it might be nested)
                if not reports["risk_analysis"] and "risk_debate_state" in final_state:
                     if "judge_decision" in final_state["risk_debate_state"]:
                         reports["risk_analysis"] = final_state["risk_debate_state"]["judge_decision"]

                for key, content in reports.items():
                    if content:
                        await self._emit_event(run_id, "report", {"key": key, "content": content})

                await self._emit_event(run_id, "result", self._serialize_state(final_state))

        except Exception as e:
            self.active_runs[run_id]["status"] = "error"
            await self._emit_event(run_id, "error", str(e))
            import traceback
            traceback.print_exc()

    def _execute_graph(self, run_id, analysts, config, ticker, analysis_date):
        try:
            ta = TradingAgentsGraph(selected_analysts=analysts, config=config, debug=True)
            ta.ticker = ticker
            init_agent_state = ta.propagator.create_initial_state(ticker, analysis_date)
            args = ta.propagator.get_graph_args()

            # Maintain a state accumulator to return the final result
            final_state = init_agent_state.copy()
            
            # Pre-announce Phase 1 to avoid silence during initial analysis
            self._push_event_sync(run_id, "log", "\nPhase 1: 🕵️ Analyst Team Working")
            self.active_runs[run_id]["current_phase"] = "Phase 1: 🕵️ Analyst Team Working"

            # Use stream_mode="updates" to get the specific node that just finished
            args["stream_mode"] = "updates"
            
            for chunk in ta.graph.stream(init_agent_state, **args):
                if isinstance(chunk, dict):
                    # In 'updates' mode, chunk keys are Node Names
                    for node_name, state_update in chunk.items():
                        
                        # 0. Update our running state
                        if isinstance(state_update, dict):
                            final_state.update(state_update)

                        # 1. Handle Phase Headers
                        phase_header = self.PHASE_MAPPING.get(node_name)
                        if phase_header:
                             current_phase = self.active_runs[run_id].get("current_phase")
                             if phase_header != current_phase:
                                 self.active_runs[run_id]["current_phase"] = phase_header
                                 self._push_event_sync(run_id, "log", f"\n{phase_header}")

                        # 2. Handle Sub-points
                        sub_msg = self.NODE_COMPLETION_MESSAGES.get(node_name)
                        if sub_msg:
                            self._push_event_sync(run_id, "log", sub_msg)
                            
                        # 3. Report Streaming
                        if isinstance(state_update, dict):
                            report_keys = [
                                "market_report", "sentiment_report", "news_report", 
                                "fundamentals_report", "investment_plan", "trader_investment_plan",
                                "final_trade_decision"
                            ]
                            for key in report_keys:
                                 if key in state_update and state_update[key] and len(str(state_update[key])) > 20:
                                     self._push_event_sync(run_id, "report", {"key": key, "content": state_update[key]})
                            
                            # Special handling for Risk Analysis (nested in risk_debate_state)
                            if "risk_debate_state" in state_update:
                                risk_data = state_update["risk_debate_state"]
                                if isinstance(risk_data, dict) and "judge_decision" in risk_data:
                                    content = risk_data["judge_decision"]
                                    if content and len(str(content)) > 20:
                                        self._push_event_sync(run_id, "report", {"key": "risk_analysis", "content": content})

            return final_state
        except Exception as e:
            self._push_event_sync(run_id, "error", str(e))
            raise e

    def _push_event_sync(self, run_id, type, content):
        if run_id in self.active_runs:
            run_data = self.active_runs[run_id]
            loop = run_data["loop"]
            queue = run_data["events"]
            loop.call_soon_threadsafe(queue.put_nowait, {"type": type, "content": content})

    async def _emit_event(self, run_id: str, type: str, content: Any):
        if run_id in self.active_runs:
            await self.active_runs[run_id]["events"].put({"type": type, "content": content})

    async def stream_events(self, run_id: str) -> AsyncGenerator[str, None]:
        if run_id not in self.active_runs:
            return
        
        queue = self.active_runs[run_id]["events"]
        
        while True:
            event = await queue.get()
            yield json.dumps(event, default=default_serializer)
            if event["type"] in ["result", "error"]:
                 await asyncio.sleep(0.1)
                 break

    def _serialize_state(self, state):
        return str(state)

    def _serialize_chunk(self, chunk):
        return str(chunk)

    async def stream_analysis_generator(self, request_data: Dict[str, Any]):
        run_id = str(uuid.uuid4())
        queue = asyncio.Queue()
        
        loop = asyncio.get_running_loop()
        self.active_runs[run_id] = {
             "status": "pending",
             "request": request_data,
             "events": queue,
             "result": None,
             "loop": loop,
             "current_phase": None
        }
        
        # Start the background task which pushes to the queue
        task = asyncio.create_task(self._run_analysis_task(run_id, request_data))
        
        try:
            while True:
                # Wait for next event
                # We use a timeout to avoid hanging forever if something goes wrong silent
                # But _run_analysis_task should always emit result or error.
                event = await queue.get()
                yield json.dumps(event, default=default_serializer) + "\n"
                
                if event["type"] in ["result", "error"]:
                    break
        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"
        finally:
            if run_id in self.active_runs:
                del self.active_runs[run_id]

manager = AnalysisManager()
