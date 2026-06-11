from fastapi import FastAPI
import uuid
import time

from services.file_lifecycle_service import download_video, remove_video
from services.video_processing_service import video_processing

app = FastAPI()


@app.get("/analyze")
def analyze(url: str):
    start_time = time.time()

    analyze_id = str(uuid.uuid4())

    download_video(analyze_id, url)
    video_processing(analyze_id)
    remove_video(analyze_id)

    end_time = time.time()
    duration = round(end_time - start_time, 2)

    return {"url": url, "status": "downloaded", "time_seconds": duration}


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
