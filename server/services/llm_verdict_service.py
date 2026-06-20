# services/llm_verdict_service.py
import json
import re
from pathlib import Path
from .model_loader import get_llm_model


def get_llm_verdict(analyze_id: str, metadata: dict, transcript: str, frame_analysis: dict) -> dict:
    
    title = metadata.get('title', '')[:200]
    description = metadata.get('description', '')[:500]
    transcript_text = transcript[:1500] if transcript else ""
    
    total_frames = frame_analysis.get('total_frames', 0)
    suspicious_frames = frame_analysis.get('suspicious_frames', 0)
    scheme_type = frame_analysis.get('scheme_type', 'unknown')
    
    prompt = f"""Ты - эксперт по выявлению финансовых преступлений в интернете.
Проанализируй видео и определи, рекламирует ли оно:
- Нелегальное онлайн-казино или азартные игры
- Финансовую пирамиду или MLM-схему
- Мошеннические инвестиции или крипто-схемы

ДАННЫЕ ДЛЯ АНАЛИЗА:
Название: {title}
Описание: {description}
Расшифровка аудио: {transcript_text}
Анализ кадров: {suspicious_frames} из {total_frames} кадров подозрительные, тип схемы: {scheme_type}

ОПРЕДЕЛИ ОСНОВНОЙ РИСК из списка:
1. КАЗИНО - азартные игры, слоты, рулетка, ставки, онлайн-казино
2. ПИРАМИДА - финансовые пирамиды, MLM, матричные схемы
3. ИНВЕСТИЦИИ - мошеннические инвестиции, фейковые проекты
4. КРИПТО - крипто-мошенничество, скам-токены, ICO
5. РЕФЕРАЛЫ - реферальные схемы, приглашения за вознаграждение
6. ПОНЦИ - схема Понци, выплаты за счет новых участников

ОТВЕТЬ СТРОГО В ФОРМАТЕ (каждая строка начинается с ключевого слова):
Опасно: ДА или НЕТ
Основной риск: только один из списка выше (например: КАЗИНО)
Причина: одно предложение с объяснением
Уверенность: число от 0.0 до 1.0

Пример правильного ответа:
Опасно: ДА
Основной риск: КРИПТО
Причина: Видео рекламирует онлайн-казино с обещанием быстрого заработка
Уверенность: 0.9

ТВОЙ ОТВЕТ:"""

    try:
        llm = get_llm_model()
        
        output = llm.generate(
            prompt=prompt,
            max_tokens=150,
            temperature=0.1
        )
        
        response_text = output["choices"][0]["text"].strip()
        print(f"📝 Ответ модели: {response_text[:200]}...")
        
        verdict = _parse_response(response_text)
        
        if verdict.get("verdict") == "неизвестно" or verdict.get("confidence", 0) < 0.3:
            print("⚠️ Нечеткий ответ модели, использую анализ по ключевым словам")
            verdict = _keyword_analysis(title, description, transcript_text, frame_analysis)
        
    except Exception as e:
        print(f"❌ Ошибка LLM: {e}")
        verdict = _keyword_analysis(title, description, transcript_text, frame_analysis)
    
    base_path = Path("temp") / analyze_id
    verdict_path = base_path / "verdict.json"
    with open(verdict_path, 'w', encoding='utf-8') as f:
        json.dump(verdict, f, ensure_ascii=False, indent=2)
    
    return verdict


