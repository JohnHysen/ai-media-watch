import json
import re
from pathlib import Path
from .model_loader import get_llm_model
from collections import Counter

# Список известных мошеннических доменов (для примера)
BLACKLISTED_DOMAINS = {
    "scam-casino.com",
    "fake-investment.ru",
    "ponzi-scheme.org",
    # Добавьте реальные домены из вашей базы
}


def _extract_urls(text: str) -> list:
    """Извлекает все URL из текста."""
    url_pattern = r"(https?://[^\s]+)"
    return re.findall(url_pattern, text)


def _check_urls(urls: list) -> int:
    """
    Проверяет URL по чёрному списку.
    Возвращает количество найденных опасных ссылок.
    """
    if not urls:
        return 0
    dangerous = 0
    for url in urls:
        for domain in BLACKLISTED_DOMAINS:
            if domain in url:
                dangerous += 1
                break
    return dangerous


def get_llm_verdict(
    analyze_id: str, metadata: dict, transcript: str, frame_analysis: dict
) -> dict:
    title = metadata.get("title", "")[:200]
    description = metadata.get("description", "")[:500]
    transcript_text = transcript[:1500] if transcript else ""

    # Извлекаем данные из frame_analysis
    total_frames = frame_analysis.get("total_frames", 0)
    suspicious_frames = frame_analysis.get("suspicious_frames", 0)
    object_counts = frame_analysis.get("object_counts", {})
    ocr_texts = frame_analysis.get("ocr_texts", [])
    timeline = frame_analysis.get("timeline", [])
    scheme_type = frame_analysis.get("scheme_type", "unknown")

    # Формируем описания
    if object_counts:
        objects_desc = ", ".join(
            [f"{obj}: {count} кадров" for obj, count in object_counts.items()]
        )
    else:
        objects_desc = "не обнаружено"

    ocr_samples = []
    for ts, text in ocr_texts[:5]:
        ocr_samples.append(f"на {ts} сек: {text[:100]}")
    ocr_desc = "\n".join(ocr_samples) if ocr_samples else "не обнаружено"

    timeline_desc = []
    for item in timeline[:5]:
        sec = item["second"]
        objs = ", ".join(item["objects"]) if item["objects"] else "нет"
        txt = item["text"][:50] if item["text"] else ""
        timeline_desc.append(f"  {sec}с: объекты [{objs}], текст: '{txt}'")
    timeline_desc = (
        "\n".join(timeline_desc) if timeline_desc else "нет подозрительных сцен"
    )

    # Анализ ссылок
    full_text_for_links = f"{title} {description} {transcript_text}"
    urls = _extract_urls(full_text_for_links)
    dangerous_links = _check_urls(urls)
    link_info = (
        f"Найдено ссылок: {len(urls)}, из них опасных: {dangerous_links}"
        if urls
        else "Ссылки не обнаружены"
    )

    prompt = f"""Ты — эксперт по выявлению финансовых преступлений в интернете.  
Твоя задача — оценить уровень опасности видео по шкале от 0% до 100% на основе трёх факторов:

1. **Упоминание** (наличие слов "казино", "инвестиции", "пирамида", "криптовалюта" и т.п.)  
   - Если тема просто упоминается (в позитивном или нейтральном ключе) → до 40%.
   - Если упоминание сопровождается обещаниями или эмоциональными призывами → выше.

2. **Демонстрация** (визуальные кадры, показывающие игровые автоматы, рулетку, деньги, графики, роскошь)  
   - Показ объектов без призыва → до 70%.
   - Если объекты показаны в контексте "вот как это работает" или "вот пример" → оценивай ниже (до 50%).
   - Если объекты являются центральной частью видео и демонстрируются многократно → выше.

3. **Призыв к действию** (прямые или косвенные побуждения: "зарегистрируйся", "пополни счёт", "инвестируй", "начни зарабатывать", "получи бонус" и т.п.)  
   - Это самый сильный фактор – может дать до 100% опасности, особенно если призыв подкреплён демонстрацией.
   - Если призыв отсутствует, но есть демонстрация – уровень не превышает 70%.
   - Если есть только упоминание без демонстрации и призыва – уровень не превышает 40%.

**Важные корректировки (смягчающие факторы):**  
- Если в видео присутствуют **предупреждения о рисках, критика, разоблачение** – уровень опасности снижается на 20–40 процентных пунктов (в зависимости от силы предупреждения).  
- Если видео носит исключительно информационный или научно-популярный характер – уровень не должен превышать 30%.

**Дополнительно учитывай наличие подозрительных ссылок** в описании или тексте. Если есть ссылки на известные мошеннические ресурсы – это повышает уровень опасности на 10–20%.

**Данные для анализа:**  
Название: {title}  
Описание: {description}  
Расшифровка аудио: {transcript_text}  

ВИЗУАЛЬНЫЙ АНАЛИЗ КАДРОВ:  
Всего кадров: {total_frames}  
Подозрительных кадров: {suspicious_frames}  
Обнаруженные объекты (с частотой): {objects_desc}  
Тип схемы по кадрам: {scheme_type}  

Текст с кадров (OCR):  
{ocr_desc}  

Временная разбивка подозрительных сцен:  
{timeline_desc}  

Информация о ссылках: {link_info}  

**Твой ответ должен быть строго в формате (каждая строка начинается с ключевого слова):**  

Опасно: ДА или НЕТ (если уровень ≥ 50% → ДА, иначе НЕТ)  
Уровень опасности: число от 0 до 100 (целое)  
Основной риск: одно из: КАЗИНО, ПИРАМИДА, ИНВЕСТИЦИИ, КРИПТО, РЕФЕРАЛЫ, ПОНЦИ, НЕТ РИСКА  
Причина_ru: краткое объяснение на русском языке (одно предложение)  
Причина_en: brief explanation in English (one sentence)  
Причина_kz: қысқаша түсініктеме қазақ тілінде (бір сөйлем)  
Уверенность: число от 0.0 до 1.0 (насколько ты уверен в своей оценке)  

Примеры:  
Опасно: ДА  
Уровень опасности: 92  
Основной риск: КАЗИНО  
Причина_ru: Видео демонстрирует игровые автоматы и призывает зарегистрироваться для получения бонуса  
Причина_en: The video shows slot machines and urges registration to get a bonus  
Причина_kz: Бейне ойын автоматтарын көрсетіп, бонус алу үшін тіркелуге шақырады  
Уверенность: 0.95  

Опасно: НЕТ  
Уровень опасности: 25  
Основной риск: НЕТ РИСКА  
Причина_ru: Видео содержит только упоминание казино с предупреждением о рисках, без призывов  
Причина_en: The video only mentions casino with a risk warning, no calls to action  
Причина_kz: Бейнеде казино туралы ескерту ғана бар, шақырулар жоқ  
Уверенность: 0.9  

Теперь проанализируй предоставленные данные и выдай ответ строго по формату."""

    try:
        llm = get_llm_model()
        output = llm.generate(prompt=prompt, max_tokens=200, temperature=0.1)
        response_text = output["choices"][0]["text"].strip()
        print(f"📝 Ответ модели: {response_text[:200]}...")

        verdict = _parse_response(response_text)

        # Если ответ нечёткий или низкая уверенность – используем усиленный keyword-анализ
        if verdict.get("verdict") == "неизвестно" or verdict.get("confidence", 0) < 0.3:
            print(
                "⚠️ Нечеткий ответ модели, использую расширенный анализ по ключевым словам"
            )
            verdict = _keyword_analysis(
                title, description, transcript_text, frame_analysis, dangerous_links
            )

    except Exception as e:
        print(f"❌ Ошибка LLM: {e}")
        verdict = _keyword_analysis(
            title, description, transcript_text, frame_analysis, dangerous_links
        )

    # Сохраняем результат
    base_path = Path("temp") / analyze_id
    verdict_path = base_path / "verdict.json"
    with open(verdict_path, "w", encoding="utf-8") as f:
        json.dump(verdict, f, ensure_ascii=False, indent=2)

    return verdict


