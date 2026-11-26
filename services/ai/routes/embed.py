import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from routes._openrouter import call_embedding_model

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/embed")
async def embed(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Must upload an image")

    image_bytes = await image.read()

    try:
        embedding = await call_embedding_model(image_bytes)
        return {"embedding": embedding, "dimensions": len(embedding)}
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        raise HTTPException(500, f"Embedding failed: {str(e)}")
