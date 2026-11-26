import os
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from schemas.common import SameDefectResponse
from routes._openrouter import call_vision_model

logger = logging.getLogger(__name__)
router = APIRouter()


def load_prompt(category: str) -> str:
    prompt_path = os.path.join(
        os.path.dirname(__file__), "../../../prompts/same_defect.md"
    )
    if os.path.exists(prompt_path):
        with open(prompt_path) as f:
            template = f.read()
        return template.replace("{{category}}", category).replace(
            "{{radius_m}}", "40"
        )
    return f"""Compare these two images. Both classified as {category}. Return JSON: {{"same_defect_prob": float, "rationale": str}}"""


@router.post("/same-defect", response_model=SameDefectResponse)
async def same_defect(
    image_new: UploadFile = File(...),
    image_ref: UploadFile = File(...),
    category: str = Form("pothole"),
):
    new_bytes = await image_new.read()
    ref_bytes = await image_ref.read()

    prompt = load_prompt(category)

    try:
        parsed, ai_run = await call_vision_model(
            prompt=prompt,
            images=[new_bytes, ref_bytes],
            task="same_defect",
        )
        result = SameDefectResponse(**parsed)
        logger.info(f"Same defect: prob={result.same_defect_prob:.2f}")
        return result
    except Exception as e:
        logger.error(f"Same-defect check failed: {e}")
        # Fail safe: low probability (don't auto-merge)
        return SameDefectResponse(
            same_defect_prob=0.0,
            rationale=f"Check failed: {str(e)}",
        )