def _parse_response(text: str) -> dict:
    """Парсит ответ модели, включая 'Уровень опасности'."""
    text = text.lower().strip()

    # Извлечение уровня опасности
    danger_level = 0
    match = re.search(r"уровень опасности:\s*(\d+)", text)
    if match:
        danger_level = int(match.group(1))
        danger_level = min(max(danger_level, 0), 100)
    else:
        # Если не найдено, пытаемся найти число после "уровень"
        match = re.search(r"уровень\s*опасности\s*[:\-]?\s*(\d+)", text)
        if match:
            danger_level = int(match.group(1))
            danger_level = min(max(danger_level, 0), 100)

    # Определяем is_dangerous на основе уровня
    is_dangerous = danger_level >= 50

    # Извлечение основного риска
    primary_risk = "не определен"
    risk_patterns = [
        (r"основной риск:\s*казино", "казино"),
        (r"основной риск:\s*пирамид", "пирамида"),
        (r"основной риск:\s*инвестиц", "инвестиции"),
        (r"основной риск:\s*крипто", "крипто"),
        (r"основной риск:\s*реферал", "рефералы"),
        (r"основной риск:\s*понци", "понци"),
        (r"основной риск:\s*нет риска", "нет риска"),
    ]
    for pattern, risk in risk_patterns:
        if re.search(pattern, text):
            primary_risk = risk
            break

    # Уверенность
    confidence = 0.7
    match = re.search(r"уверенность:\s*([0-9.]+)", text)
    if match:
        try:
            confidence = float(match.group(1))
            confidence = min(max(confidence, 0), 1)
        except:
            pass

    reason_ru = "Анализ на основе предоставленных данных"
    reason_en = "Analysis based on provided data"
    reason_kz = "Берілген деректерге негізделген талдау"

    # Ищем причину на русском
    match_ru = re.search(r"причина_ru:\s*(.+?)(?:\n|$)", text, re.IGNORECASE)
    if match_ru:
        reason_ru = match_ru.group(1).strip()[:200]
    
    # Ищем причину на английском
    match_en = re.search(r"причина_en:\s*(.+?)(?:\n|$)", text, re.IGNORECASE)
    if match_en:
        reason_en = match_en.group(1).strip()[:200]
    
    # Ищем причину на казахском
    match_kz = re.search(r"причина_kz:\s*(.+?)(?:\n|$)", text, re.IGNORECASE)
    if match_kz:
        reason_kz = match_kz.group(1).strip()[:200]

    if not match_ru and not match_en and not match_kz:
        match = re.search(r"причина:\s*(.+?)(?:\n|$)", text, re.IGNORECASE)
        if match:
            reason_ru = match.group(1).strip()[:200]
            reason_en = reason_ru
            reason_kz = reason_ru

    return {
        "is_dangerous": is_dangerous,
        "danger_level": danger_level,
        "confidence": confidence,
        "verdict": "опасный" if is_dangerous else "безопасный",
        "reason_ru": reason_ru,
        "reason_en": reason_en,
        "reason_kz": reason_kz,
        "reason": reason_ru,
        "primary_risk": primary_risk,
    }


