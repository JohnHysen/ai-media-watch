import asyncio
import sys
import json
import argparse
import os

# Принудительная установка UTF-8 для Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)

from youtube_parser import parse_youtube
from tiktok_parser import parse_tiktok

DEFAULT_KEYWORDS = [
    "казино", "онлайн казино", "игровые автоматы",
    "финансовые пирамиды", "инвестиции",
    "заработок в интернете", "пассивный доход",
    "криптовалюта", "трейдинг", "бинарные опционы"
]

DEFAULT_LIMIT = 5

async def run_scrapers(keywords=None, limit_per_platform=None):
    """
    Запускает все парсеры и возвращает словарь с результатами.
    """
    keywords = keywords or DEFAULT_KEYWORDS
    limit_per_platform = limit_per_platform or DEFAULT_LIMIT

    print(">>> Запуск парсинга видео...")
    total_added = 0
    results = {}

    # YouTube
    youtube_added = await parse_youtube(keywords, limit_per_platform)
    total_added += youtube_added
    results['youtube'] = youtube_added
    print(f"YouTube: добавлено {youtube_added} видео")

    # TikTok
    tiktok_added = await parse_tiktok(keywords, limit_per_platform)
    total_added += tiktok_added
    results['tiktok'] = tiktok_added
    print(f"TikTok: добавлено {tiktok_added} видео")

    results['total_added'] = total_added
    results['total_found'] = total_added

    print(f"Всего добавлено видео в очередь: {total_added}")
    return results

async def main():
    # Если запускается из командной строки, обрабатываем аргументы
    if len(sys.argv) > 1:
        parser = argparse.ArgumentParser()
        parser.add_argument('--keywords', nargs='+', help='Список ключевых слов')
        parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT, help='Лимит на запрос')
        parser.add_argument('--json', action='store_true', help='Выводить результат в JSON')
        args = parser.parse_args()

        keywords = args.keywords or DEFAULT_KEYWORDS
        limit = args.limit

        result = await run_scrapers(keywords, limit)
        if args.json:
            print(json.dumps(result, ensure_ascii=False))
        else:
            print(f"Результат: {result}")
    else:
        # Обычный запуск
        result = await run_scrapers()
        print(f"Результат: {result}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nПрервано пользователем")
        sys.exit(0)
    except Exception as e:
        print(f"Ошибка: {e}", file=sys.stderr)
        sys.exit(1)