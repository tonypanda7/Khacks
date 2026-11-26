import os
import json
import hashlib
import logging
import time
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from schemas.common import VerifyFixResponse, VerifyPairOutput
from routes._openrouter import call_vision_model, get_model, hash_prompt

logger = logging.getLogger(__name__)
router = APIRouter()


# Load thresholds from config
def load_thresholds() -> dict:
    config_path = os.path.join(
        os.path.dirname(__file__), "../../../config/thresholds.yaml"
    )
    if os.path.exists(config_path):
        import yaml

        with open(config_path) as f:
            config = yaml.safe_load(f)
        return config.get("proof", {})
    return {"max_refs": 6, "approve": 0.75, "reject": 0.35}


class VerifyFixRequest(BaseModel):
    issue_id: str
    fix_attempt_id: str
    fix_image_ids: List[str]
    # In production these would load from DB; for now accept base64
    fix_images_b64: Optional[List[str]] = None
    ref_images_b64: Optional[List[str]] = None
    category: str = "pothole"
    severity: int = 3
    time_delta: str = "unknown"
    distance_m: float = 0.0


def load_prompt(
    category: str, time_delta: str, distance_m: float, severity: int
) -> str:
    prompt_path = os.path.join(
        os.path.dirname(__file__), "../../../prompts/verify_fix.md"
    )
    if os.path.exists(prompt_path):
        with open(prompt_path) as f:
            template = f.read()
        return (
            template.replace("{{category}}", category)
            .replace("{{time_delta}}", time_delta)
            .replace("{{distance_m}}", f"{distance_m:.1f}")
            .replace("{{severity}}", str(severity))
        )
    return "Compare these images. Has the defect been repaired? Return JSON with same_location_prob, defect_repaired_prob, rationale."


@router.post("/verify-fix", response_model=VerifyFixResponse)
async def verify_fix(req: VerifyFixRequest):
    thresholds = load_thresholds()
    prompt = load_prompt(req.category, req.time_delta, req.distance_m, req.severity)

    # Decode images
    fix_images = []
    if req.fix_images_b64:
        fix_images = [base64.b64decode(b) for b in req.fix_images_b64]

    ref_images = []
    if req.ref_images_b64:
        ref_images = [base64.b64decode(b) for b in req.ref_images_b64]

    if not fix_images or not ref_images:
        raise HTTPException(400, "Both fix and reference images are required")

    # Limit references
    max_refs = thresholds.get("max_refs", 6)
    ref_images = ref_images[:max_refs]

    # Pairwise judging
    pair_outputs: List[VerifyPairOutput] = []

    for i, fix_img in enumerate(fix_images):
        for j, ref_img in enumerate(ref_images):
            try:
                parsed, ai_run = await call_vision_model(
                    prompt=prompt,
                    images=[fix_img, ref_img],
                    task="verify_fix",
                )

                pair_score = parsed.get("same_location_prob", 0) * parsed.get(
                    "defect_repaired_prob", 0
                )

                pair_output = VerifyPairOutput(
                    fix_image_id=req.fix_image_ids[i]
                    if i < len(req.fix_image_ids)
                    else f"fix_{i}",
                    ref_image_id=f"ref_{j}",
                    same_location_prob=parsed.get("same_location_prob", 0),
                    defect_repaired_prob=parsed.get("defect_repaired_prob", 0),
                    pair_score=pair_score,
                    rationale=parsed.get("rationale", ""),
                )
                pair_outputs.append(pair_output)

            except Exception as e:
                logger.error(f"Pair verification failed (fix={i}, ref={j}): {e}")
                pair_outputs.append(
                    VerifyPairOutput(
                        fix_image_id=req.fix_image_ids[i]
                        if i < len(req.fix_image_ids)
                        else f"fix_{i}",
                        ref_image_id=f"ref_{j}",
                        same_location_prob=0,
                        defect_repaired_prob=0,
                        pair_score=0,
                        rationale=f"Verification failed: {str(e)}",
                    )
                )

    # Combine: median of pair scores
    if pair_outputs:
        scores = sorted([p.pair_score for p in pair_outputs])
        mid = len(scores) // 2
        fix_score = (
            scores[mid]
            if len(scores) % 2
            else (scores[mid - 1] + scores[mid]) / 2
        )
    else:
        fix_score = 0.0

    # Decide
    approve_threshold = thresholds.get("approve", 0.75)
    reject_threshold = thresholds.get("reject", 0.35)

    if fix_score >= approve_threshold:
        decision = "APPROVED"
    elif fix_score <= reject_threshold:
        decision = "REJECTED"
    else:
        decision = "NEEDS_REVIEW"

    # Build receipt
    receipt = {
        "fix_attempt_id": req.fix_attempt_id,
        "issue_id": req.issue_id,
        "model": get_model(),
        "prompt_hash": hash_prompt(prompt),
        "pair_count": len(pair_outputs),
        "fix_score": fix_score,
        "decision": decision,
        "thresholds": {"approve": approve_threshold, "reject": reject_threshold},
        "fix_image_hashes": [
            hashlib.sha256(img).hexdigest() for img in fix_images
        ],
        "ref_image_count": len(ref_images),
        "timestamp": time.time(),
    }

    result = VerifyFixResponse(
        fix_score=fix_score,
        decision=decision,
        pair_outputs=pair_outputs,
        thresholds={"approve": approve_threshold, "reject": reject_threshold},
        receipt=receipt,
    )

    logger.info(f"Proof-of-fix: score={fix_score:.3f}, decision={decision}")
    return result
