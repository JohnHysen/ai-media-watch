# services/metadata_service.py
import yt_dlp
from pathlib import Path
import json


def detect_platform(url: str) -> str:
    url_lower = url.lower()
    
    if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
        return 'youtube'
    elif 'tiktok.com' in url_lower:
        return 'tiktok'
    elif 'instagram.com' in url_lower:
        return 'instagram'
    else:
        return 'unknown'

def get_video_metadata(analyze_id: str, url: str) -> dict:
    
    platform = detect_platform(url)
    print(f"📱 Определена платформа: {platform}")
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'cookiefile': None,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    
    # Специфические опции для разных платформ
    if platform == 'tiktok':
        ydl_opts['headers'] = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
    
    metadata = {
        'title': '',
        'description': '',
        'uploader': '',
        'duration': 0,
        'view_count': 0,
        'like_count': 0,
        'tags': [],
        'categories': [],
        'platform': platform,
        'url': url
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if info:
                metadata.update({
                    'title': info.get('title', '') or info.get('fulltitle', ''),
                    'description': info.get('description', '') or info.get('alt_title', ''),
                    'uploader': info.get('uploader', '') or info.get('channel', ''),
                    'duration': info.get('duration', 0),
                    'view_count': info.get('view_count', 0) or info.get('views', 0),
                    'like_count': info.get('like_count', 0),
                    'tags': info.get('tags', []) or info.get('alt_tags', []),
                    'categories': info.get('categories', []) or info.get('alt_categories', []),
                })
                
                if platform == 'tiktok' and 'fulltitle' in info:
                    metadata['description'] = info.get('fulltitle', metadata['description'])
                
                if platform == 'instagram' and 'caption' in info:
                    metadata['description'] = info.get('caption', metadata['description'])
                
                print(f"📋 Название: {metadata['title'][:50]}...")
                print(f"👤 Автор: {metadata['uploader']}")
                print(f"⏱️ Длительность: {metadata['duration']} сек")
                print(f"👁️ Просмотров: {metadata['view_count']}")
                
    except Exception as e:
        print(f"⚠️ Ошибка при получении метаданных: {e}")
    
    base_path = Path("temp") / analyze_id
    base_path.mkdir(parents=True, exist_ok=True)
    metadata_path = base_path / "metadata.json"
    
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    return metadata