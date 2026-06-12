# services/model_loader.py
import os
from pathlib import Path
import whisper
import requests
import json

_whisper_model = None

LLAMA_SERVER_URL = os.getenv("LLAMA_SERVER_URL", "http://127.0.0.1:8080")

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        model_dir = Path("models/whisper")
        model_dir.mkdir(parents=True, exist_ok=True)
        print("📥 Загрузка Whisper модели...")
        _whisper_model = whisper.load_model("base", download_root=str(model_dir))
        print("✅ Whisper загружен")
    return _whisper_model


class LlamaCppClient:
    
    def __init__(self, server_url: str = LLAMA_SERVER_URL):
        self.server_url = server_url
        self.session = requests.Session()
    
    def generate(self, prompt: str, max_tokens: int = 500, temperature: float = 0.3):
        # llama.cpp API принимает промпт в формате /completion
        response = self.session.post(
            f"{self.server_url}/completion",
            json={
                "prompt": prompt,
                "n_predict": max_tokens,
                "temperature": temperature,
                "top_p": 0.95,
                "stop": ["</s>", "User:", "Human:", "\n\n\n"],
                "stream": False,
            },
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "choices": [{
                    "text": result["content"],
                    "finish_reason": result.get("stop", True)
                }]
            }
        else:
            raise Exception(f"Ошибка сервера: {response.status_code} - {response.text}")
    
    def __call__(self, prompt, max_tokens=500, temperature=0.3, top_p=0.95, stop=None, echo=False):
        return self.generate(prompt, max_tokens, temperature)

_llm_client = None

def get_llm_model():
    global _llm_client
    if _llm_client is None:
        _llm_client = LlamaCppClient()
        print("✅ Подключение к llama.cpp серверу установлено")
    return _llm_client