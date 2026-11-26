import os
import json
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from schemas.common import RouteResponse
from routes._openrouter import call_vision_model

logger = logging.getLogger(__name__)
router = APIRouter()


class RouteRequest(BaseModel):
    category: str
    lat: float
    lon: float
    locality: Optional[str] = None


def load_authorities() -> list:
    auth_path = os.path.join(
        os.path.dirname(__file__), "../../../data/authorities.json"
    )
    if os.path.exists(auth_path):
        with open(auth_path) as f:
            return json.load(f)
    return []


def load_prompt(req: RouteRequest, authorities: list) -> str:
    prompt_path = os.path.join(os.path.dirname(__file__), "../../../prompts/route.md")
    locality = req.locality or f"near ({req.lat:.4f}, {req.lon:.4f})"
    if os.path.exists(prompt_path):
        with open(prompt_path) as f:
            template = f.read()
        return (
            template.replace("{{category}}", req.category)
            .replace("{{locality}}", locality)
            .replace("{{lat}}", str(req.lat))
            .replace("{{lon}}", str(req.lon))
            .replace("{{authorities_json}}", json.dumps(authorities, indent=2))
        )
    return f"Route this {req.category} issue at {locality} to the right department."


@router.post("/route", response_model=RouteResponse)
async def route_issue(req: RouteRequest):
    authorities = load_authorities()
    prompt = load_prompt(req, authorities)

    try:
        parsed, ai_run = await call_vision_model(
            prompt=prompt,
            images=[],
            task="route",
        )
        result = RouteResponse(**parsed)
        logger.info(f"Routed to: {[a.department for a in result.authorities]}")
        return result
    except Exception as e:
        logger.error(f"Routing failed: {e}")
        # Fail safe: route to all matching departments
        fallback = [
            {
                "id": a["id"],
                "department": a["department"],
                "reason": "Auto-routed (AI unavailable)",
            }
            for a in authorities
            if req.category in (a.get("handles") or [])
        ]
        return RouteResponse(authorities=fallback, confidence=0.0)
