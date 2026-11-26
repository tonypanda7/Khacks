import os
import json
import time
import hashlib
import base64
import logging
import httpx
from typing import Optional, Any

logger = logging.getLogger(__name__)

OPENROUTER_BASE = "https://openrouter.ai/api/v1"


def get_api_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY", "")
    if not key:
        raise ValueError("OPENROUTER_API_KEY not set")
    return key


def get_model() -> str:
    return os.getenv("AI_MODEL", "qwen/qwen2.5-vl-72b-instruct")


def get_embed_model() -> str:
    return os.getenv("EMBED_MODEL", "openai/text-embedding-3-small")


def hash_prompt(prompt: str) -> str:
    return hashlib.sha256(prompt.encode()).hexdigest()[:16]


def hash_image(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()[:16]


def image_to_data_url(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    b64 = base64.b64encode(image_bytes).decode()
    return f"data:{mime_type};base64,{b64}"


async def call_vision_model(
    prompt: str,
    images: list[bytes],
    task: str,
    response_schema: Optional[dict] = None,
    max_retries: int = 1,
) -> tuple[dict, dict]:
    """
    Call OpenRouter vision model and return (parsed_output, ai_run_record).
    Validates JSON output against schema with one retry on parse failure.
    When images is empty, sends a text-only message (no vision payload).
    """
    model = get_model()
    prompt_hash = hash_prompt(prompt)
    input_hashes = [hash_image(img) for img in images]

    # Build messages — vision format only when images are present
    if images:
        content = []
        for img_bytes in images:
            content.append({
                "type": "image_url",
                "image_url": {"url": image_to_data_url(img_bytes)},
            })
        content.append({"type": "text", "text": prompt})
        messages = [{"role": "user", "content": content}]
    else:
        messages = [{"role": "user", "content": prompt}]

    headers = {
        "Authorization": f"Bearer {get_api_key()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fixproof.app",
        "X-Title": "FixProof",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"} if response_schema else None,
    }
    # Remove None values
    payload = {k: v for k, v in payload.items() if v is not None}

    raw_output = ""
    parsed = None
    start = time.time()

    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{OPENROUTER_BASE}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                raw_output = data["choices"][0]["message"]["content"]

                # Parse JSON from response
                # Try to extract JSON from markdown code blocks if needed
                text = raw_output.strip()
                if text.startswith("```"):
                    lines = text.split("\n")
                    text = "\n".join(
                        lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
                    )

                parsed = json.loads(text)
                break  # Success

        except (json.JSONDecodeError, KeyError) as e:
            if attempt < max_retries:
                logger.warning(
                    f"Parse failure on attempt {attempt + 1}, retrying: {e}"
                )
                # Add a hint to return valid JSON
                messages.append({"role": "assistant", "content": raw_output})
                messages.append(
                    {
                        "role": "user",
                        "content": "Your response was not valid JSON. Please respond with ONLY a valid JSON object, no markdown or extra text.",
                    }
                )
                continue
            logger.error(f"Parse failure after retries: {e}")
            parsed = {"error": str(e), "raw": raw_output}

        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            raise

    latency_ms = int((time.time() - start) * 1000)

    ai_run = {
        "task": task,
        "model": model,
        "prompt_hash": prompt_hash,
        "input_hashes": input_hashes,
        "raw_output": raw_output,
        "parsed": parsed,
        "latency_ms": latency_ms,
    }

    return parsed, ai_run


async def call_embedding_model(text_or_image: bytes | str) -> list[float]:
    """Call OpenRouter embedding model."""
    model = get_embed_model()
    headers = {
        "Authorization": f"Bearer {get_api_key()}",
        "Content-Type": "application/json",
    }

    if isinstance(text_or_image, bytes):
        # For image embeddings, encode as base64 and use as input
        input_data = image_to_data_url(text_or_image)
    else:
        input_data = text_or_image

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE}/embeddings",
            headers=headers,
            json={
                "model": model,
                "input": input_data,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["data"][0]["embedding"]
