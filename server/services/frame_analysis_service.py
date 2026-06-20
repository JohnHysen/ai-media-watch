# services/frame_analysis_service.py
"""
Анализ кадров на визуальные маркеры финансовых преступлений с использованием YOLO
"""

from pathlib import Path
import cv2
import numpy as np
import json
import base64
from ultralytics import YOLO

# ========== Глобальная загрузка модели YOLO ==========
_yolo_model = None

MODELS_DIR = Path("models")
YOLO_MODEL_PATH = MODELS_DIR / "yolo" / "yolov8n.pt"

def get_yolo_model():
    global _yolo_model
    if _yolo_model is None:
        print("📥 Загрузка YOLO модели...")
        YOLO_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        _yolo_model = YOLO(str(YOLO_MODEL_PATH))
        print(f"✅ YOLO модель загружена из {YOLO_MODEL_PATH}")
    return _yolo_model


# ========== Специфические классы для финансовых преступлений ==========
# COCO классы, которые могут указывать на финансовые преступления
FINANCIAL_CLASSES = {
    # Казино и азартные игры
    'casino_related': {
        'classes': [0, 1, 2, 3, 4, 5, 6],  # person, bicycle, car, motorcycle, airplane, bus, train
        'keywords': ['person', 'money', 'cards', 'chips', 'slot machine']
    },
    # Роскошь и деньги
    'luxury_related': {
        'classes': [0, 2, 3, 7, 8, 9, 10],  # person, car, motorcycle, truck, boat, traffic light, fire hydrant
        'keywords': ['person', 'car', 'money', 'luxury']
    },
    # Компьютеры и трейдинг
    'trading_related': {
        'classes': [73, 74, 75, 76, 77],  # laptop, mouse, remote, keyboard, cell phone
        'keywords': ['laptop', 'computer', 'phone', 'screen']
    }
}

# Специфические маркеры для детекции на кадрах
FINANCIAL_MARKERS = {
    'casino': {
        'objects': ['person', 'cell phone', 'laptop'],
        'patterns': ['multiple_persons', 'screen_content']
    },
    'money': {
        'objects': ['person', 'cell phone'],
        'patterns': ['cash_visual', 'money_symbols']
    },
    'pyramid': {
        'objects': ['person'],
        'patterns': ['triangle_shape', 'hierarchy_diagram']
    }
}


def analyze_frames(analyze_id: str) -> dict:
    """
    Анализ кадров с использованием YOLO для детекции объектов
    """
    print(f"🔍 Анализ кадров для {analyze_id}")
    
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
            "money_markers": 0,
            "detected_objects": []
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
            "money_markers": 0,
            "detected_objects": []
        }
    
    # Загружаем YOLO модель
    model = get_yolo_model()
    
    # Статистика
    stats = {
        "casino_markers": 0,
        "pyramid_markers": 0,
        "investment_markers": 0,
        "money_markers": 0,
        "luxury_markers": 0,
        "call_to_action": 0
    }
    
    suspicious_frames = 0
    all_detected_objects = []
    
    # Анализируем каждый кадр
    for frame_path in frame_files:
        try:
            # Загружаем изображение
            img = cv2.imread(str(frame_path))
            if img is None:
                continue
            
            # YOLO инференс
            results = model(img, verbose=False)
            
            # Извлекаем детекции
            detected_objects = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        name = model.names[cls]
                        detected_objects.append({
                            'class': name,
                            'confidence': conf,
                            'class_id': cls
                        })
            
            if detected_objects:
                all_detected_objects.append({
                    'frame': frame_path.name,
                    'objects': detected_objects
                })
            
            # Анализируем объекты на наличие финансовых маркеров
            frame_markers = _analyze_with_yolo(detected_objects, img)
            
            if frame_markers.get('has_markers', False):
                suspicious_frames += 1
                for key in ['casino', 'pyramid', 'money', 'luxury', 'investment']:
                    if frame_markers.get(key, False):
                        stats[f"{key}_markers"] += 1
                        
        except Exception as e:
            print(f"⚠️ Ошибка анализа кадра {frame_path}: {e}")
            continue
    
    total_frames = len(frame_files)
    suspicious_percentage = (suspicious_frames / total_frames) * 100 if total_frames > 0 else 0
    
    # Определяем тип схемы
    scheme_type = _determine_scheme_type(stats, suspicious_frames)
    
    result = {
        "total_frames": total_frames,
        "suspicious_frames": suspicious_frames,
        "suspicious_percentage": round(suspicious_percentage, 2),
        "detected_markers": stats,
        "scheme_type": scheme_type,
        "is_suspicious": suspicious_frames > 0,
        "detected_objects": all_detected_objects[:20]  # сохраняем первые 20 для отладки
    }
    
    # Сохраняем результаты
    result_path = base_path / "frame_analysis.json"
    with open(result_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"📊 Найдено кадров: {len(frame_files)}, подозрительных: {suspicious_frames}")
    return result


