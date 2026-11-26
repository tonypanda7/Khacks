import os
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from schemas.common import ClassifyResponse

from routes._openrouter import call_vision_model

logger = logging.getLogger(__name__)
router = APIRouter()


def load_prompt() -> str:
    prompt_path = os.path.join(
        os.path.dirname(__file__), "../../../prompts/classify.md"
    )
    if os.path.exists(prompt_path):
        with open(prompt_path) as f:
            return f.read()
    # Fallback inline prompt
    return """Analyze this image. Return JSON: {"is_civic_issue": bool, "category": "pothole"|"drainage"|"garbage"|null, "severity_1_5": int|null, "severity_rationale": str, "confidence": float, "visible_cues": [str]}"""


@router.post("/classify", response_model=ClassifyResponse)
async def classify(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Must upload an image")

    image_bytes = await image.read()
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(400, "Image too large (max 20MB)")

    prompt = load_prompt()

    try:
        parsed, ai_run = await call_vision_model(
            prompt=prompt,
            images=[image_bytes],
            task="classify",
        )

        # Validate with pydantic
        result = ClassifyResponse(**parsed)
        logger.info(
            f"Classification: {result.category} (severity={result.severity_1_5}, conf={result.confidence:.2f})"
        )
        return result

    except Exception as e:
        logger.error(f"Classification failed: {e}")
        # Fail safe: return NEEDS_REVIEW
        return ClassifyResponse(
            is_civic_issue=True,
            category=None,
            severity_1_5=None,
            severity_rationale=f"Classification failed: {str(e)}",
            confidence=0.0,
            visible_cues=[],
        )
