import yt_dlp
from pathlib import Path
import shutil


def download_video(analyze_id: str, url: str):
    path = Path("temp") / analyze_id
    path.mkdir(parents=True, exist_ok=True)

    output = path / "video.mp4"

    ydl_opts = {"outtmpl": str(output), "format": "mp4/best"}

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])


def remove_video(analyze_id: str):
    path = Path("temp") / analyze_id

    if path.exists():
        shutil.rmtree(path)