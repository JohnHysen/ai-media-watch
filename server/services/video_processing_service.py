from pathlib import Path
import ffmpeg


def video_processing(analyze_id: str):
    print(f"🎬 Начало обработки видео {analyze_id}")
    extract_audio(analyze_id)
    extract_frames(analyze_id)
    print(f"✅ Обработка видео завершена")


def extract_audio(analyze_id: str):
    print(f"🎵 Извлечение аудио...")
    base_path = Path("temp") / analyze_id
    input_path = base_path / "video.mp4"

    if not input_path.exists():
        raise FileNotFoundError(f"Видео не найдено: {input_path}")

    audio_dir = base_path / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    output_path = audio_dir / "audio.mp3"

    (
        ffmpeg.input(str(input_path))
        .output(str(output_path), format="mp3", acodec="mp3")
        .run(overwrite_output=True, quiet=True)
    )
    print(f"✅ Аудио сохранено")


def extract_frames(analyze_id: str):
    print(f"🖼️ Извлечение кадров...")
    base_path = Path("temp") / analyze_id
    input_path = base_path / "video.mp4"

    frames_dir = base_path / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    output_path = frames_dir / "frame_%04d.jpg"

    (
        ffmpeg.input(str(input_path))
        .output(str(output_path), vf="fps=0.2")
        .run(overwrite_output=True, quiet=True)
    )
    print(f"✅ Кадры сохранены")
