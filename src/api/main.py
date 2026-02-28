from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import ReportRequest, ReportResponse

app = FastAPI(title="Augmented Radiologist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/report", response_model=ReportResponse)
async def create_report(req: ReportRequest):
    from ..pipeline.orchestrator import generate_report

    try:
        result = await generate_report(req.patient_id, req.language)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
