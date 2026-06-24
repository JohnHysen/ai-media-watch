# bot/handlers.py
import logging
import requests
import os
from telebot import types
import time

logger = logging.getLogger(__name__)

FASTAPI_URL = os.getenv("FASTAPI_URL", "http://localhost:8000")


def start_command(bot, message):
    """Обработчик команды /start"""
    user = message.from_user
    bot.send_message(
        message.chat.id,
        f"🤖 *AI Media Watch Bot*\n\n"
        f"Привет, {user.first_name}! 👋\n\n"
        f"Я помогаю выявлять финансовые преступления в видео.\n\n"
        f"📌 *Как использовать:*\n"
        f"• Отправь мне ссылку на видео с YouTube, TikTok или Instagram\n"
        f"• Я проанализирую видео и скажу, есть ли признаки мошенничества\n"
        f"• Оценю риски: казино, пирамиды, инвестиционные схемы\n\n"
        f"📖 *Команды:*\n"
        f"/start - показать это сообщение\n"
        f"/help - получить справку\n\n"
        f"🔗 *Поддерживаемые платформы:*\n"
        f"• YouTube\n"
        f"• TikTok\n"
        f"• Instagram\n\n"
        f"Попробуй отправить мне ссылку прямо сейчас! 🚀",
        parse_mode='Markdown'
    )


def help_command(bot, message):
    """Обработчик команды /help"""
    bot.send_message(
        message.chat.id,
        f"📖 *Помощь*\n\n"
        f"Отправь мне ссылку на видео, и я проверю его на признаки финансовых преступлений.\n\n"
        f"🎯 *Что я проверяю:*\n"
        f"• 🎰 Нелегальные казино и азартные игры\n"
        f"• 📊 Финансовые пирамиды и MLM-схемы\n"
        f"• 💰 Мошеннические инвестиции\n"
        f"• 🪙 Крипто-мошенничество\n"
        f"• 🔗 Реферальные схемы\n"
        f"• 🏦 Схемы Понци\n\n"
        f"⏱️ *Время ожидания:* обычно 1-3 минуты\n\n"
        f"Поддерживаемые платформы: YouTube, TikTok, Instagram",
        parse_mode='Markdown'
    )


def handle_video_analysis(bot, message):
    """Обработка видео - отправка запроса в FastAPI и возврат результата"""
    video_url = message.text.strip()
    
    # Отправляем сообщение о начале обработки
    processing_msg = bot.reply_to(
        message,
        f"🔍 *Начинаю анализ видео...*\n\n"
        f"📎 Ссылка: {video_url[:50]}...\n\n"
        f"⏳ Это может занять 1-3 минуты. Пожалуйста, подожди...",
    )
    
    try:
        # Отправляем запрос в FastAPI
        response = requests.get(
            f"{FASTAPI_URL}/analyze",
            params={"url": video_url},
            timeout=180
        )
        
        if response.status_code == 200:
            data = response.json()
            send_result(bot, message, data, processing_msg)
        else:
            bot.edit_message_text(
                f"❌ *Ошибка при анализе видео*\n\n"
                f"Статус: {response.status_code}\n"
                f"Пожалуйста, попробуй позже или проверь ссылку.",
                chat_id=processing_msg.chat.id,
                message_id=processing_msg.message_id,
                parse_mode='Markdown'
            )
            
    except requests.exceptions.Timeout:
        bot.edit_message_text(
            f"⏰ *Время ожидания истекло*\n\n"
            f"Анализ занял слишком много времени. Попробуй еще раз.",
            chat_id=processing_msg.chat.id,
            message_id=processing_msg.message_id,
            parse_mode='Markdown'
        )
    except Exception as e:
        logger.error(f"Ошибка при обработке видео: {e}")
        bot.edit_message_text(
            f"❌ *Произошла ошибка*\n\n"
            f"{str(e)[:200]}",
            chat_id=processing_msg.chat.id,
            message_id=processing_msg.message_id,
            parse_mode='Markdown'
        )


def send_result(bot, message, data, processing_msg):
    """Формирует и отправляет результат анализа"""
    
    is_dangerous = data.get("is_dangerous", False)
    verdict_text = data.get("verdict_text", "unknown")
    safety_percent = data.get("safety_percent", 0)
    primary_risk = data.get("primary_risk", "не определен")
    reason_ru = data.get("reason_ru", "")
    reason_en = data.get("reason_en", "")
    reason_kz = data.get("reason_kz", "")
    title = data.get("title", "Без названия")
    
    user_lang = message.from_user.language_code or 'ru'

    if user_lang and user_lang.startswith('en'):
        reason = reason_en or reason_ru or "No explanation available"
    elif user_lang and user_lang.startswith('kk'):
        reason = reason_kz or reason_ru or "Түсініктеме жоқ"
    else:
        reason = reason_ru or reason_en or "Нет объяснения"

    # Определяем эмодзи для вердикта
    if is_dangerous:
        verdict_emoji = "⚠️"
        verdict_label = "ОПАСНО"
        color = "🔴"
    elif verdict_text == "safe":
        verdict_emoji = "✅"
        verdict_label = "БЕЗОПАСНО"
        color = "🟢"
    else:
        verdict_emoji = "❓"
        verdict_label = "НЕОПРЕДЕЛЕННО"
        color = "🟡"
    
    # Определяем эмодзи для основного риска
    risk_emoji_map = {
        'казино': '🎰',
        'пирамида': '📊',
        'инвестиции': '💰',
        'крипто': '🪙',
        'рефералы': '🔗',
        'понци': '🏦'
    }
    risk_emoji = risk_emoji_map.get(primary_risk, '❓')
    
    # Формируем сообщение
    result_message = (
        f"{verdict_emoji} *Результат анализа видео*\n\n"
        f"📹 *Название:* {title[:100]}\n\n"
        f"⚖️ *Вердикт:* {color} {verdict_label}\n"
        f"🎯 *Основной риск:* {risk_emoji} {primary_risk}\n"
        f"📊 *Безопасность:* {safety_percent}%\n\n"
        f"📝 *Объяснение:*\n{reason[:300]}\n\n"
        f"🔗 [Открыть видео]({data.get('video_url')})"
    )
    
    # Клавиатура с действиями
    keyboard = types.InlineKeyboardMarkup()
    keyboard.row(types.InlineKeyboardButton("🔄 Проверить другое видео", callback_data="new_check"))
    keyboard.row(types.InlineKeyboardButton("📊 Моя статистика", callback_data="my_stats"))
    
    bot.edit_message_text(
        result_message,
        chat_id=processing_msg.chat.id,
        message_id=processing_msg.message_id,
        parse_mode='Markdown',
        disable_web_page_preview=False,
        reply_markup=keyboard
    )