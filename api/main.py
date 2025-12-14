from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from api.models import AnalysisRequest, AnalysisResponse
from api.manager import manager

app = FastAPI(title="TradingAgents API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all. Restrict in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    run_id = manager.start_analysis(request.dict())
    return AnalysisResponse(run_id=run_id, ticker=request.ticker, status="pending")

@app.post("/api/analyze-stream")
async def analyze_stream(request: AnalysisRequest):
    return StreamingResponse(
        manager.stream_analysis_generator(request.dict()),
        media_type="application/x-ndjson"
    )

@app.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await websocket.accept()
    try:
        async for message in manager.stream_events(run_id):
            await websocket.send_text(message)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/health") # Vercel commonly hits /api/something
def api_health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
