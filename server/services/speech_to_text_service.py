# services/speech_to_text_service.py
from pathlib import Path
from .model_loader import get_whisper_model

def transcribe_audio(analyze_id: str) -> str:
    
    base_path = Path("temp") / analyze_id
    audio_path = base_path / "audio" / "audio.mp3"
    
    if not audio_path.exists():
        return ""

    model = get_whisper_model()
    
    result = model.transcribe(str(audio_path), language="ru")
    
    transcript_path = base_path / "transcript.txt"
    with open(transcript_path, 'w', encoding='utf-8') as f:
        f.write(result['text'])
    
    return result['text']