def _analyze_with_yolo(detected_objects: list, img) -> dict:
    """
    Анализ детекций YOLO на предмет финансовых маркеров
    """
    result = {
        "has_markers": False,
        "casino": False,
        "pyramid": False,
        "money": False,
        "luxury": False,
        "investment": False
    }
    
    # Получаем список классов объектов
    classes = [obj['class'] for obj in detected_objects]
    class_count = {}
    for cls in classes:
        class_count[cls] = class_count.get(cls, 0) + 1
    
    # ===== Детекция КАЗИНО =====
    # Много людей + экраны (телефоны, ноутбуки) = возможно казино/игры
    people_count = class_count.get('person', 0)
    screens_count = class_count.get('cell phone', 0) + class_count.get('laptop', 0) + class_count.get('tv', 0)
    
    if people_count >= 2 and screens_count >= 1:
        result['casino'] = True
        result['has_markers'] = True
        print(f"🎰 Обнаружено КАЗИНО: {people_count} человек, {screens_count} экранов")
    
    # ===== Детекция ДЕНЕГ =====
    # Люди + телефоны + особые паттерны (может быть перевод денег)
    if people_count >= 1 and class_count.get('cell phone', 0) >= 1:
        # Проверяем через OpenCV наличие зеленого (доллары)
        if _has_money_pattern(img):
            result['money'] = True
            result['has_markers'] = True
            print("💰 Обнаружены ДЕНЬГИ (визуальный паттерн)")
    
    # ===== Детекция РОСКОШИ =====
    # Дорогие машины, яхты
    luxury_items = ['car', 'motorcycle', 'boat', 'airplane']
    for item in luxury_items:
        if class_count.get(item, 0) > 0:
            result['luxury'] = True
            result['has_markers'] = True
            print(f"🚗 Обнаружена РОСКОШЬ: {item}")
    
    # ===== Детекция ПИРАМИДЫ =====
    # Много людей в структурированном виде + презентации
    if people_count >= 3 and _has_pyramid_pattern(img):
        result['pyramid'] = True
        result['has_markers'] = True
        print("📊 Обнаружена ПИРАМИДА (структурный паттерн)")
    
    # ===== Детекция ИНВЕСТИЦИЙ =====
    # Люди + экраны с графиками + презентации
    if people_count >= 1 and screens_count >= 1 and _has_chart_pattern(img):
        result['investment'] = True
        result['has_markers'] = True
        print("📈 Обнаружены ИНВЕСТИЦИИ (графики/диаграммы)")
    
    return result


def _has_money_pattern(img) -> bool:
    """Проверка на наличие визуальных паттернов денег"""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Зеленый цвет долларов
    lower_green = np.array([40, 50, 50])
    upper_green = np.array([80, 255, 255])
    mask = cv2.inRange(hsv, lower_green, upper_green)
    green_percentage = np.sum(mask > 0) / (mask.shape[0] * mask.shape[1])
    
    return green_percentage > 0.08


def _has_pyramid_pattern(img) -> bool:
    """Проверка на пирамидальные структуры"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    triangle_count = 0
    for contour in contours:
        approx = cv2.approxPolyDP(contour, 0.04 * cv2.arcLength(contour, True), True)
        if len(approx) == 3:
            area = cv2.contourArea(contour)
            if area > 500:
                triangle_count += 1
                if triangle_count > 2:
                    return True
    return False


def _has_chart_pattern(img) -> bool:
    """Проверка на наличие графиков и диаграмм"""
    # Ищем линии и прямоугольники (характерно для графиков)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    
    # Ищем прямые линии (характерно для графиков)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=50)
    
    if lines is not None and len(lines) > 5:
        # Проверяем, есть ли пересечения (как на графиках)
        return True
    
    return False


def get_first_frame_base64(analyze_id: str) -> str:
    """Получение превью в base64"""
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


def _determine_scheme_type(stats: dict, suspicious_frames: int) -> str:
    """Определение типа схемы на основе статистики"""
    if suspicious_frames == 0:
        return "clean"
    
    total_markers = sum(stats.values())
    if total_markers == 0:
        return "unknown"
    
    casino_prob = stats.get("casino_markers", 0) / total_markers
    pyramid_prob = stats.get("pyramid_markers", 0) / total_markers
    investment_prob = stats.get("investment_markers", 0) / total_markers
    
    if casino_prob > 0.3:
        return "illegal_casino"
    elif pyramid_prob > 0.3:
        return "financial_pyramid"
    elif investment_prob > 0.3:
        return "investment_scam"
    else:
        return "suspicious_financial_content"