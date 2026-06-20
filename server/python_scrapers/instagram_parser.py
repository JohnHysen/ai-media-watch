# import asyncio
# import os
# import re
# import instaloader
# from queue_client import add_video_to_queue

# INSTAGRAM_USERNAME = "ваш_логин"  # должен совпадать с тем, для которого создана сессия

# DEFAULT_KEYWORDS = [
#     "казино", "онлайн казино", "игровые автоматы",
#     "финансовые пирамиды", "инвестиции",
#     "заработок в интернете", "пассивный доход",
#     "криптовалюта", "трейдинг", "бинарные опционы"
# ]

# def phrase_to_hashtag(phrase: str) -> str:
#     cleaned = re.sub(r'[^\w\s]', '', phrase)
#     cleaned = cleaned.replace(' ', '')
#     return cleaned.lower()

# async def parse_instagram(keywords: list, limit_per_keyword: int = 5):
#     added = 0

#     L = instaloader.Instaloader()

#     # Загружаем сессию из файла (не логинимся заново!)
#     try:
#         L.load_session_from_file(INSTAGRAM_USERNAME)
#         print(f"✅ Сессия загружена для {INSTAGRAM_USERNAME}")
#     except FileNotFoundError:
#         print("❌ Файл сессии не найден. Сначала выполните 'instaloader --login=ваш_логин' в терминале.")
#         return 0
#     except Exception as e:
#         print(f"❌ Ошибка загрузки сессии: {e}")
#         return 0

#     for keyword in keywords:
#         hashtag = phrase_to_hashtag(keyword)
#         print(f"🔍 Instagram: поиск по хештегу #{hashtag} (исходный: '{keyword}')")
#         try:
#             count = 0
#             posts = L.get_hashtag_posts(hashtag)
#             for post in posts:
#                 if count >= limit_per_keyword:
#                     break
#                 if post.is_video:
#                     video_url = f"https://www.instagram.com/p/{post.shortcode}/"
#                     try:
#                         result = await add_video_to_queue(video_url)
#                         print(f"  ✅ Добавлено: {video_url} – {result.get('message', 'OK')}")
#                         added += 1
#                         count += 1
#                     except Exception as e:
#                         print(f"  ❌ Ошибка добавления {video_url}: {e}")
#                 await asyncio.sleep(1.5)
#         except Exception as e:
#             print(f"  ❌ Ошибка при поиске по хештегу #{hashtag}: {e}")

#     return added

# if __name__ == "__main__":
#     count = asyncio.run(parse_instagram(DEFAULT_KEYWORDS, 5))
#     print(f"\n📊 Итоговое количество добавленных видео: {count}")