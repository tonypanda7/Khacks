from pydantic import BaseModel, Field
from typing import Optional, List, Any
from enum import Enum
import hashlib
import time
import json


class IssueCategory(str, Enum):
    pothole = "pothole"
    drainage = "drainage"
    garbage = "garbage"


class ClassifyResponse(BaseModel):
    is_civic_issue: bool
    category: Optional[IssueCategory] = None
    severity_1_5: Optional[int] = Field(None, ge=1, le=5)
    severity_rationale: Optional[str] = None
    confidence: float = Field(ge=0, le=1)
    visible_cues: List[str] = []


class SameDefectResponse(BaseModel):
    same_defect_prob: float = Field(ge=0, le=1)
    rationale: str


class PriorityResponse(BaseModel):
    priority_0_100: int = Field(ge=0, le=100)
    band: str
    rationale: str
    factors: List[dict] = []


class RouteAuthority(BaseModel):
    id: str
    department: str
    reason: str


class RouteResponse(BaseModel):
    authorities: List[RouteAuthority]
    confidence: float = Field(ge=0, le=1)


class VerifyPairOutput(BaseModel):
    fix_image_id: str
    ref_image_id: str
    same_location_prob: float = Field(ge=0, le=1)
    defect_repaired_prob: float = Field(ge=0, le=1)
    pair_score: float = Field(ge=0, le=1)
    rationale: str


class VerifyFixResponse(BaseModel):
    fix_score: float
    decision: str  # APPROVED, REJECTED, NEEDS_REVIEW
    pair_outputs: List[VerifyPairOutput]
    thresholds: dict
    receipt: dict


class AiRunRecord(BaseModel):
    task: str
    model: str
    prompt_hash: str
    input_hashes: List[str]
    raw_output: str
    parsed: Optional[Any] = None
    latency_ms: int
