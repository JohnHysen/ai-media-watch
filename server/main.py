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
import logging

from .services.file_lifecycle_service import download_video, remove_video
from .services.video_processing_service import video_processing
from .services.metadata_service import get_video_metadata
from .services.speech_to_text_service import transcribe_audio
from .services.frame_analysis_service import analyze_frames, get_first_frame_base64
from .services.llm_verdict_service import get_llm_verdict
from .services.nodejs_client import send_video_analysis_to_nodejs

logger = logging.getLogger(__name__)


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
    url: str, userId: Optional[int] = None, background_tasks: BackgroundTasks = None
):
    start_time = time.time()
    analyze_id = str(uuid.uuid4())

    try:
        logger.info(f"Запущен анализ №{analyze_id}. Ссылка: {url}, userId: {userId}")

        download_video(analyze_id, url)
        logger.info("Видео скачано")

        metadata = get_video_metadata(analyze_id, url)

        video_processing(analyze_id)

        transcript = transcribe_audio(analyze_id)
        logger.info(f"Распознано символов: {len(transcript)}")

        frame_analysis = analyze_frames(analyze_id)
        logger.info(f"Кадров проанализировано: {frame_analysis.get('total_frames', 0)}")

        logger.info("Получение превью...")
        preview_image = get_first_frame_base64(analyze_id)
        if preview_image:
            logger.info(f"Превью создано")
        else:
            logger.warning("Превью не создано")

        verdict = get_llm_verdict(analyze_id, metadata, transcript, frame_analysis)
        print(verdict)

        logger.info("Очистка...")
        remove_video(analyze_id)

        duration_seconds = round(time.time() - start_time, 2)

        # === Подготовка результата для ответа клиенту ===
        is_dangerous = verdict.get("is_dangerous", False)
        confidence = verdict.get("confidence", 0.0)
        primary_risk = verdict.get("primary_risk", "не определен")

        if is_dangerous:
            safety_percent = round((1 - confidence) * 100, 2)
        else:
            safety_percent = round(confidence * 100, 2)

        safety_percent = max(0.1, min(99.9, safety_percent))

        if is_dangerous:
            verdict_text = "dangerous"
        else:
            if confidence < 0.6:
                verdict_text = "uncertain"
            else:
                verdict_text = "safe"

        verdict_text = verdict_text.strip().lower()
        logger.info(f"РЕЗУЛЬТАТ: {verdict_text.upper()} ({confidence:.0%})")
        logger.info(f"ОСНОВНОЙ РИСК: {primary_risk}")

        uploader = metadata.get("uploader", "Неизвестный автор")

        return {
            "video_url": url,
            "title": metadata.get("title", ""),
            "safety_percent": safety_percent,
            "verdict_text": verdict_text.strip().lower(),
            "reason_ru": verdict.get("reason_ru", ""),
            "reason_en": verdict.get("reason_en", ""),
            "reason_kz": verdict.get("reason_kz", ""),
            "reason": verdict.get("reason", ""),
            "is_dangerous": is_dangerous,
            "duration_seconds": duration_seconds,
            "preview_image_url": preview_image,
            "checked_at": datetime.now().isoformat(),
            "primary_risk": primary_risk,
            "uploader": uploader,
        }

    except Exception as e:
        try:
            remove_video(analyze_id)
        except:
            pass
        raise e


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/analyzeLocal")
async def analyzeLocal(
    fileName: str,
    userName: str,
):
    import os
    import shutil
    import uuid
    import time

    from datetime import datetime

    start_time = time.time()

    analyze_id = str(uuid.uuid4())

    try:
        logger.info(f"START LOCAL ANALYZE: {fileName}")
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

        storage_dir = os.path.join(PROJECT_ROOT, "storage")

        source_path = os.path.join(storage_dir, fileName)

        print(source_path)

        if not os.path.exists(source_path):
            raise Exception(f"File not found: {source_path}")

        videos_dir = "videos"
        temp_dir = os.path.join("temp", analyze_id)

        os.makedirs(temp_dir, exist_ok=True)

        analyze_video_path = os.path.join(temp_dir, "video.mp4")

        print("SOURCE:", source_path)
        print("DEST:", analyze_video_path)

        shutil.copyfile(source_path, analyze_video_path)

        print("FILE EXISTS:", os.path.exists(analyze_video_path))

        video_processing(analyze_id)

        transcript = transcribe_audio(analyze_id)

        logger.info(f"Transcript symbols: {len(transcript)}")

        frame_analysis = analyze_frames(analyze_id)

        logger.info(f"Frames analyzed: {frame_analysis.get('total_frames', 0)}")
        preview_image = get_first_frame_base64(analyze_id)
        metadata = {
            "uploader": userName,
            "title": fileName,
        }
        verdict = get_llm_verdict(analyze_id, metadata, transcript, frame_analysis)

        logger.info(f"VERDICT: {verdict}")

        is_dangerous = verdict.get("is_dangerous", False)

        confidence = verdict.get("confidence", 0.0)

        primary_risk = verdict.get("primary_risk", "unknown")

        if is_dangerous:
            safety_percent = round((1 - confidence) * 100, 2)
        else:
            safety_percent = round(confidence * 100, 2)

        safety_percent = max(0.1, min(99.9, safety_percent))

        if is_dangerous:
            verdict_text = "dangerous"
        else:
            verdict_text = "safe" if confidence >= 0.6 else "uncertain"

        duration_seconds = round(time.time() - start_time, 2)
        video_url = f"/storage/{fileName}"

        try:
            remove_video(analyze_id)
        except Exception as cleanup_error:
            logger.warning(cleanup_error)

        return {
            "success": True,
            "authorName": userName,
            "video_url": video_url,
            "file_name": fileName,
            "safety_percent": safety_percent,
            "verdict_text": verdict_text,
            "reason_ru": verdict.get("reason_ru", ""),
            "reason_en": verdict.get("reason_en", ""),
            "reason_kz": verdict.get("reason_kz", ""),
            "reason": verdict.get("reason", ""),
            "is_dangerous": is_dangerous,
            "confidence": confidence,
            "primary_risk": primary_risk,
            "preview_image_url": preview_image,
            "duration_seconds": duration_seconds,
            "checked_at": datetime.now().isoformat(),
            "frame_analysis": frame_analysis,
        }

    except Exception as e:

        logger.exception(e)

        try:
            remove_video(analyze_id)
        except:
            pass

        return {
            "success": False,
            "error": str(e),
            "file_name": fileName,
        }


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}


@app.get("/health")
def health():
    return {"status": "ok", "service": "AI Media Watch"}
