from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class AnalysisRequest(BaseModel):
    ticker: str
    date: str  # YYYY-MM-DD
    analysts: List[str] = ["market", "social", "news", "fundamentals"]
    research_depth: int = 1
    llm_provider: str = "openai"
    deep_thinker: str = "gpt-4o"
    shallow_thinker: str = "gpt-4o-mini"
    backend_url: Optional[str] = None

class AnalysisResponse(BaseModel):
    run_id: str
    ticker: str
    status: str

class OpenBBRequest(BaseModel):
    ticker: str
    type: str # price, news, profile
    range: Optional[str] = "3M"
