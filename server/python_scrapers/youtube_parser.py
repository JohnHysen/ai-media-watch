# youtube_parser.py
import scrapetube
from queue_client import add_video_to_queue
import asyncio

async def parse_youtube(keywords: list, limit_per_keyword: int = 5):
    added = 0
    for keyword in keywords:
        print(f"🎬 YouTube: поиск по '{keyword}'")
        try:
            videos = scrapetube.get_search(query=keyword, limit=limit_per_keyword)
            for video in videos:
                video_url = f"https://www.youtube.com/watch?v={video['videoId']}"
                try:
                    result = await add_video_to_queue(video_url)
                    print(f"  ✅ Добавлено: {video_url} – {result.get('message', 'OK')}")
                    added += 1
                except Exception as e:
                    print(f"  ❌ Ошибка добавления {video_url}: {e}")
        except Exception as e:
            print(f"  ❌ Ошибка парсинга YouTube для '{keyword}': {e}")
    return added