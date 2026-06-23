import asyncio
import sys
from playwright.async_api import async_playwright
from queue_client import add_video_to_queue

# Убираем блок переопределения stdout/stderr – он уже есть в main_parser.py

async def parse_tiktok(keywords: list, limit_per_keyword: int = 5) -> int:
    added = 0
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()
        await page.set_extra_http_headers({
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        })

        for keyword in keywords:
            print(f"🔍 Поиск в TikTok: '{keyword}'")
            search_url = f"https://www.tiktok.com/search?q={keyword.replace(' ', '%20')}"
            try:
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                try:
                    await page.wait_for_selector('a[href*="/video/"]', timeout=15000)
                except Exception:
                    print(f"  ⚠️ Не найдено видео для '{keyword}', пропускаем.")
                    continue

                for _ in range(3):
                    await page.mouse.wheel(0, 800)
                    await asyncio.sleep(1.5)

                links = await page.eval_on_selector_all(
                    'a[href*="/video/"]',
                    'els => els.map(el => el.href)'
                )
                unique_links = list(dict.fromkeys(links))[:limit_per_keyword]
                print(f"  Найдено уникальных ссылок: {len(unique_links)}")

                for link in unique_links:
                    try:
                        result = await add_video_to_queue(link)
                        print(f"  ✅ Добавлено: {link} – {result.get('message', 'OK')}")
                        added += 1
                    except Exception as e:
                        print(f"  ❌ Ошибка добавления {link}: {e}")
                    await asyncio.sleep(0.5)

            except Exception as e:
                print(f"  ❌ Ошибка при обработке '{keyword}': {e}")
                continue

        await browser.close()
        return added