# server/services/nodejs_client.py
import httpx
from typing import Optional
from datetime import datetime

NODE_API_BASE = "http://localhost:3500"
ENDPOINT = f"{NODE_API_BASE}/video-analysis"

async def send_video_analysis_to_nodejs(
    video_url: str,
    safety_percent: float,
    verdict_text: str,
    is_dangerous: bool,
    duration_seconds: int,
    title: Optional[str] = None,
    tags: Optional[str] = None,
    preview_image_url: Optional[str] = None,
    checked_at: Optional[datetime] = None,
    userId: Optional[int] = None
):
    """
    Отправляет результат анализа видео в Node.js сервер для сохранения в БД.
    """
    payload = {
        "video_url": video_url,
        "safety_percent": safety_percent,
        "verdict_text": verdict_text,
        "is_dangerous": is_dangerous,
        "duration_seconds": duration_seconds,
        "title": title,
        "tags": tags,
        "preview_image_url": preview_image_url,
        "checked_at": (checked_at or datetime.utcnow()).isoformat(),
        "userId": userId,   # передаём в теле
    }
    payload = {k: v for k, v in payload.items() if v is not None}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(ENDPOINT, json=payload)
        response.raise_for_status()
        return response.json()