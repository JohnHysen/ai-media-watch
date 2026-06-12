import yt_dlp
from pathlib import Path
import json

def get_video_metadata(analyze_id: str, url: str) -> dict:
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        
        metadata = {
            'title': info.get('title', ''),
            'description': info.get('description', ''),
            'uploader': info.get('uploader', ''),
            'duration': info.get('duration', 0),
            'view_count': info.get('view_count', 0),
            'like_count': info.get('like_count', 0),
            'tags': info.get('tags', []),
            'categories': info.get('categories', []),
        }
        
        from pathlib import Path
        import json
        
        base_path = Path("temp") / analyze_id
        base_path.mkdir(parents=True, exist_ok=True)
        metadata_path = base_path / "metadata.json"
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        return metadata