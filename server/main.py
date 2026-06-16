import os
import uuid
import time
from pathlib import Path
from fastapi import FastAPI, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from .services.file_lifecycle_service import download_video, remove_video
from .services.video_processing_service import video_processing
from .services.metadata_service import get_video_metadata
from .services.speech_to_text_service import transcribe_audio
from .services.frame_analysis_service import analyze_frames
from .services.llm_verdict_service import get_llm_verdict
from .services.nodejs_client import send_video_analysis_to_nodejs

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/analyze")
async def analyze(
    url: str,
    userId: Optional[int] = Query(None, description="ID пользователя, если инициировал проверку"),
    background_tasks: BackgroundTasks = None
):
    start_time = time.time()
    analyze_id = str(uuid.uuid4())

    try:
        print(f"🔍 Анализ видео: {url}")
        print(f"📁 ID: {analyze_id}")

        download_video(analyze_id, url)
        print("   ✅ Видео скачано")

        metadata = get_video_metadata(analyze_id, url)
        print(f"   ✅ Название: {metadata.get('title', '')[:50]}")

        video_processing(analyze_id)
        print("   ✅ Обработка завершена")

        transcript = transcribe_audio(analyze_id)
        print(f"   ✅ Распознано символов: {len(transcript)}")

        frame_analysis = analyze_frames(analyze_id)
        print(f"   ✅ Кадров проанализировано: {frame_analysis.get('total_frames', 0)}")

        verdict = get_llm_verdict(analyze_id, metadata, transcript, frame_analysis)

        # Удаляем временные файлы
        print("🧹 Очистка...")
        remove_video(analyze_id)

        duration = round(time.time() - start_time, 2)

        # === Подготовка результата для ответа клиенту ===
        result = {
            "url": url,
            "video_title": metadata.get("title", ""),
            "verdict": verdict.get("verdict", "неизвестно"),
            "is_dangerous": verdict.get("is_dangerous", False),
            "confidence": verdict.get("confidence", 0.0),
            "reason": verdict.get("reason", ""),
            "frames_analyzed": frame_analysis.get("total_frames", 0),
            "transcript_length": len(transcript),
            "time_seconds": duration,
        }

        # === Отправка в Node.js (фоновая задача) ===
        is_danger = verdict.get("is_dangerous", False)
        confidence = verdict.get("confidence", 0.0)

        if is_danger:
            safety_percent = round((1 - confidence) * 100, 2)
        else:
            safety_percent = round(confidence * 100, 2)

        if is_danger:
            node_verdict = 'dangerous'
        else:
            if confidence < 0.6:
                node_verdict = 'uncertain'
            else:
                node_verdict = 'safe'

        duration_seconds = metadata.get('duration', 0)
        if isinstance(duration_seconds, str):
            try:
                duration_seconds = int(duration_seconds)
            except:
                duration_seconds = 0

        # ✅ Передаём userId из параметра запроса
        background_tasks.add_task(
            send_video_analysis_to_nodejs,
            video_url=url,
            safety_percent=safety_percent,
            verdict_text=node_verdict,
            is_dangerous=is_danger,
            duration_seconds=duration_seconds,
            title=metadata.get("title"),
            tags=None,
            preview_image_url=None,
            userId=userId,   # <-- добавлено
        )

        print(f"\n✨ РЕЗУЛЬТАТ: {result['verdict'].upper()} ({result['confidence']:.0%})")
        return result

    except Exception as e:
        try:
            remove_video(analyze_id)
        except:
            pass
        raise e

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}