import strawberry
from strawberry.fastapi import GraphQLRouter
import httpx
from app.settings import settings


@strawberry.type
class Report:
    report_id: str
    incident_type: str
    narrative: str
    agency_id: str
    status: str
    created_by: str
    officer_review_required: bool


@strawberry.type
class AIDraft:
    draft_id: str
    report_id: str
    input_summary: str
    generated_narrative: str
    requires_human_approval: bool
    approval_status: str


@strawberry.type
class Query:
    @strawberry.field
    def ping(self) -> str:
        return "pong"

    @strawberry.field
    async def report(self, report_id: str) -> Report | None:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{settings.rms_service_url}/v1/reports/{report_id}")
            if resp.status_code >= 400:
                return None
            return Report(**resp.json())


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def generate_report_draft(self, report_id: str, notes: str, officer_id: str, agency_id: str) -> AIDraft:
        payload = {"report_id": report_id, "notes": notes, "officer_id": officer_id, "agency_id": agency_id}
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(f"{settings.ai_report_service_url}/v2/reports/drafts", json=payload)
        resp.raise_for_status()
        return AIDraft(**resp.json())


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)
