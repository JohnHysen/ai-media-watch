"""
Анализ кадров – улучшенная система скоринга с весами и временной фильтрацией.
Минимум ложных срабатываний.
"""

from pathlib import Path
import cv2
import numpy as np
import base64
from collections import Counter, defaultdict
import json
import math

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

try:
    import easyocr
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# ========== КОНФИГУРАЦИЯ ==========
POSITIVE_WEIGHTS = {
    "slot_machine": 5.0,
    "roulette": 5.0,
    "chips": 4.0,
    "cards": 3.0,
    "money": 2.5,
    "charts": 2.0,
    "pyramid": 4.0,
    "luxury": 1.5,
}
NEGATIVE_WEIGHTS = {
    "nature": -3.0,
    "office": -2.0,
    "people_only": -1.0,
}
RISK_THRESHOLD = 6.0
MIN_FRAMES_RATIO = 0.05   # 5% кадров
MIN_ABSOLUTE_FRAMES = 3

_yolo_model = None
_ocr_reader = None
MODELS_DIR = Path("models")
YOLO_MODEL_PATH = MODELS_DIR / "yolo" / "yolov8n.pt"

def get_yolo_model():
    global _yolo_model
    if _yolo_model is None and YOLO_AVAILABLE:
        if YOLO_MODEL_PATH.exists():
            _yolo_model = YOLO(str(YOLO_MODEL_PATH))
        else:
            _yolo_model = YOLO("yolov8n.pt")
    return _yolo_model

def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None and OCR_AVAILABLE:
        _ocr_reader = easyocr.Reader(["ru", "en"], gpu=True)
    return _ocr_reader


def get_first_frame_base64(analyze_id: str):
    base_path = Path("temp") / analyze_id
    frames_dir = base_path / "frames"
    if not frames_dir.exists():
        return None
    frame_files = sorted(frames_dir.glob("frame_*.jpg"))
    if not frame_files:
        return None
    first_frame = frame_files[0]
    try:
        with open(first_frame, "rb") as f:
            image_data = f.read()
        return "data:image/jpeg;base64," + base64.b64encode(image_data).decode("utf-8")
    except Exception:
        return None


