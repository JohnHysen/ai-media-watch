# services/nodejs_client.py
import httpx
from typing import Optional
from datetime import datetime
import json

# Используем внутренний эндпоинт без auth
NODE_API_BASE = "http://localhost:3500"
ENDPOINT = f"{NODE_API_BASE}/video-analysis/internal/create"

async def send_video_analysis_to_nodejs(
    video_url: str,
    safety_percent: float,
    verdict_text: str,
    is_dangerous: bool,
    duration_seconds: int,
    uploader: str,
    title: Optional[str] = None,
    tags: Optional[str] = None,
    preview_image_url: Optional[str] = None,
    checked_at: Optional[datetime] = None,
    userId: Optional[int] = None,
    primary_risk: Optional[str] = None,
):
    """
    Отправляет результат анализа видео в Node.js сервер для сохранения в БД.
    """
    
    # Проверяем обязательные поля
    if not video_url:
        print("❌ Ошибка: video_url обязателен")
        return {"error": "video_url is required"}
    
    if safety_percent is None:
        print("❌ Ошибка: safety_percent обязателен")
        return {"error": "safety_percent is required"}
    
    if not verdict_text:
        print("❌ Ошибка: verdict_text обязателен")
        return {"error": "verdict_text is required"}
    
    if is_dangerous is None:
        print("❌ Ошибка: is_dangerous обязателен")
        return {"error": "is_dangerous is required"}
    
    if not duration_seconds:
        print("❌ Ошибка: duration_seconds обязателен")
        return {"error": "duration_seconds is required"}
    
    # Приводим verdict_text к одному из допустимых значений
    valid_verdicts = ['safe', 'dangerous', 'uncertain']
    if verdict_text not in valid_verdicts:
        print(f"⚠️ Предупреждение: verdict_text='{verdict_text}' не в списке допустимых")
        # Приводим к нужному формату
        if 'опас' in verdict_text.lower():
            verdict_text = 'dangerous'
        elif 'безопас' in verdict_text.lower():
            verdict_text = 'safe'
        else:
            verdict_text = 'uncertain'
    
    # Формируем payload (поля совпадают с ожидаемыми в Node.js)
    payload = {
        "video_url": video_url,
        "safety_percent": float(safety_percent),
        "verdict_text": verdict_text,
        "is_dangerous": bool(is_dangerous),
        "duration_seconds": int(duration_seconds),
        "title": title or None,
        "tags": tags or None,
        "preview_image_url": preview_image_url or None,
        "checked_at": (checked_at or datetime.utcnow()).isoformat() if checked_at else None,
        "userId": userId if userId else None,
        "primary_risk": primary_risk if primary_risk else None,
        "uploader": uploader,
    }
    
    # Удаляем None значения
    payload = {k: v for k, v in payload.items() if v is not None}
    
    print(f"📤 Отправка в Node.js:")
    print(f"   URL: {payload.get('video_url', '')[:50]}...")
    print(f"   Вердикт: {payload.get('verdict_text')}")
    print(f"   Опасно: {payload.get('is_dangerous')}")
    print(f"   Уверенность: {payload.get('safety_percent')}%")
    print(f"   UserId: {payload.get('userId')}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(ENDPOINT, json=payload)
            
            if response.status_code == 201:
                print(f"✅ Данные сохранены в БД (статус: {response.status_code})")
                return response.json()
            elif response.status_code == 400:
                print(f"❌ Ошибка валидации: {response.text}")
                return {"error": "Validation error", "details": response.text}
            else:
                print(f"❌ Node.js вернул ошибку: {response.status_code}")
                print(f"   Ответ: {response.text[:200]}")
                try:
                    error_data = response.json()
                    print(f"   Детали: {json.dumps(error_data, ensure_ascii=False, indent=2)}")
                except:
                    pass
            return {"error": f"HTTP {response.status_code}", "details": response.text[:500]}
                
    except httpx.ConnectError:
        print(f"⚠️ Node.js сервер не доступен на {NODE_API_BASE}")
        print("   Запустите Node.js сервер командой: npm start")
        return {"error": "Node.js server not available"}
        
    except httpx.TimeoutException:
        print("⚠️ Таймаут при отправке в Node.js")
        return {"error": "Timeout"}
        
    except Exception as e:
        print(f"⚠️ Ошибка при отправке в Node.js: {e}")
        return {"error": str(e)}