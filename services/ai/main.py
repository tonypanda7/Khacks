import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.classify import router as classify_router
from routes.embed import router as embed_router
from routes.same_defect import router as same_defect_router
from routes.priority import router as priority_router
from routes.route import router as route_router
from routes.verify_fix import router as verify_fix_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    key = os.getenv("DEEPINFRA_API_KEY") or os.getenv("OPENROUTER_API_KEY")
    logger.info("🚀 FixProof AI Service starting...")
    logger.info(f"   Provider Base: {os.getenv('AI_BASE_URL', 'default')}")
    logger.info(f"   Model: {os.getenv('AI_MODEL', 'Qwen/Qwen2.5-VL-7B-Instruct')}")
    logger.info(f"   API Key: {'✓ configured' if key else '✗ missing'}")
    yield
    logger.info("AI Service shutting down...")


app = FastAPI(
    title="FixProof AI Service",
    description="AI endpoints for civic issue classification, dedup, priority, routing, and proof-of-fix",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify_router)
app.include_router(embed_router)
app.include_router(same_defect_router)
app.include_router(priority_router)
app.include_router(route_router)
app.include_router(verify_fix_router)


@app.get("/health")
async def health():
    key = bool(os.getenv("DEEPINFRA_API_KEY") or os.getenv("OPENROUTER_API_KEY"))
    provider = "deepinfra" if os.getenv("DEEPINFRA_API_KEY") else "openrouter"
    return {
        "status": "ok" if key else "degraded",
        "provider": provider,
        "model": os.getenv("AI_MODEL", "Qwen/Qwen2.5-VL-7B-Instruct"),
        "api_key_set": key,
    }
