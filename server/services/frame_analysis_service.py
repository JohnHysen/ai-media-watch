# services/frame_analysis_service.py
"""
Анализ кадров на визуальные маркеры финансовых преступлений:
- Нелегальные казино (слоты, рулетка, фишки)
- Финансовые пирамиды (деньги, графики роста, роскошь)
- Инвестиционные схемы (графики, презентации, призывы)
"""

from pathlib import Path
import cv2
import numpy as np
import re
from PIL import Image
from datetime import datetime
import base64

def get_first_frame_base64(analyze_id: str) -> str:
    base_path = Path("temp") / analyze_id
    frames_dir = base_path / "frames"
    
    if not frames_dir.exists():
        print("⚠️ Папка с кадрами не найдена")
        return None
    
    frame_files = sorted(frames_dir.glob("frame_*.jpg"))
    
    if not frame_files:
        print("⚠️ Кадры не найдены")
        return None
    
    first_frame = frame_files[0]
    
    try:
        with open(first_frame, 'rb') as f:
            image_data = f.read()
        
        base64_string = base64.b64encode(image_data).decode('utf-8')
        
        data_url = f"data:image/jpeg;base64,{base64_string}"
        
        print(f"✅ Превью создано: {len(base64_string)} символов")
        return data_url
        
    except Exception as e:
        print(f"⚠️ Ошибка создания превью: {e}")
        return None

VISUAL_MARKERS = {
    "casino": [
        "slot machine", "roulette", "casino", "poker", "cards", 
        "chips", "dice", "slot", "jackpot", "blackjack"
    ],
    "money": [
        "cash", "money", "dollar", "euro", "rubles", "currency",
        "деньги", "наличные", "доллары", "евро", "рубли"
    ],
    "pyramid": [
        "pyramid", "matrix", "network", "levels", "referral",
        "пирамида", "матрица", "уровни", "структура", "сетка"
    ],
    "luxury": [
        "luxury", "mansion", "ferrari", "lamborghini", "yacht", 
        "private jet", "rich", "роскошь", "яхта", "особняк"
    ],
    "charts": [
        "graph", "chart", "profit", "growth", "investment returns",
        "график", "диаграмма", "рост", "прибыль", "доходность"
    ],
    "call_to_action": [
        "click here", "register", "invest now", "get started",
        "sign up", "зарегистрироваться", "инвестировать", "начать"
    ]
}

# Текстовые маркеры для OCR (если на кадре есть текст)
TEXT_MARKERS = [
    r"казино", r"casino", r"бонус", r"bonus",
    r"депозит", r"deposit", r"выигрыш", r"win",
    r"пассивный доход", r"пассивный заработок",
    r"гарантированный доход", r"доходность",
    r"приглашай друзей", r"реферал", r"матрица",
    r"инвестируй", r"инвест", r"трейдинг", r"forex",
    r"бинарные опционы", r"криптовалюта"
]


def analyze_frames(analyze_id: str) -> dict:
    print(f"🔍 Анализ кадров для {analyze_id}")
    """
    Анализ кадров на визуальные маркеры финансовых преступлений
    """
    base_path = Path("temp") / analyze_id
    frames_dir = base_path / "frames"
    
    if not frames_dir.exists():
        return {
            "total_frames": 0,
            "suspicious_frames": 0,
            "suspicious_percentage": 0.0,
            "detected_markers": {},
            "casino_markers": 0,
            "pyramid_markers": 0,
            "investment_markers": 0,
            "money_markers": 0
        }
    
    frame_files = sorted(frames_dir.glob("frame_*.jpg"))
    
    if not frame_files:
        return {
            "total_frames": 0,
            "suspicious_frames": 0,
            "suspicious_percentage": 0.0,
            "detected_markers": {},
            "casino_markers": 0,
            "pyramid_markers": 0,
            "investment_markers": 0,
            "money_markers": 0
        }
    
    # Статистика по типам маркеров
    stats = {
        "casino_markers": 0,
        "pyramid_markers": 0,
        "investment_markers": 0,
        "money_markers": 0,
        "luxury_markers": 0,
        "call_to_action": 0
    }
    
    suspicious_frames = 0
    
    for frame_path in frame_files:
        img = cv2.imread(str(frame_path))
        if img is None:
            continue
        
        # Анализ кадра
        frame_markers = _analyze_single_frame(img)
        
        # Если на кадре есть подозрительные маркеры
        if frame_markers["has_markers"]:
            suspicious_frames += 1
            
            # Обновляем статистику
            for marker_type in ["casino", "pyramid", "money", "luxury", "call_to_action"]:
                if frame_markers.get(marker_type, False):
                    stats[f"{marker_type}_markers"] += 1
            
            # Инвестиционные маркеры = деньги + графики
            if frame_markers.get("money", False) or frame_markers.get("charts", False):
                stats["investment_markers"] += 1
    
    # Рассчитываем проценты
    total_frames = len(frame_files)
    suspicious_percentage = (suspicious_frames / total_frames) * 100 if total_frames > 0 else 0
    
    # Определяем тип схемы на основе маркеров
    scheme_type = _determine_scheme_type(stats, suspicious_frames)
    
    result = {
        "total_frames": total_frames,
        "suspicious_frames": suspicious_frames,
        "suspicious_percentage": round(suspicious_percentage, 2),
        "detected_markers": stats,
        "scheme_type": scheme_type,
        "is_suspicious": suspicious_frames > 0
    }
    
    # Сохраняем результаты
    import json
    result_path = base_path / "frame_analysis.json"
    with open(result_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"📊 Найдено кадров: {len(frame_files)}")
    return result


