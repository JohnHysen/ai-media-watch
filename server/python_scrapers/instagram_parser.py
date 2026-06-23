# import asyncio
# from playwright.async_api import async_playwright
# from queue_client import add_video_to_queue

# async def parse_instagram(keywords, limit_per_keyword=5):
#     added = 0
#     async with async_playwright() as p:
#         browser = await p.chromium.launch(headless=True)
#         context = await browser.new_context(
#             user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
#         )
#         page = await context.new_page()

#         for keyword in keywords:
#             # Instagram search by hashtag
#             hashtag = keyword.replace(" ", "").lower()
#             url = f"https://www.instagram.com/explore/tags/{hashtag}/"
#             try:
#                 await page.goto(url, wait_until="domcontentloaded", timeout=30000)
#                 # Ждём появления постов
#                 await page.wait_for_selector('article a[href*="/p/"]', timeout=15000)
#                 # Собираем ссылки
#                 links = await page.eval_on_selector_all(
#                     'article a[href*="/p/"]',
#                     'els => els.map(el => el.href)'
#                 )
#                 unique = list(dict.fromkeys(links))[:limit_per_keyword]
#                 print(f"Instagram #{hashtag}: найдено {len(unique)} видео")

#                 for link in unique:
#                     # Instagram требует, чтобы ссылка была с shortcode
#                     # links уже содержат полный URL, например https://www.instagram.com/p/xyz/
#                     try:
#                         await add_video_to_queue(link)
#                         added += 1
#                     except Exception as e:
#                         print(f"Ошибка добавления {link}: {e}")
#                     await asyncio.sleep(1)
#             except Exception as e:
#                 print(f"Ошибка при поиске #{hashtag}: {e}")
#                 continue

#         await browser.close()
#         return added