import httpx
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

NODE_API_URL = "http://localhost:3500"

# Токен авторизации (берётся из .env)
DEFAULT_TOKEN = os.getenv("NODE_TOKEN")

async def add_video_to_queue(video_url: str, user_id: Optional[int] = None, token: Optional[str] = None) -> dict:
    """
    Отправляет ссылку на видео в очередь Node.js (/analysis-queue).
    Требуется авторизация (Bearer token).
    """
    endpoint = f"{NODE_API_URL}/analysis-queue"
    payload = {"url": video_url}
    if user_id is not None:
        payload["userId"] = user_id

    headers = {
        "Authorization": f"Bearer {token or DEFAULT_TOKEN}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(endpoint, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()