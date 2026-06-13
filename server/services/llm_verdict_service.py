# services/llm_verdict_service.py
import json
import re
from pathlib import Path
from .model_loader import get_llm_model


def get_llm_verdict(analyze_id: str, metadata: dict, transcript: str, frame_analysis: dict) -> dict:
    prompt = f"""Ты - модератор контента. Проанализируй видео и определи, опасный это контент или безопасный.

ИНФОРМАЦИЯ О ВИДЕО:
Название: {metadata.get('title', '')}
Описание: {metadata.get('description', '')[:500]}

РАСШИФРОВКА АУДИО:
{transcript[:1500]}

ВОПРОС: Это видео про незаконное казино, финансовую пирамиду или мошенничество?

ОТВЕТЬ ТОЛЬКО В ТАКОМ ФОРМАТЕ:
Опасно: ДА или НЕТ
Причина: короткое объяснение
Уверенность: число от 0 до 1

Пример ответа:
Опасно: ДА
Причина: видео рекламирует онлайн-казино с призывом заработать
Уверенность: 0.9"""

    try:
        llm = get_llm_model()
        
        output = llm.generate(
            prompt=prompt,
            max_tokens=200,
            temperature=0.3
        )
        
        response_text = output["choices"][0]["text"].strip()
        print(f"Ответ модели: {response_text}")
 
        verdict = _parse_simple_response(response_text)
        
    except Exception as e:
        print(f"Ошибка: {e}")
        verdict = _fallback_verdict(str(e))
 
    base_path = Path("temp") / analyze_id
    verdict_path = base_path / "verdict.json"
    with open(verdict_path, 'w', encoding='utf-8') as f:
        json.dump(verdict, f, ensure_ascii=False, indent=2)
    
    return verdict


def _parse_simple_response(text: str) -> dict:

    text = text.lower()
    
    is_dangerous = False
    if "опасно: да" in text or "опасно: д" in text:
        is_dangerous = True
    elif "опасно: нет" in text or "опасно: н" in text:
        is_dangerous = False
    else:
        danger_words = ['казино', 'пирамид', 'мошен', 'заработок', 'casino', 'pyramid', 'scam']
        is_dangerous = any(word in text for word in danger_words)
    
    # Ищем уверенность
    confidence = 0.7  # значение по умолчанию
    import re
    match = re.search(r'уверенность:\s*([0-9.]+)', text)
    if match:
        try:
            confidence = float(match.group(1))
            confidence = min(max(confidence, 0), 1)  # ограничиваем от 0 до 1
        except:
            pass
    
    # Ищем причину
    reason = text[:200]  # первые 200 символов
    match = re.search(r'причина:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    if match:
        reason = match.group(1).strip()
    
    return {
        "is_dangerous": is_dangerous,
        "confidence": confidence,
        "verdict": "опасный" if is_dangerous else "безопасный",
        "reason": reason[:200]
    }


def _fallback_verdict(error_msg: str) -> dict:
    return {
        "is_dangerous": False,
        "confidence": 0.5,
        "verdict": "неизвестно",
        "reason": f"Анализ не завершен: {error_msg}"
    }