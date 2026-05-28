from fastapi import FastAPI
from pydantic import BaseModel
from shared_lib.event_bus import publisher

app = FastAPI(title="AI Report Assistant", version="0.1.0")

class ReportGenerationRequest(BaseModel):
    report_id: str
    notes: str
    transcript_excerpt: str | None = None
    officer_id: str
    agency_id: str


class ReportGenerationResponse(BaseModel):
    draft_id: str
    report_id: str
    input_summary: str
    generated_narrative: str
    requires_human_approval: bool
    approval_status: str


@app.post("/v1/generate-report")
async def generate_report(payload: ReportGenerationRequest) -> ReportGenerationResponse:
    # Human review remains mandatory before finalization.
    response = ReportGenerationResponse(
        draft_id=f"draft-{payload.report_id}",
        report_id=payload.report_id,
        input_summary=payload.notes,
        generated_narrative="Generated draft narrative placeholder.",
        requires_human_approval=True,
        approval_status="pending_officer_review",
    )
    await publisher.publish(
        "ai.report.generated.v1",
        {
            "report_id": payload.report_id,
            "draft_id": response.draft_id,
            "officer_id": payload.officer_id,
            "agency_id": payload.agency_id,
        },
    )
    return response


@app.post("/v2/reports/drafts", response_model=ReportGenerationResponse)
async def generate_report_v2(payload: ReportGenerationRequest) -> ReportGenerationResponse:
    return await generate_report(payload)
