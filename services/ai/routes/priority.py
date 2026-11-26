import os
import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from schemas.common import PriorityResponse
from routes._openrouter import call_vision_model

logger = logging.getLogger(__name__)
router = APIRouter()


class PriorityRequest(BaseModel):
    issue_id: str
    category: str = "pothole"
    severity: int = 3
    report_count: int = 1
    hours_open: float = 0
    sla_hours: float = 72
    nearby_places: List[str] = []
    rain_alert: bool = False
    image_base64: Optional[str] = None


def load_prompt(req: PriorityRequest) -> str:
    prompt_path = os.path.join(
        os.path.dirname(__file__), "../../../prompts/priority.md"
    )
    if os.path.exists(prompt_path):
        with open(prompt_path) as f:
            template = f.read()
        return (
            template.replace("{{category}}", req.category)
            .replace("{{severity}}", str(req.severity))
            .replace("{{report_count}}", str(req.report_count))
            .replace("{{hours_open}}", str(req.hours_open))
            .replace("{{sla_hours}}", str(req.sla_hours))
            .replace("{{context_radius_m}}", "150")
            .replace(
                "{{nearby_places}}",
                ", ".join(req.nearby_places) if req.nearby_places else "none found",
            )
            .replace("{{rain_alert}}", str(req.rain_alert))
        )
    return f"Score the priority of this {req.category} issue. Severity {req.severity}/5, {req.report_count} reports. Return JSON."


@router.post("/priority", response_model=PriorityResponse)
async def priority(req: PriorityRequest):
    prompt = load_prompt(req)

    try:
        # Priority can work without an image
        parsed, ai_run = await call_vision_model(
            prompt=prompt,
            images=[],  # No image needed for priority
            task="priority",
        )
        result = PriorityResponse(**parsed)
        logger.info(f"Priority: {result.priority_0_100} ({result.band})")
        return result
    except Exception as e:
        logger.error(f"Priority scoring failed: {e}")
        # Fail safe: medium priority
        return PriorityResponse(
            priority_0_100=50,
            band="MEDIUM",
            rationale=f"Default priority — scoring failed: {str(e)}",
            factors=[],
        )