def _parse_response(text: str) -> dict:
    """Парсит ответ модели в формате 'Ключ: значение'"""
    
    text = text.lower().strip()
    
    # Ищем "опасно: да" или "опасно: нет"
    is_dangerous = None
    
    patterns = [
        (r'опасно:\s*да', True),
        (r'опасно:\s*д\s', True),
        (r'опасно:\s*yes', True),
        (r'опасно:\s*нет', False),
        (r'опасно:\s*н\s', False),
        (r'опасно:\s*no', False),
    ]
    
    for pattern, value in patterns:
        if re.search(pattern, text):
            is_dangerous = value
            break
    
    if is_dangerous is None:
        danger_indicators = ['казино', 'пирамид', 'мошен', 'джекпот', 'заработок', 'casino', 'pyramid', 'scam']
        if any(word in text for word in danger_indicators):
            is_dangerous = True
        else:
            is_dangerous = False
    
    primary_risk = "не определен"
    risk_patterns = [
        (r'основной риск:\s*казино', 'казино'),
        (r'основной риск:\s*пирамид', 'пирамида'),
        (r'основной риск:\s*инвестиц', 'инвестиции'),
        (r'основной риск:\s*крипто', 'крипто'),
        (r'основной риск:\s*реферал', 'рефералы'),
        (r'основной риск:\s*понци', 'понци'),
    ]
    
    for pattern, risk in risk_patterns:
        if re.search(pattern, text):
            primary_risk = risk
            break
    
    # Поиск уверенности
    confidence = 0.7
    match = re.search(r'уверенность:\s*([0-9.]+)', text)
    if match:
        try:
            confidence = float(match.group(1))
            confidence = min(max(confidence, 0), 1)
        except:
            pass
    
    # Поиск причины
    reason = "Анализ на основе предоставленных данных"
    match = re.search(r'причина:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    if match:
        reason = match.group(1).strip()[:200]
    elif len(text) > 20:
        reason = text[:200]
    
    return {
        "is_dangerous": is_dangerous,
        "confidence": confidence,
        "verdict": "опасный" if is_dangerous else "безопасный",
        "reason": reason,
        "primary_risk": primary_risk
    }


def _keyword_analysis(title: str, description: str, transcript: str, frame_analysis: dict) -> dict:
    """Надежный анализ на основе ключевых слов и визуальных маркеров"""
    
    full_text = f"{title} {description} {transcript}".lower()
    
    casino_words = ['казино', 'casino', 'джекпот', 'jackpot', 'слот', 'slot', 'рулетка', 'roulette', 'ставка', 'bet', 'выиграл', 'победил', 'занос', 'игровой автомат']
    pyramid_words = ['пирамид', 'матрица', 'пассивный доход', 'быстрый заработок', 'приглашай друзей', 'реферал', 'mlm']
    invest_words = ['инвестиц', 'трейдинг', 'форекс', 'forex', 'криптовалют', 'бинарные опционы', 'доходность', 'гарантированный доход']
    
    found = []
    risk_types = []
    
    for word in casino_words:
        if word in full_text:
            found.append(("казино", word))
            risk_types.append("казино")
    for word in pyramid_words:
        if word in full_text:
            found.append(("пирамида", word))
            risk_types.append("пирамида")
    for word in invest_words:
        if word in full_text:
            found.append(("инвестиции", word))
            risk_types.append("инвестиции")
    
    # Определяем основной риск (самый частый)
    primary_risk = "не определен"
    if risk_types:
        from collections import Counter
        risk_counts = Counter(risk_types)
        primary_risk = risk_counts.most_common(1)[0][0]
    
    frame_suspicious = frame_analysis.get('suspicious_frames', 0) > 0
    scheme_type = frame_analysis.get('scheme_type', '')
    
    is_dangerous = len(found) > 0 or frame_suspicious or scheme_type != 'clean'
    
    confidence = 0.5
    if len(found) > 0:
        confidence = min(0.6 + len(found) * 0.1, 0.95)
    if frame_suspicious:
        confidence = max(confidence, 0.7)
    if scheme_type in ['illegal_casino', 'financial_pyramid', 'investment_scam']:
        confidence = max(confidence, 0.8)
    
    if found:
        types = list(set([t for t, _ in found]))
        words = [w for _, w in found[:4]]
        reason = f"Обнаружены признаки {', '.join(types)}: {', '.join(words)}"
    elif frame_suspicious:
        reason = f"Обнаружены подозрительные визуальные маркеры (тип: {scheme_type})"
    else:
        reason = "Не обнаружено явных признаков финансовых преступлений"
    
    return {
        "is_dangerous": is_dangerous,
        "confidence": confidence,
        "verdict": "опасный" if is_dangerous else "безопасный",
        "reason": reason[:200],
        "primary_risk": primary_risk
    }