def _analyze_single_frame(img) -> dict:
    """
    Анализ одного кадра на наличие визуальных маркеров
    """
    result = {
        "has_markers": False,
        "casino": False,
        "pyramid": False,
        "money": False,
        "luxury": False,
        "charts": False,
        "call_to_action": False
    }
    
    # 1. Поиск по цветовым сигнатурам и формам
    
    # Казино: поиск фишек, карт, рулетки
    if _detect_casino_elements(img):
        result["casino"] = True
        result["has_markers"] = True
    
    # Деньги: поиск купюр или долларовых знаков
    if _detect_money_elements(img):
        result["money"] = True
        result["has_markers"] = True
    
    # Пирамида: поиск пирамидальных структур
    if _detect_pyramid_structure(img):
        result["pyramid"] = True
        result["has_markers"] = True
    
    # Роскошь: дорогие машины, яхты и т.д.
    if _detect_luxury_items(img):
        result["luxury"] = True
        result["has_markers"] = True
    
    # 2. Анализ текста на кадре (OCR) - если нужно
    # Раскомментировать если установлен pytesseract
    # text = _extract_text_from_frame(img)
    # if _analyze_text_markers(text):
    #     result["call_to_action"] = True
    #     result["has_markers"] = True
    
    return result


def _detect_casino_elements(img):
    """Детекция элементов казино (фишки, карты, рулетка)"""
    # Конвертируем в HSV для лучшей детекции
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Фишки обычно ярких цветов (красный, синий, зеленый)
    # Ищем круглые объекты ярких цветов
    bright_colors = [
        ([0, 100, 100], [10, 255, 255]),    # красный
        ([110, 100, 100], [130, 255, 255]), # синий
        ([40, 100, 100], [80, 255, 255])    # зеленый
    ]
    
    for lower, upper in bright_colors:
        mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
        circles = cv2.HoughCircles(mask, cv2.HOUGH_GRADIENT, 1, 20)
        if circles is not None and len(circles[0]) > 3:
            return True
    
    return False


def _detect_money_elements(img):
    """Детекция денег (зеленый цвет для долларов, знаки валют)"""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Зеленый цвет долларов
    lower_green = np.array([40, 50, 50])
    upper_green = np.array([80, 255, 255])
    mask = cv2.inRange(hsv, lower_green, upper_green)
    
    # Если много зеленого - возможно деньги
    green_percentage = np.sum(mask > 0) / (mask.shape[0] * mask.shape[1])
    
    return green_percentage > 0.1


def _detect_pyramid_structure(img):
    """Детекция пирамидальных/матричных структур"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    
    # Поиск треугольных форм
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        approx = cv2.approxPolyDP(contour, 0.04 * cv2.arcLength(contour, True), True)
        # Ищем треугольники
        if len(approx) == 3:
            area = cv2.contourArea(contour)
            if area > 1000:  # Достаточно большой треугольник
                return True
    
    return False


def _detect_luxury_items(img):
    """Детекция признаков роскоши (дорогие машины, яхты и т.д.)"""
    # Упрощенная детекция: поиск характерных силуэтов
    # Для реального проекта нужно использовать обученную модель
    
    # Пока просто проверяем наличие красного цвета (Феррари/спорткары)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_red = np.array([0, 100, 100])
    upper_red = np.array([10, 255, 255])
    mask = cv2.inRange(hsv, lower_red, upper_red)
    
    red_percentage = np.sum(mask > 0) / (mask.shape[0] * mask.shape[1])
    
    return red_percentage > 0.15


def _extract_text_from_frame(img):
    """Извлечение текста из кадра (требует pytesseract)"""
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Улучшаем качество для OCR
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        text = pytesseract.image_to_string(gray, lang='rus+eng')
        return text.lower()
    except:
        return ""


def _analyze_text_markers(text: str) -> bool:
    """Анализ текста на наличие маркеров"""
    if not text:
        return False
    
    for marker in TEXT_MARKERS:
        if re.search(marker, text, re.IGNORECASE):
            return True
    return False


def _determine_scheme_type(stats: dict, suspicious_frames: int) -> str:
    """
    Определение типа финансовой схемы на основе обнаруженных маркеров
    """
    if suspicious_frames == 0:
        return "clean"
    
    total_markers = sum(stats.values())
    if total_markers == 0:
        return "unknown"
    
    # Расчет вероятности каждого типа
    casino_prob = stats.get("casino_markers", 0) / total_markers
    pyramid_prob = stats.get("pyramid_markers", 0) / total_markers
    investment_prob = stats.get("investment_markers", 0) / total_markers
    
    if casino_prob > 0.4:
        return "illegal_casino"
    elif pyramid_prob > 0.4:
        return "financial_pyramid"
    elif investment_prob > 0.4:
        return "investment_scam"
    else:
        return "suspicious_financial_content"