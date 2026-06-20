import asyncio
import os
import re
from playwright.async_api import async_playwright
from queue_client import add_video_to_queue

# Файл для сохранения состояния браузера
STATE_FILE = "tiktok_state.json"

DEFAULT_KEYWORDS = [
    "казино", "онлайн казино", "игровые автоматы",
    "финансовые пирамиды", "инвестиции",
    "заработок в интернете", "пассивный доход",
    "криптовалюта", "трейдинг", "бинарные опционы"
]

async def parse_tiktok(keywords: list, limit_per_keyword: int = 5):
    """
    Парсит TikTok через Playwright с сохранением сессии.
    При первом запуске просит войти вручную, затем сохраняет состояние.
    При следующих запусках использует сохранённую сессию.
    """
    added = 0

    async with async_playwright() as p:
        # Запускаем браузер. Если сессия уже есть, можно скрыть окно (headless=True)
        browser = await p.chromium.launch(headless=False)  # можно True после сохранения сессии
        context = None

        # Проверяем, есть ли сохранённое состояние
        if os.path.exists(STATE_FILE):
            print("🔄 Загружаем сохранённую сессию TikTok...")
            context = await browser.new_context(storage_state=STATE_FILE)
        else:
            print("🔄 Сессия не найдена. Открываем браузер для входа...")
            context = await browser.new_context()
            page = await context.new_page()
            await page.goto("https://www.tiktok.com/")
            await page.wait_for_load_state("networkidle")
            print("👉 Войдите в TikTok вручную в открывшемся браузере.")
            input("⏳ После входа нажмите Enter, чтобы сохранить сессию...")
            # Сохраняем состояние (cookies + localStorage)
            await context.storage_state(path=STATE_FILE)
            print("✅ Сессия сохранена в файл 'tiktok_state.json'.")

        # Теперь у нас есть контекст с сессией
        page = await context.new_page()

        # Если сессия новая, можно перейти на главную для подстраховки
        await page.goto("https://www.tiktok.com/")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1)

        # Поиск по каждому ключевому слову
        for keyword in keywords:
            print(f"\n🔍 Ищем: '{keyword}'")
            search_url = f"https://www.tiktok.com/search?q={keyword.replace(' ', '%20')}"
            await page.goto(search_url)
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)

            # Прокрутка для подгрузки видео
            for _ in range(3):
                await page.mouse.wheel(0, 800)
                await asyncio.sleep(1)

            # Сбор ссылок на видео
            video_links = await page.eval_on_selector_all(
                'a[href*="/video/"]',
                'els => els.map(el => el.href)'
            )

            # Убираем дубли и ограничиваем количество
            unique_links = list(dict.fromkeys(video_links))[:limit_per_keyword]

            print(f"  Найдено ссылок: {len(unique_links)}")
            for link in unique_links:
                try:
                    result = await add_video_to_queue(link)
                    print(f"  ✅ Добавлено: {link} – {result.get('message', 'OK')}")
                    added += 1
                except Exception as e:
                    print(f"  ❌ Ошибка добавления {link}: {e}")
                await asyncio.sleep(0.3)

        await browser.close()
        return added

if __name__ == "__main__":
    count = asyncio.run(parse_tiktok(DEFAULT_KEYWORDS, 5))
    print(f"\n📊 Итоговое количество добавленных видео: {count}")