def _keyword_analysis(
    title: str,
    description: str,
    transcript: str,
    frame_analysis: dict,
    dangerous_links: int,
) -> dict:
    """
    Улучшенный анализ по ключевым словам с учётом предупреждений, призывов и ссылок.
    Возвращает словарь с полями, аналогичными _parse_response.
    """
    full_text = f"{title} {description} {transcript}".lower()

    # Добавляем OCR текст
    ocr_texts = frame_analysis.get("ocr_texts", [])
    ocr_combined = " ".join([text for _, text in ocr_texts]).lower()
    full_text += " " + ocr_combined

    # Списки ключевых слов
    casino_words = [
        "казино",
        "casino",
        "джекпот",
        "jackpot",
        "слот",
        "slot",
        "рулетка",
        "roulette",
        "ставка",
        "bet",
        "выиграл",
        "победил",
        "занос",
        "игровой автомат",
    ]
    pyramid_words = [
        "пирамид",
        "матрица",
        "пассивный доход",
        "быстрый заработок",
        "приглашай друзей",
        "реферал",
        "mlm",
    ]
    invest_words = [
        "инвестиц",
        "трейдинг",
        "форекс",
        "forex",
        "криптовалют",
        "бинарные опционы",
        "доходность",
        "гарантированный доход",
    ]

    # Призывные фразы
    call_phrases = [
        "зарегистрируйся",
        "регистрируйся",
        "инвестируй",
        "вложи",
        "пополни",
        "играй",
        "выиграй",
        "получи бонус",
        "жми сюда",
        "переходи по ссылке",
        "начни зарабатывать",
        "стань участником",
        "присоединяйся",
        "скачай",
        "открой счёт",
        "торгуй",
        "купи",
        "введи промокод",
    ]

    # Предупреждающие фразы
    warning_phrases = [
        "не всегда",
        "риск",
        "осторожно",
        "предупреждение",
        "опасность",
        "не советую",
        "минусы",
        "проигрыш",
        "потеря",
        "обман",
        "мошенничество",
        "не рекомендую",
        "будьте осторожны",
        "не ведитесь",
        "не играйте",
        "это ловушка",
        "вы рискуете",
        "можете потерять",
        "не гарантирует",
        "азартные игры опасны",
        "зависимость",
        "не стоит",
        "думайте",
    ]

    # Поиск упоминаний
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

    # Определяем основной риск
    primary_risk = "не определен"
    if risk_types:
        risk_counts = Counter(risk_types)
        primary_risk = risk_counts.most_common(1)[0][0]

    # Проверка призывов и предупреждений
    has_call = any(phrase in full_text for phrase in call_phrases)
    has_warning = any(phrase in full_text for phrase in warning_phrases)

    # Учитываем визуальные маркеры
    object_counts = frame_analysis.get("object_counts", {})
    has_visual = frame_analysis.get("has_visual_markers", False)
    scheme_type = frame_analysis.get("scheme_type", "")

    # Вычисляем базовый уровень опасности
    base_level = 0
    if found:
        base_level = min(40 + len(found) * 5, 70)  # упоминания дают до 70%
    if has_visual:
        base_level = max(base_level, 50)  # визуальные маркеры поднимают до 50-70%
    if scheme_type in ["illegal_casino", "financial_pyramid", "investment_scam"]:
        base_level = max(base_level, 60)
    if has_call:
        base_level = max(base_level, 80)  # призывы дают 80-100
    # Если есть и призыв и визуал – до 100
    if has_call and has_visual:
        base_level = min(base_level + 10, 100)

    # Смягчение при предупреждениях
    if has_warning:
        base_level = max(base_level - 30, 0)

    # Учёт опасных ссылок
    if dangerous_links > 0:
        base_level = min(base_level + 15 * dangerous_links, 100)

    # Итоговый уровень
    danger_level = min(max(base_level, 0), 100)
    is_dangerous = danger_level >= 50
    confidence = 0.5 + (danger_level / 200)  # от 0.5 до 1.0

    # Формируем причину
    if has_warning and not has_call:
        reason_ru = "Видео содержит предупреждения о рисках, призывы отсутствуют"
        reason_en = "The video contains risk warnings, no calls to action"
        reason_kz = "Бейнеде тәуекелдер туралы ескертулер бар, шақырулар жоқ"
    elif has_call and not has_warning:
        reason_ru = "Обнаружены прямые призывы к действию"
        reason_en = "Direct calls to action detected"
        reason_kz = "Тікелей әрекетке шақырулар анықталды"
    elif has_visual:
        objects = ', '.join(object_counts.keys())
        reason_ru = f"Обнаружены визуальные маркеры: {objects}"
        reason_en = f"Visual markers detected: {objects}"
        reason_kz = f"Визуалды маркерлер анықталды: {objects}"
    else:
        reason_ru = "Анализ по ключевым словам"
        reason_en = "Keyword-based analysis"
        reason_kz = "Кілт сөздер негізінде талдау"

    if dangerous_links > 0:
        reason_ru += f", обнаружены ссылки на подозрительные ресурсы ({dangerous_links})"
        reason_en += f", suspicious links detected ({dangerous_links})"
        reason_kz += f", күдікті сілтемелер анықталды ({dangerous_links})"

    return {
        "is_dangerous": is_dangerous,
        "danger_level": danger_level,
        "confidence": confidence,
        "verdict": "опасный" if is_dangerous else "безопасный",
        "reason_ru": reason_ru[:200],
        "reason_en": reason_en[:200],
        "reason_kz": reason_kz[:200],
        "reason": reason_ru,
        "primary_risk": primary_risk,
    }
