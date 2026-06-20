import asyncio
from youtube_parser import parse_youtube
from tiktok_parser import parse_tiktok
# from instagram_parser import parse_instagram

KEYWORDS = [
    "казино", "онлайн казино", "игровые автоматы",
    "финансовые пирамиды", "инвестиции",
    "заработок в интернете", "пассивный доход",
    "криптовалюта", "трейдинг", "бинарные опционы"
]

LIMIT_PER_PLATFORM = 5   # сколько видео собирать по каждому запросу

async def main():
    print("🚀 Запуск парсинга видео...")
    total = 0

    # YouTube
    total += await parse_youtube(KEYWORDS, LIMIT_PER_PLATFORM)

    # TikTok
    total += await parse_tiktok(KEYWORDS, LIMIT_PER_PLATFORM)

    # Instagram (если есть)
    # total += await parse_instagram(KEYWORDS, LIMIT_PER_PLATFORM)

    print(f"✅ Всего добавлено видео в очередь: {total}")

if __name__ == "__main__":
    asyncio.run(main())