def analyze_frames(analyze_id: str) -> dict:
    base_path = Path("temp") / analyze_id
    frames_dir = base_path / "frames"
    if not frames_dir.exists():
        return _empty_result()

    frame_files = sorted(frames_dir.glob("frame_*.jpg"))
    if not frame_files:
        return _empty_result()

    total_frames = len(frame_files)
    yolo = get_yolo_model() if YOLO_AVAILABLE else None
    ocr = get_ocr_reader() if OCR_AVAILABLE else None

    # Храним для каждого кадра накопленные положительные и отрицательные баллы
    frame_pos_scores = []   # список dict {object: score}
    frame_neg_scores = []   # список dict {signal: score}
    ocr_texts = []

    for idx, frame_path in enumerate(frame_files):
        timestamp = idx
        img = cv2.imread(str(frame_path))
        if img is None:
            continue

        pos_scores = defaultdict(float)
        neg_scores = defaultdict(float)

        # 1. YOLO – люди и машины (для контекста)
        has_car = False
        has_person = False
        if yolo is not None:
            results = yolo(img, verbose=False)
            for r in results:
                for box in r.boxes:
                    label = r.names[int(box.cls[0])]
                    if label == "person":
                        has_person = True
                    elif label == "car":
                        has_car = True

        # 2. Положительные детекторы (возвращают уверенность 0..1)
        score = _detect_slot_machine_score(img)
        if score > 0.3:
            pos_scores["slot_machine"] += score

        score = _detect_roulette_score(img)
        if score > 0.3:
            pos_scores["roulette"] += score

        score = _detect_poker_chips_score(img)
        if score > 0.3:
            pos_scores["chips"] += score

        score = _detect_cards_score(img)
        if score > 0.3:
            pos_scores["cards"] += score

        score = _detect_banknotes_score(img)
        if score > 0.3:
            pos_scores["money"] += score

        score = _detect_charts_score(img)
        if score > 0.3:
            pos_scores["charts"] += score

        score = _detect_pyramid_score(img)
        if score > 0.3:
            pos_scores["pyramid"] += score

        # 3. Роскошь – комбинируем с YOLO (car)
        if has_car:
            luxury_score = _detect_luxury_score(img)
            if luxury_score > 0.3:
                pos_scores["luxury"] += luxury_score * 1.2   # бонус за машину

        # 4. Негативные сигналы
        nature_score = _detect_nature_score(img)
        if nature_score > 0.5:
            neg_scores["nature"] += nature_score

        office_score = _detect_office_score(img)
        if office_score > 0.5:
            neg_scores["office"] += office_score

        # Если есть человек, но нет положительных объектов – это people_only
        if has_person and not pos_scores:
            neg_scores["people_only"] += 0.8

        # OCR – добавляем только если есть значимый текст
        if ocr is not None and pos_scores:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                           cv2.THRESH_BINARY, 11, 2)
            results = ocr.readtext(thresh, paragraph=True, detail=0)
            if results:
                text = " ".join(results).lower()
                ocr_texts.append((timestamp, text))
                # Усиливаем положительные баллы, если в тексте есть ключевые слова
                if any(word in text for word in ["spin", "bonus", "jackpot", "casino", "slot"]):
                    pos_scores["slot_machine"] += 0.5
                if any(word in text for word in ["roulette", "red", "black"]):
                    pos_scores["roulette"] += 0.5
                if any(word in text for word in ["chips", "poker", "bet"]):
                    pos_scores["chips"] += 0.5
                if any(word in text for word in ["pyramid", "matrix", "mlm", "referral"]):
                    pos_scores["pyramid"] += 0.5

        # Сохраняем scores для этого кадра
        frame_pos_scores.append(pos_scores)
        frame_neg_scores.append(neg_scores)

    # ======= АГРЕГАЦИЯ ПО КАДРАМ =======
    # Суммируем положительные баллы по каждому объекту
    total_pos = defaultdict(float)
    for pos_dict in frame_pos_scores:
        for obj, score in pos_dict.items():
            total_pos[obj] += score

    # Суммируем негативные баллы
    total_neg = defaultdict(float)
    for neg_dict in frame_neg_scores:
        for sig, score in neg_dict.items():
            total_neg[sig] += score

    # Нормализуем по количеству кадров (средний балл на кадр)
    avg_pos = {obj: (score / total_frames) for obj, score in total_pos.items()}
    avg_neg = {sig: (score / total_frames) for sig, score in total_neg.items()}

    # Преобразуем в итоговый риск-скор
    risk_score = 0.0
    object_counts = Counter()
    for obj, avg_score in avg_pos.items():
        if avg_score > 0.01:  # игнорируем очень маленькие
            weight = POSITIVE_WEIGHTS.get(obj, 1.0)
            # Умножаем вес на средний балл, но учитываем частоту появления (кадры)
            # Используем количество кадров, где объект появился
            frame_count = sum(1 for pos in frame_pos_scores if pos.get(obj, 0) > 0.1)
            if frame_count >= min(MIN_ABSOLUTE_FRAMES, total_frames * MIN_FRAMES_RATIO):
                risk_score += weight * avg_score * (frame_count / total_frames)
                object_counts[obj] = frame_count

    # Применяем негативные сигналы
    for sig, avg_score in avg_neg.items():
        if avg_score > 0.05:
            weight = NEGATIVE_WEIGHTS.get(sig, 0)
            risk_score += weight * avg_score

    # Принимаем решение
    scheme_type = "clean"
    has_visual_markers = False
    if risk_score >= RISK_THRESHOLD:
        has_visual_markers = True
        # Определяем тип схемы по доминирующему объекту
        scheme_type = _determine_scheme_type(Counter(object_counts))

    # Количество подозрительных кадров – те, где сумма положительных баллов > 0.3
    suspicious_frames = sum(1 for pos in frame_pos_scores if sum(pos.values()) > 0.3)

    result = {
        "total_frames": total_frames,
        "suspicious_frames": suspicious_frames,
        "suspicious_percentage": round((suspicious_frames / total_frames) * 100, 2) if total_frames else 0.0,
        "object_counts": dict(object_counts),
        "ocr_texts": ocr_texts[:20],
        "timeline": [],  # можно заполнить при желании
        "has_visual_markers": has_visual_markers,
        "scheme_type": scheme_type,
        "risk_score": round(risk_score, 2),  # добавим для отладки
    }

    result_path = base_path / "frame_analysis.json"
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"📊 Найдено кадров: {total_frames}, риск-скор: {risk_score:.2f}, схема: {scheme_type}")
    return result


