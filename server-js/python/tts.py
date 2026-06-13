import sys
import json
import traceback
import soundfile as sf
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

def log(msg):
    print(msg, file=sys.stderr, flush=True)

def main():
    log("TTS: script started")

    if len(sys.argv) < 4:
        print(json.dumps({"ok": False, "error": "Usage: python tts.py <text> <prompt> <output>"}))
        sys.exit(1)

    text = sys.argv[1]
    audio_prompt_path = sys.argv[2]
    output_path = sys.argv[3]

    log(f"TTS: text={text[:50]!r}")
    log(f"TTS: prompt={audio_prompt_path}")
    log(f"TTS: output={output_path}")

    try:
        log("TTS: loading model...")
        model = ChatterboxMultilingualTTS.from_pretrained(device="cuda")
        log("TTS: model loaded")

        log("TTS: generating audio...")
        wav = model.generate(
            text,
            audio_prompt_path=audio_prompt_path,
            language_id="ru",
            cfg_weight=0.2,
            exaggeration=0.3
        )
        log("TTS: audio generated")

        log("TTS: writing file...")
        sf.write(output_path, wav.cpu().numpy().T, model.sr)
        log("TTS: file written")

        print(json.dumps({
            "ok": True,
            "output": output_path
        }), flush=True)

    except Exception as e:
        log("TTS: exception happened")
        log(traceback.format_exc())
        print(json.dumps({
            "ok": False,
            "error": str(e)
        }), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()