def _empty_result():
    return {
        "total_frames": 0,
        "suspicious_frames": 0,
        "suspicious_percentage": 0.0,
        "object_counts": {},
        "ocr_texts": [],
        "timeline": [],
        "has_visual_markers": False,
        "scheme_type": "clean",
        "risk_score": 0.0,
    }


# ======== ДЕТЕКТОРЫ С ВОЗВРАТОМ УВЕРЕННОСТИ ========

def _detect_slot_machine_score(img) -> float:
    """Возвращает уверенность (0..1) в наличии слота."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    found = 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 5000 or area > 0.8 * h * w:
            continue
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            x, y, w2, h2 = cv2.boundingRect(cnt)
            aspect = w2 / h2 if h2 > 0 else 0
            if 0.8 < aspect < 1.5:
                roi = gray[y:y+h2, x:x+w2]
                edges_roi = cv2.Canny(roi, 50, 150)
                lines = cv2.HoughLinesP(edges_roi, 1, np.pi/180, threshold=50, minLineLength=20)
                if lines is not None:
                    h_lines = sum(1 for line in lines if abs(np.arctan2(line[0][3]-line[0][1], line[0][2]-line[0][0]) * 180 / np.pi) < 20)
                    v_lines = sum(1 for line in lines if abs(np.arctan2(line[0][3]-line[0][1], line[0][2]-line[0][0]) * 180 / np.pi) > 70)
                    if h_lines > 4 and v_lines > 4:
                        mean, std = cv2.meanStdDev(roi)
                        if std[0][0] > 40:
                            found += 1
                            break
    return min(1.0, found / 2.0)  # если нашли хотя бы один слот


def _detect_roulette_score(img) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    circles = cv2.HoughCircles(edges, cv2.HOUGH_GRADIENT, 1, 20, param1=50, param2=30)
    if circles is None or len(circles[0]) < 2:
        return 0.0
    circles = circles[0]
    circles = sorted(circles, key=lambda x: x[2], reverse=True)
    outer, inner = circles[0], circles[1]
    if np.linalg.norm(np.array(outer[:2]) - np.array(inner[:2])) > 10:
        return 0.0
    cx, cy, r = outer.astype(int)
    roi = img[cy-r:cy+r, cx-r:cx+r]
    if roi.shape[0] < 50:
        return 0.0
    gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    angles = np.linspace(0, 2*np.pi, 36)
    values = []
    for angle in angles:
        x = int(r + (r-5) * np.cos(angle))
        y = int(r + (r-5) * np.sin(angle))
        if 0 <= x < roi.shape[1] and 0 <= y < roi.shape[0]:
            values.append(gray_roi[y, x])
    if len(values) > 10:
        transitions = sum(1 for i in range(1, len(values)) if abs(values[i] - values[i-1]) > 30)
        if transitions > 8:
            return 1.0
    return 0.0


def _detect_poker_chips_score(img) -> float:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    colors = [([0,80,80],[10,255,255]), ([110,80,80],[130,255,255]), ([40,80,80],[80,255,255]), ([0,0,200],[180,30,255])]
    total = 0
    for lower, upper in colors:
        mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
        kernel = np.ones((5,5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        circles = cv2.HoughCircles(mask, cv2.HOUGH_GRADIENT, 1, 20, param1=50, param2=20, minRadius=15, maxRadius=50)
        if circles is not None:
            total += len(circles[0])
    return min(1.0, total / 10.0)  # 10 фишек = 100%


def _detect_cards_score(img) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    found = 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 500:
            continue
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) >= 8:
            x, y, w, h = cv2.boundingRect(cnt)
            aspect = w / h if h > 0 else 0
            if 0.7 < aspect < 1.4:
                roi = img[y:y+h, x:x+w]
                hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
                mask_red = cv2.inRange(hsv_roi, np.array([0,50,50]), np.array([10,255,255]))
                mask_black = cv2.inRange(hsv_roi, np.array([0,0,0]), np.array([180,255,50]))
                if np.sum(mask_red > 0) > 100 or np.sum(mask_black > 0) > 100:
                    found += 1
                    if found >= 2:
                        return 1.0
    return 0.0


def _detect_banknotes_score(img) -> float:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_green = np.array([40,50,50])
    upper_green = np.array([80,255,255])
    mask_green = cv2.inRange(hsv, lower_green, upper_green)
    green_percentage = np.sum(mask_green > 0) / (mask_green.shape[0] * mask_green.shape[1])
    if green_percentage < 0.1:
        return 0.0
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 3000:
            continue
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(cnt)
            aspect = w / h if h > 0 else 0
            if 1.8 < aspect < 2.8 or 0.35 < aspect < 0.55:
                roi = gray[y:y+h, x:x+w]
                grad_x = cv2.Sobel(roi, cv2.CV_64F, 1, 0, ksize=3)
                grad_y = cv2.Sobel(roi, cv2.CV_64F, 0, 1, ksize=3)
                mag = np.sqrt(grad_x**2 + grad_y**2)
                if np.mean(mag) > 30:
                    return 0.8  # высокая уверенность
    return 0.0


def _detect_charts_score(img) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=80, minLineLength=50)
    if lines is None:
        return 0.0
    h_lines = sum(1 for line in lines if abs(np.arctan2(line[0][3]-line[0][1], line[0][2]-line[0][0]) * 180 / np.pi) < 20)
    v_lines = sum(1 for line in lines if abs(np.arctan2(line[0][3]-line[0][1], line[0][2]-line[0][0]) * 180 / np.pi) > 70)
    if h_lines > 4 and v_lines > 4:
        return 1.0
    return 0.0


def _detect_pyramid_score(img) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        approx = cv2.approxPolyDP(cnt, 0.04 * cv2.arcLength(cnt, True), True)
        if len(approx) == 3:
            area = cv2.contourArea(cnt)
            if area > 1500:
                return 1.0
    return 0.0


def _detect_luxury_score(img) -> float:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_red = np.array([0,100,100])
    upper_red = np.array([10,255,255])
    mask_red = cv2.inRange(hsv, lower_red, upper_red)
    red_percentage = np.sum(mask_red > 0) / (mask_red.shape[0] * mask_red.shape[1])
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    bright = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)[1]
    bright_percentage = np.sum(bright > 0) / (bright.shape[0] * bright.shape[1])
    if red_percentage > 0.1 and bright_percentage > 0.25:
        return 1.0
    return 0.0


# ---------- НЕГАТИВНЫЕ СИГНАЛЫ ----------

def _detect_nature_score(img) -> float:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # Зелёный (трава, деревья)
    lower = np.array([35, 50, 50])
    upper = np.array([85, 255, 255])
    mask = cv2.inRange(hsv, lower, upper)
    perc = np.sum(mask > 0) / (mask.shape[0] * mask.shape[1])
    return min(1.0, perc / 0.3)  # если >30% зелени – высокий негатив


def _detect_office_score(img) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Ищем столы, стулья (прямоугольники с высокими краями) – упрощённо
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    rect_count = 0
    for cnt in contours:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            area = cv2.contourArea(cnt)
            if 500 < area < 20000:
                rect_count += 1
    return min(1.0, rect_count / 10.0)


def _determine_scheme_type(object_counts: Counter) -> str:
    if not object_counts:
        return "clean"
    risk_map = {
        "slot_machine": "illegal_casino",
        "roulette": "illegal_casino",
        "chips": "illegal_casino",
        "cards": "illegal_casino",
        "money": "investment_scam",
        "pyramid": "financial_pyramid",
        "charts": "investment_scam",
        "luxury": "investment_scam",
    }
    scores = {"illegal_casino": 0, "financial_pyramid": 0, "investment_scam": 0}
    for obj, count in object_counts.items():
        risk = risk_map.get(obj)
        if risk in scores:
            scores[risk] += count
    if max(scores.values()) == 0:
        return "clean"
    return max(scores, key=scores.get)